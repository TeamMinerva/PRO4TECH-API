from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app import ollama_client, rag
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await rag.startup()
    yield
    await rag.shutdown()


app = FastAPI(title="PRO4TECH - Servico de IA", lifespan=lifespan)


class AskRequest(BaseModel):
    question: str = Field(min_length=1)


class AskResponse(BaseModel):
    answer: str


class InsertRequest(BaseModel):
    text: str = Field(min_length=1)


class QueryRequest(BaseModel):
    question: str = Field(min_length=1)
    mode: str = "mix"


class QueryResponse(BaseModel):
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


@app.post("/knowledge", status_code=204)
async def insert_knowledge(body: InsertRequest):
    # Insere um texto no grafo+vetores do LightRAG (SCRUM-31). A rotina que
    # busca o dado do backend Node e monta esse texto e a SCRUM-32.
    await rag.insert(body.text)


@app.post("/knowledge/query", response_model=QueryResponse)
async def query_knowledge(body: QueryRequest):
    answer = await rag.query(body.question, mode=body.mode)
    return QueryResponse(answer=answer)
