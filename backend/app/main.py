from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import search, index, health, categorias
from app.core.config import settings

app = FastAPI(
    title="Teses Jurídicas API",
    description="Sistema de busca inteligente de teses trabalhistas",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(search.router, prefix="/api", tags=["search"])
app.include_router(index.router, prefix="/api", tags=["index"])
app.include_router(categorias.router, prefix="/api", tags=["categorias"])
