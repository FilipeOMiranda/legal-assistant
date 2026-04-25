from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ── Request ────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = None  # sobrescreve o padrão da config se informado

class IndexRequest(BaseModel):
    force_reindex: bool = False  # reindexar mesmo arquivos não modificados


# ── Response ───────────────────────────────────────────────────────────────

class TrechodDoc(BaseModel):
    chunk_id: str
    arquivo_nome: str
    arquivo_link: str
    trecho: str
    score: float          # similaridade coseno (0-1)
    pagina: Optional[int] = None

class SearchResponse(BaseModel):
    query: str
    resumo_ia: str        # análise do Claude sobre as teses encontradas
    resultados: List[TrechodDoc]
    total_encontrado: int

class IndexStatus(BaseModel):
    arquivo_nome: str
    arquivo_id: str
    status: str           # "indexado", "atualizado", "ignorado", "erro"
    chunks_gerados: int
    erro: Optional[str] = None

class IndexResponse(BaseModel):
    total_arquivos: int
    indexados: int
    atualizados: int
    ignorados: int
    erros: int
    detalhes: List[IndexStatus]
    iniciado_em: datetime
    concluido_em: datetime


# ── DB Models ──────────────────────────────────────────────────────────────

class TeseChunk(BaseModel):
    """Representa um chunk salvo no Supabase."""
    id: Optional[str] = None
    arquivo_nome: str
    arquivo_id: str
    arquivo_link: str
    arquivo_modified_time: str
    chunk_index: int
    conteudo: str
    embedding: List[float]
    pagina: Optional[int] = None
