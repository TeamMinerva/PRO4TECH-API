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

    # Chat contextualizado (ex.: chat de projeto). Os limites protegem a janela de
    # contexto do Ollama (OLLAMA_CONTEXT_LENGTH): o que passar dela e silenciosamente cortado.
    chat_context_max_chars: int = 6000
    chat_context_top_k: int = 6
    chat_history_max_messages: int = 10
    chat_history_max_chars: int = 3000


settings = Settings()
