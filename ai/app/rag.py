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

# --------------------------------------------------------------------------
# Recuperacao de contexto restrita a UM projeto
# --------------------------------------------------------------------------
# O LightRAG (mix/local/global) consulta o grafo inteiro e nao filtra por
# documento, o que misturaria dados de outros projetos na resposta. Como cada
# projeto e indexado como um documento proprio (doc_id "projeto_<id>", veja
# indexacao.service.ts no backend), buscamos so os chunks desse documento e
# ranqueamos por similaridade com a pergunta usando os vetores ja gravados.
# Efeito colateral bom: nenhuma chamada ao LLM na etapa de recuperacao.

def doc_id_projeto(project_id: int) -> str:
    return f"projeto_{project_id}"


def _cosseno(a: np.ndarray, b: np.ndarray) -> float:
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    return float(np.dot(a, b) / denom) if denom else 0.0


async def recuperar_contexto_projeto(
    project_id: int,
    question: str,
    max_chars: int | None = None,
    top_k: int | None = None,
) -> str:
    max_chars = max_chars or settings.chat_context_max_chars
    top_k = top_k or settings.chat_context_top_k

    rag = get_rag()
    status = await rag.doc_status.get_by_id(doc_id_projeto(project_id))
    chunk_ids = list((status or {}).get("chunks_list") or [])
    if not chunk_ids:
        return ""

    registros = await rag.text_chunks.get_by_ids(chunk_ids)
    chunks = [
        {
            "id": cid,
            "ordem": reg.get("chunk_order_index", 0),
            "texto": reg["content"].strip(),
        }
        for cid, reg in zip(chunk_ids, registros)
        if reg and reg.get("content", "").strip()
    ]
    if not chunks:
        return ""
    chunks.sort(key=lambda c: c["ordem"])

    # Projeto pequeno: manda tudo, na ordem original.
    if sum(len(c["texto"]) for c in chunks) <= max_chars:
        return "\n\n".join(c["texto"] for c in chunks)

    # Projeto grande: ranqueia por similaridade com a pergunta.
    vetores = await rag.chunks_vdb.get_vectors_by_ids([c["id"] for c in chunks])
    consulta = np.array((await embedding_func([question]))[0], dtype=float)

    pontuados = sorted(
        (
            (_cosseno(consulta, np.array(vetores[c["id"]], dtype=float)), c)
            for c in chunks
            if c["id"] in vetores
        ),
        key=lambda par: par[0],
        reverse=True,
    )

    # O primeiro chunk carrega o cabecalho (nome, status, tecnologias): sempre entra.
    escolhidos = [chunks[0]]
    usado = len(chunks[0]["texto"])
    for _, chunk in pontuados:
        if len(escolhidos) >= top_k:
            break
        if chunk in escolhidos:
            continue
        if usado + len(chunk["texto"]) > max_chars:
            continue
        escolhidos.append(chunk)
        usado += len(chunk["texto"])

    escolhidos.sort(key=lambda c: c["ordem"])
    return "\n\n".join(c["texto"] for c in escolhidos)
