from openai import AsyncOpenAI
from app.core.config import settings
from typing import List
import asyncio

_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def gerar_embedding(texto: str) -> List[float]:
    """Gera embedding para um único texto."""
    texto = texto.replace("\n", " ").strip()
    response = await _client.embeddings.create(
        input=texto,
        model=settings.EMBEDDING_MODEL,
    )
    return response.data[0].embedding


async def gerar_embeddings_batch(textos: List[str], batch_size: int = 20) -> List[List[float]]:
    """
    Gera embeddings em batch para reduzir latência e custo.
    Processa em lotes de batch_size para não estourar rate limits.
    """
    todos_embeddings = []

    for i in range(0, len(textos), batch_size):
        lote = [t.replace("\n", " ").strip() for t in textos[i : i + batch_size]]
        response = await _client.embeddings.create(
            input=lote,
            model=settings.EMBEDDING_MODEL,
        )
        # A API retorna na mesma ordem que enviamos
        embeddings_lote = [item.embedding for item in sorted(response.data, key=lambda x: x.index)]
        todos_embeddings.extend(embeddings_lote)

        # Pequeno delay entre lotes para respeitar rate limits
        if i + batch_size < len(textos):
            await asyncio.sleep(0.2)

    return todos_embeddings
