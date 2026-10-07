from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ollama_url: str = "http://localhost:11434"
    ai_model: str = "qwen3:4b"
    # Thinking ligado por padrao: respostas mais concretas, ao custo de mais tempo.
    ai_think: bool = True
    # Com thinking em CPU a resposta pode levar minutos.
    ai_timeout_seconds: float = 600.0

    # Embedding (LightRAG, SCRUM-31). Trocar o modelo exige reindexar: a dimensao
    # fica gravada nas tabelas do LightRAG.
    embedding_model: str = "bge-m3"
    embedding_dim: int = 1024
    embedding_max_tokens: int = 8192

    # Postgres (mesmo banco do Prisma, tabelas proprias com prefixo LIGHTRAG_).
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"
    postgres_database: str = "pro4tech"
    # So isola linhas dentro das tabelas do LightRAG, nao cria schema separado.
    lightrag_workspace: str = "pro4tech"
    lightrag_working_dir: str = "/code/lightrag_storage"


settings = Settings()
