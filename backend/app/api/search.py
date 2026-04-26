from fastapi import APIRouter, HTTPException
from app.models.schemas import SearchRequest, SearchResponse
from app.services.embedding_service import gerar_embedding
from app.services.vector_service import buscar_similares
from app.services.openai_service import analisar_teses

router = APIRouter()


@router.post("/search", response_model=SearchResponse)
async def buscar_teses(request: SearchRequest):
    """
    Endpoint principal: recebe a descrição do advogado e retorna
    as teses mais relevantes com análise da IA.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query não pode estar vazia.")

    if len(request.query) > 2000:
        raise HTTPException(status_code=400, detail="Query muito longa. Máximo: 2000 caracteres.")

    # 1. Gerar embedding da query
    embedding = await gerar_embedding(request.query)

    # 2. Buscar chunks similares no Supabase (com filtro opcional por categoria)
    resultados = await buscar_similares(
        embedding,
        top_k=request.top_k,
        categoria=request.categoria,
    )

    # 3. Analisar com Claude
    resumo = await analisar_teses(request.query, resultados)

    return SearchResponse(
        query=request.query,
        resumo_ia=resumo,
        resultados=resultados,
        total_encontrado=len(resultados),
    )
