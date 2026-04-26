from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str  # service_role key (não a anon key)

    # OpenAI (embeddings + chat)
    OPENAI_API_KEY: str
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536
    OPENAI_CHAT_MODEL: str = "gpt-4o"          # ou "gpt-4o-mini" para menor custo

    # Google Drive
    GOOGLE_SERVICE_ACCOUNT_JSON: str  # path para o arquivo JSON da service account
    GOOGLE_DRIVE_FOLDER_ID: str       # ID da pasta raiz no Drive

    # App
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    CHUNK_SIZE: int = 400        # tokens por chunk (menor = mais preciso para termos nichados)
    CHUNK_OVERLAP: int = 80      # overlap entre chunks (~20% para preservar contexto)
    TOP_K_RESULTS: int = 12      # quantos chunks retornar na busca (compensa chunks menores)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
