from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.models.schemas import IndexRequest, IndexResponse, IndexStatus
from app.services.drive_service import listar_arquivos, extrair_texto
from app.services.chunking_service import chunkar_texto
from app.services.embedding_service import gerar_embeddings_batch
from app.services.vector_service import (
    salvar_chunks,
    deletar_chunks_do_arquivo,
    buscar_todos_modified_times,
)
from app.models.schemas import TeseChunk
from app.core.config import settings
from datetime import datetime, timezone
from typing import List

router = APIRouter()

# Estado simples para evitar indexações simultâneas
_indexando = False


@router.post("/index", response_model=IndexResponse)
async def indexar_drive(request: IndexRequest, background_tasks: BackgroundTasks):
    """
    Dispara a indexação dos arquivos do Google Drive.
    Roda em background para não bloquear a requisição.
    """
    global _indexando
    if _indexando:
        raise HTTPException(status_code=409, detail="Indexação já em andamento.")

    _indexando = True
    try:
        return await _executar_indexacao(request.force_reindex)
    finally:
        _indexando = False


async def _executar_indexacao(force_reindex: bool) -> IndexResponse:
    inicio = datetime.now(timezone.utc)
    detalhes: List[IndexStatus] = []

    arquivos = listar_arquivos(settings.GOOGLE_DRIVE_FOLDER_ID)
    indexados = atualizados = ignorados = erros = 0

    # Carrega todos os modified_time de uma vez (1 query) em vez de 1 query por arquivo
    modified_times = await buscar_todos_modified_times()

    for arquivo in arquivos:
        arquivo_id = arquivo["id"]
        nome = arquivo["name"]
        modified_time = arquivo.get("modifiedTime", "")
        link = arquivo.get("webViewLink", "")

        try:
            ultimo_modified = modified_times.get(arquivo_id)

            if not force_reindex and ultimo_modified == modified_time:
                ignorados += 1
                detalhes.append(IndexStatus(
                    arquivo_nome=nome,
                    arquivo_id=arquivo_id,
                    status="ignorado",
                    chunks_gerados=0,
                ))
                continue

            # Extrair texto do arquivo
            texto = extrair_texto(arquivo)
            if not texto or len(texto.strip()) < 100:
                erros += 1
                detalhes.append(IndexStatus(
                    arquivo_nome=nome,
                    arquivo_id=arquivo_id,
                    status="erro",
                    chunks_gerados=0,
                    erro="Texto insuficiente ou não extraído.",
                ))
                continue

            # Dividir em chunks
            chunks_texto = chunkar_texto(texto, nome)
            if not chunks_texto:
                erros += 1
                detalhes.append(IndexStatus(
                    arquivo_nome=nome,
                    arquivo_id=arquivo_id,
                    status="erro",
                    chunks_gerados=0,
                    erro="Nenhum chunk gerado.",
                ))
                continue

            # Gerar embeddings em batch
            embeddings = await gerar_embeddings_batch(chunks_texto)

            # Deletar chunks antigos se existirem
            if ultimo_modified:
                await deletar_chunks_do_arquivo(arquivo_id)

            # Salvar novos chunks
            novos_chunks = [
                TeseChunk(
                    arquivo_nome=nome,
                    arquivo_id=arquivo_id,
                    arquivo_link=link,
                    arquivo_modified_time=modified_time,
                    chunk_index=i,
                    conteudo=texto_chunk,
                    embedding=emb,
                )
                for i, (texto_chunk, emb) in enumerate(zip(chunks_texto, embeddings))
            ]

            await salvar_chunks(novos_chunks)

            if ultimo_modified:
                atualizados += 1
                status = "atualizado"
            else:
                indexados += 1
                status = "indexado"

            detalhes.append(IndexStatus(
                arquivo_nome=nome,
                arquivo_id=arquivo_id,
                status=status,
                chunks_gerados=len(novos_chunks),
            ))

        except Exception as e:
            erros += 1
            detalhes.append(IndexStatus(
                arquivo_nome=nome,
                arquivo_id=arquivo_id,
                status="erro",
                chunks_gerados=0,
                erro=str(e),
            ))

    return IndexResponse(
        total_arquivos=len(arquivos),
        indexados=indexados,
        atualizados=atualizados,
        ignorados=ignorados,
        erros=erros,
        detalhes=detalhes,
        iniciado_em=inicio,
        concluido_em=datetime.now(timezone.utc),
    )
