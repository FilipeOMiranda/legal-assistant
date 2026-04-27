import asyncio
from datetime import datetime, timezone
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.models.schemas import (
    IndexRequest,
    IndexStatus,
    TeseChunk,
)
from app.services.chunking_service import chunkar_texto
from app.services.drive_service import extrair_texto, listar_arquivos
from app.services.embedding_service import gerar_embeddings_batch
from app.services.vector_service import (
    buscar_todos_modified_times,
    deletar_chunks_do_arquivo,
    salvar_chunks,
)

router = APIRouter()


# ── Estado da indexação em background (em memória, por processo) ─────────────
INDEXING_STATE: Dict[str, Any] = {
    "status": "idle",          # idle | running | completed | error
    "iniciado_em": None,
    "concluido_em": None,
    "total_arquivos": 0,
    "processados": 0,
    "indexados": 0,
    "atualizados": 0,
    "ignorados": 0,
    "erros": 0,
    "ultimo_arquivo": None,    # nome do arquivo sendo processado agora
    "erro_geral": None,
    "detalhes": [],            # List[IndexStatus.dict()]
}


def _reset_state() -> None:
    INDEXING_STATE.update({
        "status": "running",
        "iniciado_em": datetime.now(timezone.utc).isoformat(),
        "concluido_em": None,
        "total_arquivos": 0,
        "processados": 0,
        "indexados": 0,
        "atualizados": 0,
        "ignorados": 0,
        "erros": 0,
        "ultimo_arquivo": None,
        "erro_geral": None,
        "detalhes": [],
    })


@router.post("/index")
async def indexar_drive(request: IndexRequest):
    """
    Dispara a indexação em background. Retorna imediatamente.
    Use GET /api/index/status para acompanhar o progresso.
    """
    if INDEXING_STATE["status"] == "running":
        raise HTTPException(status_code=409, detail="Indexação já em andamento.")

    _reset_state()

    # Roda em background — não depende do lifecycle da request HTTP
    asyncio.create_task(_executar_indexacao_bg(request.force_reindex))

    return {
        "status": "iniciada",
        "iniciado_em": INDEXING_STATE["iniciado_em"],
    }


@router.get("/index/status")
async def status_indexacao():
    """Retorna o estado atual da indexação (idle, running, completed, error)."""
    return INDEXING_STATE


async def _executar_indexacao_bg(force_reindex: bool) -> None:
    """Loop principal da indexação. Atualiza INDEXING_STATE conforme progride."""
    try:
        arquivos = listar_arquivos(settings.GOOGLE_DRIVE_FOLDER_ID)
        INDEXING_STATE["total_arquivos"] = len(arquivos)

        modified_times = await buscar_todos_modified_times()

        for arquivo in arquivos:
            arquivo_id = arquivo["id"]
            nome = arquivo["name"]
            modified_time = arquivo.get("modifiedTime", "")
            link = arquivo.get("webViewLink", "")
            categoria = arquivo.get("categoria")

            INDEXING_STATE["ultimo_arquivo"] = nome
            INDEXING_STATE["processados"] += 1

            detalhe: IndexStatus
            try:
                ultimo_modified = modified_times.get(arquivo_id)

                if not force_reindex and ultimo_modified == modified_time:
                    INDEXING_STATE["ignorados"] += 1
                    detalhe = IndexStatus(
                        arquivo_nome=nome,
                        arquivo_id=arquivo_id,
                        status="ignorado",
                        chunks_gerados=0,
                    )
                    INDEXING_STATE["detalhes"].append(detalhe.model_dump())
                    continue

                texto = extrair_texto(arquivo)
                if not texto or len(texto.strip()) < 100:
                    INDEXING_STATE["erros"] += 1
                    detalhe = IndexStatus(
                        arquivo_nome=nome,
                        arquivo_id=arquivo_id,
                        status="erro",
                        chunks_gerados=0,
                        erro="Texto insuficiente ou não extraído.",
                    )
                    INDEXING_STATE["detalhes"].append(detalhe.model_dump())
                    continue

                chunks_texto = chunkar_texto(texto, nome)
                if not chunks_texto:
                    INDEXING_STATE["erros"] += 1
                    detalhe = IndexStatus(
                        arquivo_nome=nome,
                        arquivo_id=arquivo_id,
                        status="erro",
                        chunks_gerados=0,
                        erro="Nenhum chunk gerado.",
                    )
                    INDEXING_STATE["detalhes"].append(detalhe.model_dump())
                    continue

                embeddings = await gerar_embeddings_batch(chunks_texto)

                if ultimo_modified:
                    await deletar_chunks_do_arquivo(arquivo_id)

                novos_chunks = [
                    TeseChunk(
                        arquivo_nome=nome,
                        arquivo_id=arquivo_id,
                        arquivo_link=link,
                        arquivo_modified_time=modified_time,
                        chunk_index=i,
                        conteudo=texto_chunk,
                        embedding=emb,
                        categoria=categoria,
                    )
                    for i, (texto_chunk, emb) in enumerate(zip(chunks_texto, embeddings))
                ]
                await salvar_chunks(novos_chunks)

                if ultimo_modified:
                    INDEXING_STATE["atualizados"] += 1
                    status = "atualizado"
                else:
                    INDEXING_STATE["indexados"] += 1
                    status = "indexado"

                detalhe = IndexStatus(
                    arquivo_nome=nome,
                    arquivo_id=arquivo_id,
                    status=status,
                    chunks_gerados=len(novos_chunks),
                )
                INDEXING_STATE["detalhes"].append(detalhe.model_dump())

            except Exception as e:
                INDEXING_STATE["erros"] += 1
                detalhe = IndexStatus(
                    arquivo_nome=nome,
                    arquivo_id=arquivo_id,
                    status="erro",
                    chunks_gerados=0,
                    erro=str(e),
                )
                INDEXING_STATE["detalhes"].append(detalhe.model_dump())

        INDEXING_STATE["status"] = "completed"

    except Exception as e:
        INDEXING_STATE["status"] = "error"
        INDEXING_STATE["erro_geral"] = str(e)

    finally:
        INDEXING_STATE["concluido_em"] = datetime.now(timezone.utc).isoformat()
        INDEXING_STATE["ultimo_arquivo"] = None
