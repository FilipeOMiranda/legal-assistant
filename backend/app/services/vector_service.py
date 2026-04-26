from typing import List, Dict, Optional
from app.core.supabase import get_supabase
from app.core.config import settings
from app.models.schemas import TeseChunk, TrechodDoc


TABLE = "teses"


async def buscar_similares(
    embedding: List[float],
    top_k: Optional[int] = None,
    categoria: Optional[str] = None,
) -> List[TrechodDoc]:
    """
    Busca os chunks mais similares ao embedding fornecido usando pgvector.
    Chama a função RPC match_teses definida no Supabase.
    Se 'categoria' for informada, restringe a busca aos chunks dessa subpasta.
    """
    k = top_k or settings.TOP_K_RESULTS
    supabase = get_supabase()

    response = supabase.rpc(
        "match_teses",
        {
            "query_embedding": embedding,
            "match_count": k,
            "match_threshold": 0.3,  # descarta resultados com similaridade < 30%
            "match_categoria": categoria,
        },
    ).execute()

    resultados = []
    for row in (response.data or []):
        resultados.append(
            TrechodDoc(
                chunk_id=row["id"],
                arquivo_nome=row["arquivo_nome"],
                arquivo_link=row["arquivo_link"],
                trecho=row["conteudo"],
                score=round(row["similarity"], 4),
                pagina=row.get("pagina"),
                categoria=row.get("categoria"),
            )
        )

    return resultados


async def salvar_chunks(chunks: List[TeseChunk]) -> bool:
    """Salva uma lista de chunks no Supabase."""
    supabase = get_supabase()
    dados = [c.model_dump(exclude={"id"}) for c in chunks]
    response = supabase.table(TABLE).insert(dados).execute()
    return bool(response.data)


async def deletar_chunks_do_arquivo(arquivo_id: str) -> int:
    """Remove todos os chunks de um arquivo (para re-indexação)."""
    supabase = get_supabase()
    response = (
        supabase.table(TABLE)
        .delete()
        .eq("arquivo_id", arquivo_id)
        .execute()
    )
    return len(response.data or [])


async def buscar_modified_time(arquivo_id: str) -> Optional[str]:
    """
    Retorna o modified_time do último chunk indexado deste arquivo.
    Usado para verificar se o arquivo mudou desde a última indexação.
    """
    supabase = get_supabase()
    response = (
        supabase.table(TABLE)
        .select("arquivo_modified_time")
        .eq("arquivo_id", arquivo_id)
        .limit(1)
        .execute()
    )
    if response.data:
        return response.data[0]["arquivo_modified_time"]
    return None


async def buscar_todos_modified_times() -> Dict[str, str]:
    """
    Retorna um dict {arquivo_id: arquivo_modified_time} para todos os arquivos
    indexados. Usado pelo /api/index para checar todos os arquivos em uma única
    query, em vez de uma query por arquivo.
    """
    supabase = get_supabase()
    response = (
        supabase.table(TABLE)
        .select("arquivo_id, arquivo_modified_time")
        .limit(100000)
        .execute()
    )
    resultado: Dict[str, str] = {}
    for row in (response.data or []):
        resultado[row["arquivo_id"]] = row["arquivo_modified_time"]
    return resultado
