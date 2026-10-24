import logging
import os
from importlib.metadata import version
from pathlib import Path
from typing import TypedDict

import numpy as np

from lightrag import LightRAG, QueryParam
from lightrag.utils import wrap_embedding_func_with_attrs

from app import ollama_client
from app.config import settings

logger = logging.getLogger(__name__)

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
    return await ollama_client.ask(prompt, system_prompt=system_prompt, think=False)


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
        default_embedding_timeout=int(settings.ai_timeout_seconds),
        default_llm_timeout=int(settings.ai_timeout_seconds),
    )
    await rag_instance.initialize_storages()
    logger.info(
        "event=lightrag_initialized version=%s workspace=%s embedding_model=%s embedding_dim=%s",
        version("lightrag-hku"),
        settings.lightrag_workspace,
        settings.embedding_model,
        settings.embedding_dim,
    )
    return rag_instance


async def shutdown() -> None:
    global rag_instance
    if rag_instance is not None:
        await rag_instance.finalize_storages()
        rag_instance = None


async def insert(text: str, doc_id: str | None = None) -> None:
    rag_inst = get_rag()
    if doc_id:
        deletion = await rag_inst.adelete_by_doc_id(doc_id)
        if deletion.status not in {"success", "not_found"}:
            raise RuntimeError(
                f"Não foi possível substituir o documento {doc_id}: "
                f"{deletion.status}."
            )
        await rag_inst.ainsert(text, ids=[doc_id])
        status = await rag_inst.doc_status.get_by_id(doc_id)
        if not status:
            logger.error(
                "event=lightrag_index_verification_failed document_id=%s reason=missing_status",
                doc_id,
            )
            raise RuntimeError(f"O documento {doc_id} não foi persistido no LightRAG.")

        raw_status = status.get("status")
        document_status = getattr(raw_status, "value", raw_status)
        chunk_ids = list(status.get("chunks_list") or [])
        if document_status != "processed" or not chunk_ids:
            logger.error(
                "event=lightrag_index_verification_failed document_id=%s status=%s chunk_count=%d track_id=%s",
                doc_id,
                document_status,
                len(chunk_ids),
                status.get("track_id"),
            )
            raise RuntimeError(
                f"O documento {doc_id} não foi indexado completamente "
                f"(status={document_status}, chunks={len(chunk_ids)})."
            )

        chunks = await rag_inst.text_chunks.get_by_ids(chunk_ids)
        valid_chunks = [
            chunk_id
            for chunk_id, chunk in zip(chunk_ids, chunks)
            if chunk and chunk.get("content", "").strip()
        ]
        vectors = await recuperar_vetores_chunks(doc_id, valid_chunks)
        missing_vectors = set(valid_chunks) - set(vectors)
        valid_vector_ids = set()
        for chunk_id in valid_chunks:
            if chunk_id not in vectors:
                continue
            try:
                vector = np.asarray(vectors[chunk_id], dtype=float)
            except (TypeError, ValueError):
                continue
            if (
                vector.ndim == 1
                and vector.size == settings.embedding_dim
                and np.all(np.isfinite(vector))
            ):
                norma = float(np.linalg.norm(vector))
                if np.isfinite(norma) and norma > 0:
                    valid_vector_ids.add(chunk_id)
        invalid_vectors = set(valid_chunks) - valid_vector_ids
        if (
            len(valid_chunks) != len(chunk_ids)
            or missing_vectors
            or invalid_vectors
        ):
            logger.error(
                "event=lightrag_index_verification_failed document_id=%s status=%s chunk_count=%d valid_text_chunks=%d returned_vectors=%d associated_vectors=%d valid_vectors=%d missing_vectors=%d invalid_vectors=%d embedding_dimension=%d",
                doc_id,
                document_status,
                len(chunk_ids),
                len(valid_chunks),
                len(vectors),
                len(set(valid_chunks) & set(vectors)),
                len(valid_vector_ids),
                len(missing_vectors),
                len(invalid_vectors),
                settings.embedding_dim,
            )
            raise RuntimeError(
                f"O documento {doc_id} foi processado, mas seus chunks ou "
                "embeddings não estão todos disponíveis."
            )
    else:
        await rag_inst.ainsert(text)


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


class ChunkProjeto(TypedDict):
    id: str
    ordem: int
    texto: str


async def recuperar_chunks_projeto(project_id: int) -> list[ChunkProjeto]:
    rag = get_rag()
    document_id = doc_id_projeto(project_id)
    status = await rag.doc_status.get_by_id(document_id)
    if status is None:
        logger.warning(
            "event=lightrag_project_document_missing project_id=%d document_id=%s",
            project_id,
            document_id,
        )
        return []

    raw_status = status.get("status")
    document_status = getattr(raw_status, "value", raw_status)
    if document_status != "processed":
        logger.warning(
            "event=lightrag_project_document_not_processed project_id=%d document_id=%s status=%s status_chunk_count=%s",
            project_id,
            document_id,
            document_status,
            status.get("chunks_count"),
        )
        return []

    chunk_ids = list(status.get("chunks_list") or [])
    if not chunk_ids:
        logger.warning(
            "event=lightrag_project_chunks_missing project_id=%d document_id=%s status=%s status_chunk_count=%s",
            project_id,
            document_id,
            status.get("status"),
            status.get("chunks_count"),
        )
        return []

    registros = await rag.text_chunks.get_by_ids(chunk_ids)
    chunks: list[ChunkProjeto] = [
        {
            "id": cid,
            "ordem": reg.get("chunk_order_index", 0),
            "texto": reg["content"].strip(),
        }
        for cid, reg in zip(chunk_ids, registros)
        if reg and reg.get("content", "").strip()
    ]
    chunks.sort(key=lambda c: c["ordem"])
    if len(chunks) != len(chunk_ids):
        logger.warning(
            "event=lightrag_project_text_chunks_incomplete project_id=%d document_id=%s chunk_ids=%d valid_text_records=%d",
            project_id,
            document_id,
            len(chunk_ids),
            len(chunks),
        )
    return chunks


async def recuperar_vetores_chunks(
    document_id: str,
    chunk_ids: list[str],
    project_id: int | None = None,
) -> dict[str, list[float]]:
    rag = get_rag()
    try:
        vetores = await rag.chunks_vdb.get_vectors_by_ids(chunk_ids)
    except TimeoutError:
        logger.exception(
            "event=lightrag_vector_lookup_timeout project_id=%s document_id=%s requested_chunks=%d",
            project_id,
            document_id,
            len(chunk_ids),
        )
        raise
    except Exception:
        logger.exception(
            "event=lightrag_vector_lookup_failed project_id=%s document_id=%s requested_chunks=%d",
            project_id,
            document_id,
            len(chunk_ids),
        )
        raise

    if not isinstance(vetores, dict):
        logger.error(
            "event=lightrag_vector_lookup_invalid_response project_id=%s document_id=%s requested_chunks=%d response_type=%s",
            project_id,
            document_id,
            len(chunk_ids),
            type(vetores).__name__,
        )
        raise RuntimeError("O armazenamento vetorial retornou um formato inválido.")

    associados = set(chunk_ids) & set(vetores)
    logger.info(
        "event=lightrag_vector_lookup_complete project_id=%s document_id=%s requested_chunks=%d returned_vectors=%d associated_vectors=%d",
        project_id,
        document_id,
        len(chunk_ids),
        len(vetores),
        len(associados),
    )
    if len(associados) != len(chunk_ids):
        logger.warning(
            "event=lightrag_vectors_missing project_id=%s document_id=%s requested_chunks=%d returned_vectors=%d associated_vectors=%d",
            project_id,
            document_id,
            len(chunk_ids),
            len(vetores),
            len(associados),
        )
        if chunk_ids:
            database = getattr(rag.chunks_vdb, "db", None)
            health_check = getattr(database, "query", None)
            if health_check is None:
                logger.warning(
                    "event=lightrag_vector_storage_health_check_unavailable project_id=%s document_id=%s",
                    project_id,
                    document_id,
                )
                return vetores
            try:
                # LightRAG 1.5.7 logs and suppresses SQL errors in
                # get_vectors_by_ids; this health-only query distinguishes an
                # unavailable PostgreSQL connection from IDs with no vectors.
                await health_check("SELECT 1")
            except Exception:
                logger.exception(
                    "event=lightrag_vector_storage_unavailable project_id=%s document_id=%s requested_chunks=%d returned_vectors=%d",
                    project_id,
                    document_id,
                    len(chunk_ids),
                    len(vetores),
                )
                raise
            logger.warning(
                "event=lightrag_vector_storage_reachable_but_ids_missing project_id=%s document_id=%s requested_chunks=%d returned_vectors=%d associated_vectors=%d",
                project_id,
                document_id,
                len(chunk_ids),
                len(vetores),
                len(associados),
            )
    return vetores


async def recuperar_contexto_projeto(
    project_id: int,
    question: str,
    max_chars: int | None = None,
    top_k: int | None = None,
) -> str:
    max_chars = max_chars or settings.chat_context_max_chars
    top_k = top_k or settings.chat_context_top_k

    rag = get_rag()
    chunks = await recuperar_chunks_projeto(project_id)
    if not chunks:
        return ""

    # Projeto pequeno: manda tudo, na ordem original.
    if sum(len(c["texto"]) for c in chunks) <= max_chars:
        return "\n\n".join(c["texto"] for c in chunks)

    # Projeto grande: ranqueia por similaridade com a pergunta.
    vetores = await recuperar_vetores_chunks(
        doc_id_projeto(project_id),
        [c["id"] for c in chunks],
        project_id=project_id,
    )
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
