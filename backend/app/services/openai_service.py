from openai import AsyncOpenAI
from typing import List
from app.core.config import settings
from app.models.schemas import TrechodDoc

_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

SYSTEM_PROMPT = """Você é um assistente jurídico especializado em Direito do Trabalho brasileiro.
Sua função é analisar teses jurídicas encontradas em uma base de documentos e ajudar advogados
a identificar os melhores argumentos para rebater ações trabalhistas.

Sempre responda em português brasileiro de forma técnica, clara e objetiva.
Use terminologia jurídica adequada."""


async def analisar_teses(query: str, trechos: List[TrechodDoc]) -> str:
    """
    Envia os chunks encontrados para o GPT analisar e gerar um resumo
    com os melhores argumentos para a situação do advogado.
    """
    if not trechos:
        return "Nenhuma tese relevante foi encontrada na base de documentos para esta consulta."

    contexto_partes = []
    for i, trecho in enumerate(trechos, 1):
        contexto_partes.append(
            f"[DOCUMENTO {i}] {trecho.arquivo_nome} (relevância: {trecho.score:.0%})\n"
            f"{trecho.trecho}"
        )
    contexto = "\n\n---\n\n".join(contexto_partes)

    prompt = f"""O advogado precisa rebater a seguinte situação/argumento na ação trabalhista:

"{query}"

Com base nos documentos da base de teses abaixo, analise e:
1. Identifique as teses mais relevantes para este caso
2. Explique como cada tese pode ser usada para rebater o argumento
3. Sugira a ordem de apresentação dos argumentos (do mais forte ao mais fraco)
4. Aponte eventuais jurisprudências ou fundamentos legais mencionados nos documentos

DOCUMENTOS ENCONTRADOS:
{contexto}

Seja direto e objetivo. O advogado precisa de orientação prática."""

    response = await _client.chat.completions.create(
        model=settings.OPENAI_CHAT_MODEL,
        max_tokens=1500,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )

    return response.choices[0].message.content
