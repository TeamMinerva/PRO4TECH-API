import os

import numpy as np
from pathlib import Path
from lightrag import LightRAG, QueryParam
from lightrag.utils import wrap_embedding_func_with_attrs

from app import ollama_client
from app.config import settings

os.environ.setdefault("LIGHTRAG_KV_STORAGE", "PGKVStorage")
os.environ.setdefault("LIGHTRAG_VECTOR_STORAGE", "PGVectorStorage")
os.environ.setdefault("LIGHTRAG_GRAPH_STORAGE", "PGTableGraphStorage")
os.environ.setdefault("LIGHTRAG_DOC_STATUS_STORAGE", "PGDocStatusStorage")
os.environ.setdefault("POSTGRES_HOST", settings.postgres_host)
os.environ.setdefault("POSTGRES_PORT", str(settings.postgres_port))
os.environ.setdefault("POSTGRES_USER", settings.postgres_user)
os.environ.setdefault("POSTGRES_PASSWORD", settings.postgres_password)
os.environ.setdefault("POSTGRES_DATABASE", settings.postgres_database)
os.environ.setdefault("WORKSPACE", settings.lightrag_workspace)


async def llm_model_func(
    prompt,
    system_prompt=None,
    history_messages=[],
    keyword_extraction=False,
    **kwargs,
) -> str:
    return await ollama_client.ask(prompt, system_prompt=system_prompt)


@wrap_embedding_func_with_attrs(
    embedding_dim=settings.embedding_dim,
    max_token_size=settings.embedding_max_tokens,
    model_name=settings.embedding_model,
)
async def embedding_func(texts: list[str]) -> np.ndarray:
    vetores = await ollama_client.embed(texts, settings.embedding_model)
    return np.array(vetores)


rag_instance: LightRAG | None = None


def get_rag() -> LightRAG:
    if rag_instance is None:
        raise RuntimeError("LightRAG ainda nao foi inicializado.")
    return rag_instance


async def startup() -> LightRAG:
    global rag_instance
    Path(settings.lightrag_working_dir).mkdir(parents=True, exist_ok=True)
    rag_instance = LightRAG(
        working_dir=settings.lightrag_working_dir,
        kv_storage="PGKVStorage",
        vector_storage="PGVectorStorage",
        graph_storage="PGTableGraphStorage",
        doc_status_storage="PGDocStatusStorage",
        workspace=settings.lightrag_workspace,
        llm_model_func=llm_model_func,
        embedding_func=embedding_func,
    )
    await rag_instance.initialize_storages()
    return rag_instance


async def shutdown() -> None:
    global rag_instance
    if rag_instance is not None:
        await rag_instance.finalize_storages()
        rag_instance = None


async def insert(text: str) -> None:
    await get_rag().ainsert(text)


async def query(question: str, mode: str = "mix") -> str:
    return await get_rag().aquery(question, param=QueryParam(mode=mode))
