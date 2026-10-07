from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ollama_url: str = "http://localhost:11434"
    ai_model: str = "qwen3:4b"
    # Thinking ligado por padrao: respostas mais concretas, ao custo de mais tempo.
    ai_think: bool = True
    # Com thinking em CPU a resposta pode levar minutos.
    ai_timeout_seconds: float = 600.0


settings = Settings()
