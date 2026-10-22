import inspect
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from lightrag.kg.shared_storage import initialize_pipeline_status
from pydantic import BaseModel, Field

from app import ollama_client, rag
from app.config import settings
from app.developer_chat import router as developer_chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await rag.startup()

    try:        
        parameters = inspect.signature(
            initialize_pipeline_status
        ).parameters

        if "workspace" in parameters:
            await initialize_pipeline_status(
                workspace=settings.lightrag_workspace
            )
        else:
            await initialize_pipeline_status()

        yield

    finally:
        await rag.shutdown()


app = FastAPI(
    title="PRO4TECH - Serviço de IA",
    lifespan=lifespan,
)

app.include_router(developer_chat_router)


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
    return {
        "status": "ok",
        "model": settings.ai_model,
        "think": settings.ai_think,
    }


@app.post("/ask", response_model=AskResponse)
async def ask(body: AskRequest):
    try:
        answer = await ollama_client.ask(body.question)

    except ollama_client.OllamaTimeout:
        raise HTTPException(
            status_code=504,
            detail="O modelo demorou demais para responder.",
        )

    except ollama_client.OllamaUnavailable:
        raise HTTPException(
            status_code=503,
            detail="Ollama indisponível.",
        )

    return AskResponse(answer=answer)


@app.post("/knowledge", status_code=204)
async def insert_knowledge(body: InsertRequest):
    await rag.insert(body.text)


@app.post("/knowledge/query", response_model=QueryResponse)
async def query_knowledge(body: QueryRequest):
    answer = await rag.query(
        body.question,
        mode=body.mode,
    )

    return QueryResponse(answer=answer)