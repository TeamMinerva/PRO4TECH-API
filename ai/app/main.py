from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app import ollama_client
from app.config import settings

app = FastAPI(title="PRO4TECH - Servico de IA")


class AskRequest(BaseModel):
    question: str = Field(min_length=1)


class AskResponse(BaseModel):
    answer: str


@app.get("/health")
async def health():
    return {"status": "ok", "model": settings.ai_model, "think": settings.ai_think}


@app.post("/ask", response_model=AskResponse)
async def ask(body: AskRequest):
    try:
        answer = await ollama_client.ask(body.question)
    except ollama_client.OllamaTimeout:
        raise HTTPException(status_code=504, detail="O modelo demorou demais para responder.")
    except ollama_client.OllamaUnavailable as exc:
        raise HTTPException(status_code=503, detail=f"Ollama indisponivel: {exc}")
    return AskResponse(answer=answer)
