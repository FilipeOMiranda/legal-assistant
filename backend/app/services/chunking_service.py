import re
from typing import List
from app.core.config import settings

# Marcadores de seções jurídicas comuns
SECOES_JURIDICAS = [
    r"^EMENTA[:\s]",
    r"^ACÓRDÃO[:\s]",
    r"^RELATÓRIO[:\s]",
    r"^FUNDAMENTAÇÃO[:\s]",
    r"^FUNDAMENTOS[:\s]",
    r"^DISPOSITIVO[:\s]",
    r"^CONCLUSÃO[:\s]",
    r"^DOS FATOS[:\s]",
    r"^DO DIREITO[:\s]",
    r"^DO PEDIDO[:\s]",
    r"^PEDIDO[:\s]",
    r"^TESE[:\s]",
    r"^I\s*[-–]\s",
    r"^II\s*[-–]\s",
    r"^III\s*[-–]\s",
    r"^\d+\.\s+[A-Z]",  # "1. RESCISÃO INDIRETA"
]

SECAO_PATTERN = re.compile("|".join(SECOES_JURIDICAS), re.MULTILINE | re.IGNORECASE)


def _estimar_tokens(texto: str) -> int:
    """Estimativa simples: ~1 token por 4 caracteres."""
    return len(texto) // 4


def _dividir_por_paragrafos(texto: str) -> List[str]:
    """Divide o texto em parágrafos não-vazios."""
    return [p.strip() for p in re.split(r"\n{2,}", texto) if p.strip()]


def chunkar_texto(texto: str, arquivo_nome: str) -> List[str]:
    """
    Divide o texto em chunks inteligentes para documentos jurídicos.

    Estratégia:
    1. Tenta respeitar seções jurídicas como fronteiras naturais
    2. Se um bloco for grande demais, subdivide por parágrafos
    3. Aplica overlap entre chunks para não perder contexto nas bordas
    """
    chunk_size = settings.CHUNK_SIZE
    overlap = settings.CHUNK_OVERLAP

    # Tentar dividir por seções jurídicas primeiro
    blocos = _dividir_por_secoes(texto)

    chunks = []
    buffer = ""

    for bloco in blocos:
        tokens_bloco = _estimar_tokens(bloco)
        tokens_buffer = _estimar_tokens(buffer)

        if tokens_bloco > chunk_size:
            # Bloco muito grande: salva buffer atual e subdivide o bloco
            if buffer.strip():
                chunks.append(buffer.strip())
                buffer = ""
            sub_chunks = _subdividir_bloco(bloco, chunk_size, overlap)
            chunks.extend(sub_chunks)

        elif tokens_buffer + tokens_bloco > chunk_size:
            # Adicionar este bloco estouraria o limite: salva e começa novo buffer
            if buffer.strip():
                chunks.append(buffer.strip())
            # Overlap: pegar o final do buffer anterior
            tail = _pegar_tail(buffer, overlap)
            buffer = tail + "\n\n" + bloco if tail else bloco

        else:
            buffer = (buffer + "\n\n" + bloco).strip() if buffer else bloco

    if buffer.strip():
        chunks.append(buffer.strip())

    # Rede de segurança: garante que nenhum chunk excede o limite da API de embeddings
    # (text-embedding-3-small aceita até 8192 tokens, usamos 7000 como margem)
    LIMITE_SEGURO = 7000
    chunks_validados: List[str] = []
    for c in chunks:
        if _estimar_tokens(c) > LIMITE_SEGURO:
            chunks_validados.extend(_split_por_caracteres(c, LIMITE_SEGURO, overlap))
        else:
            chunks_validados.append(c)

    return [c for c in chunks_validados if len(c.strip()) > 50]  # descartar chunks muito curtos


def _dividir_por_secoes(texto: str) -> List[str]:
    """Divide o texto nas seções jurídicas identificadas."""
    posicoes = [m.start() for m in SECAO_PATTERN.finditer(texto)]

    if not posicoes:
        # Sem seções identificadas: divide por parágrafos
        return _dividir_por_paragrafos(texto)

    blocos = []
    for i, inicio in enumerate(posicoes):
        fim = posicoes[i + 1] if i + 1 < len(posicoes) else len(texto)
        bloco = texto[inicio:fim].strip()
        if bloco:
            blocos.append(bloco)

    # Texto antes da primeira seção (cabeçalho, etc.)
    if posicoes[0] > 0:
        cabecalho = texto[: posicoes[0]].strip()
        if cabecalho:
            blocos.insert(0, cabecalho)

    return blocos


def _subdividir_bloco(bloco: str, chunk_size: int, overlap: int) -> List[str]:
    """Subdivide um bloco grande em chunks por parágrafos."""
    paragrafos = _dividir_por_paragrafos(bloco)
    chunks = []
    buffer = ""

    for p in paragrafos:
        # Se o próprio parágrafo já excede o chunk_size, força quebra por caracteres
        if _estimar_tokens(p) > chunk_size:
            if buffer.strip():
                chunks.append(buffer.strip())
                buffer = ""
            chunks.extend(_split_por_caracteres(p, chunk_size, overlap))
            continue

        if _estimar_tokens(buffer) + _estimar_tokens(p) > chunk_size:
            if buffer.strip():
                chunks.append(buffer.strip())
            tail = _pegar_tail(buffer, overlap)
            buffer = tail + "\n\n" + p if tail else p
        else:
            buffer = (buffer + "\n\n" + p).strip() if buffer else p

    if buffer.strip():
        chunks.append(buffer.strip())

    return chunks


def _split_por_caracteres(texto: str, chunk_size: int, overlap: int) -> List[str]:
    """
    Quebra forçada por janela de caracteres. Usado quando um parágrafo é grande
    demais para caber em um único chunk (evita estourar o limite de 8192 tokens
    da API de embeddings).
    """
    chunk_chars = chunk_size * 4
    overlap_chars = overlap * 4
    chunks: List[str] = []
    inicio = 0
    n = len(texto)
    while inicio < n:
        fim = min(inicio + chunk_chars, n)
        pedaco = texto[inicio:fim].strip()
        if pedaco:
            chunks.append(pedaco)
        if fim >= n:
            break
        inicio = max(fim - overlap_chars, inicio + 1)
    return chunks


def _pegar_tail(texto: str, tokens_overlap: int) -> str:
    """Pega os últimos N tokens (aproximados) do texto para overlap."""
    chars = tokens_overlap * 4
    return texto[-chars:].strip() if len(texto) > chars else texto.strip()
