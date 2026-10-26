import logging
import os
import re
from importlib.metadata import version
from pathlib import Path
from typing import Any, TypedDict

import numpy as np
from lightrag import LightRAG, QueryParam
from lightrag.base import DocStatus
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
        deletion_status = getattr(deletion, "status", None)
        if deletion_status is not None and deletion_status not in {"success", "not_found"}:
            raise RuntimeError(
                f"Não foi possível substituir o documento {doc_id}: "
                f"{deletion_status}."
            )

        if hasattr(rag_inst, "apipeline_enqueue_documents") and hasattr(
            rag_inst, "apipeline_process_enqueue_documents"
        ):
            await rag_inst.apipeline_enqueue_documents(
                text,
                ids=[doc_id],
                process_options="!",
            )
            await rag_inst.apipeline_process_enqueue_documents()
        else:
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
# Recuperacao de contexto restrita a UM projeto ou UM desenvolvedor
# --------------------------------------------------------------------------
# O LightRAG (mix/local/global) consulta o grafo inteiro e nao filtra por
# documento, o que misturaria dados de outros registros na resposta. Como cada
# projeto/desenvolvedor e indexado como um documento proprio (doc_id
# "projeto_<id>" ou "dev_<id>", veja indexacao.service.ts no backend), buscamos
# so os chunks desse documento e ranqueamos por similaridade com a pergunta
# usando os vetores ja gravados.
# Efeito colateral bom: nenhuma chamada ao LLM na etapa de recuperacao.

def doc_id_projeto(project_id: int) -> str:
    return f"projeto_{project_id}"


def doc_id_desenvolvedor(developer_id: int) -> str:
    return f"dev_{developer_id}"


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


async def _recuperar_contexto_documento(
    doc_id: str,
    question: str,
    max_chars: int | None = None,
    top_k: int | None = None,
    normalizar: bool = False,
) -> str:
    max_chars = max_chars or settings.chat_context_max_chars
    top_k = top_k or settings.chat_context_top_k

    rag = get_rag()
    status = await rag.doc_status.get_by_id(doc_id)
    chunk_ids = _extrair_chunks_list(status)
    if not chunk_ids:
        return ""

    registros = await rag.text_chunks.get_by_ids(chunk_ids)
    chunks = [
        {
            "id": cid,
            "ordem": reg.get("chunk_order_index", 0),
            "texto": (
                normalizar_termos_banco(reg["content"].strip())
                if normalizar
                else reg["content"].strip()
            ),
        }
        for cid, reg in zip(chunk_ids, registros)
        if reg and reg.get("content", "").strip()
    ]
    if not chunks:
        return ""

    # Documento pequeno: manda tudo, na ordem original.
    if sum(len(c["texto"]) for c in chunks) <= max_chars:
        return "\n\n".join(c["texto"] for c in chunks)

    # Documento grande: ranqueia por similaridade com a pergunta.
    vetores = await recuperar_vetores_chunks(doc_id, [c["id"] for c in chunks])
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

    # O primeiro chunk carrega o cabecalho (identificacao): sempre entra.
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


async def recuperar_contexto_projeto(
    project_id: int,
    question: str,
    max_chars: int | None = None,
    top_k: int | None = None,
) -> str:
    return await _recuperar_contexto_documento(
        doc_id=doc_id_projeto(project_id),
        question=question,
        max_chars=max_chars,
        top_k=top_k,
        normalizar=False,
    )


async def recuperar_contexto_desenvolvedor(
    developer_id: int,
    question: str,
    max_chars: int | None = None,
    top_k: int | None = None,
) -> str:
    return await _recuperar_contexto_documento(
        doc_id=doc_id_desenvolvedor(developer_id),
        question=question,
        max_chars=max_chars,
        top_k=top_k,
        normalizar=True,
    )


# --------------------------------------------------------------------------
# Recuperacao de contexto na base de conhecimento COMPLETA (chat geral)
# --------------------------------------------------------------------------
_TRADUCAO_TERMOS_BANCO = (
    (re.compile(r"\bstatus ativo:\s*true\b", re.IGNORECASE), "status Ativo"),
    (re.compile(r"\bstatus ativo:\s*false\b", re.IGNORECASE), "status Inativo"),
    (re.compile(r"\bPLANNED\b"), "Planejado"),
    (re.compile(r"\bIN_PROGRESS\b"), "Em andamento"),
    (re.compile(r"\bDONE\b"), "Concluído"),
)


def normalizar_termos_banco(texto: str) -> str:
    """Converte codigos do banco (enums/booleanos em ingles) para rotulos em portugues."""
    for padrao, substituto in _TRADUCAO_TERMOS_BANCO:
        texto = padrao.sub(substituto, texto)
    return texto


_RE_PROJETO_HEADER = re.compile(r"---\s*PROJETO:\s*(.+?)\s*---")
_RE_DEV_HEADER = re.compile(r"---\s*DESENVOLVEDOR:\s*(.+?)\s*---")


def extrair_fonte_documento(doc_id: str, texto: str) -> dict[str, Any]:
    """Identifica o tipo, ID e titulo legivel de um documento indexado no LightRAG."""
    if doc_id.startswith("projeto_"):
        sufixo = doc_id.removeprefix("projeto_")
        entity_id = int(sufixo) if sufixo.isdigit() else None
        m = _RE_PROJETO_HEADER.search(texto)
        titulo = m.group(1).strip() if m else f"Projeto {sufixo}"
        return {
            "id": doc_id,
            "type": "project",
            "entity_id": entity_id,
            "title": titulo,
        }

    if doc_id.startswith("dev_"):
        sufixo = doc_id.removeprefix("dev_")
        entity_id = int(sufixo) if sufixo.isdigit() else None
        m = _RE_DEV_HEADER.search(texto)
        titulo = m.group(1).strip() if m else f"Desenvolvedor {sufixo}"
        return {
            "id": doc_id,
            "type": "developer",
            "entity_id": entity_id,
            "title": titulo,
        }

    m_proj = _RE_PROJETO_HEADER.search(texto)
    if m_proj:
        return {
            "id": doc_id,
            "type": "project",
            "entity_id": None,
            "title": m_proj.group(1).strip(),
        }

    m_dev = _RE_DEV_HEADER.search(texto)
    if m_dev:
        return {
            "id": doc_id,
            "type": "developer",
            "entity_id": None,
            "title": m_dev.group(1).strip(),
        }

    return {
        "id": doc_id,
        "type": "document",
        "entity_id": None,
        "title": doc_id,
    }


def _extrair_chunks_list(status: Any) -> list[str]:
    if not status:
        return []
    if isinstance(status, dict):
        return list(status.get("chunks_list") or [])
    return list(getattr(status, "chunks_list", None) or [])


async def _obter_todos_status_docs(rag: LightRAG) -> dict[str, Any]:
    if hasattr(rag.doc_status, "get_docs_by_statuses"):
        return await rag.doc_status.get_docs_by_statuses(list(DocStatus))
    if hasattr(rag.doc_status, "docs"):
        return dict(rag.doc_status.docs)
    return {}


async def _consultar_grafo_lightrag(
    rag: LightRAG,
    question: str,
    top_k: int,
) -> tuple[str, set[str], list[dict[str, Any]]]:
    """Consulta o grafo e vetores do LightRAG (modo mix) sem chamadas ao LLM."""
    if not hasattr(rag, "aquery_data"):
        return "", set(), []

    try:
        resultado = await rag.aquery_data(
            question,
            param=QueryParam(
                mode="mix",
                top_k=top_k,
                chunk_top_k=top_k,
                hl_keywords=[question],
                ll_keywords=[question],
                enable_rerank=False,
            ),
        )
    except Exception:
        return "", set(), []

    if not isinstance(resultado, dict) or resultado.get("status") != "success":
        return "", set(), []

    dados = resultado.get("data") or {}
    entidades = dados.get("entities") or []
    relacoes = dados.get("relationships") or []
    chunks_raw = dados.get("chunks") or []

    linhas_grafo: list[str] = []
    for ent in entidades[:top_k]:
        nome = (ent.get("entity_name") or "").strip()
        desc = (ent.get("description") or "").strip()
        if nome and desc:
            linhas_grafo.append(f"- {nome}: {desc}")

    for rel in relacoes[:top_k]:
        src = (rel.get("src_id") or "").strip()
        tgt = (rel.get("tgt_id") or "").strip()
        desc = (rel.get("description") or "").strip()
        if src and tgt and desc:
            linhas_grafo.append(f"- {src} -> {tgt}: {desc}")

    resumo_grafo = ""
    if linhas_grafo:
        resumo_grafo = "--- GRAFO DE CONHECIMENTO (LightRAG) ---\n" + "\n".join(linhas_grafo)

    chunk_ids = {
        str(c.get("chunk_id") or c.get("id"))
        for c in chunks_raw
        if c.get("chunk_id") or c.get("id")
    }
    return resumo_grafo, chunk_ids, chunks_raw


async def recuperar_contexto_geral(
    question: str,
    max_chars: int | None = None,
    top_k: int | None = None,
) -> tuple[str, list[dict[str, Any]]]:
    """Recupera o contexto da base de conhecimento completa e as fontes utilizadas."""
    max_chars = max_chars or settings.chat_context_max_chars
    top_k = top_k or settings.chat_context_top_k

    rag = get_rag()
    docs_status = await _obter_todos_status_docs(rag)

    # Mapeia doc_id -> lista de chunk_ids preservando a ordem de cada documento.
    tem_docs_sistema = any(
        d.startswith(("projeto_", "dev_")) for d in docs_status
    )
    mapa_doc_chunks: list[tuple[str, list[str]]] = []
    todos_chunk_ids: list[str] = []
    for doc_id, status in docs_status.items():
        if doc_id.startswith("dup-"):
            continue
        if tem_docs_sistema and not doc_id.startswith(("projeto_", "dev_")):
            continue
        cids = _extrair_chunks_list(status)
        if cids:
            mapa_doc_chunks.append((doc_id, cids))
            todos_chunk_ids.extend(cids)

    registros_por_id: dict[str, dict[str, Any]] = {}
    if todos_chunk_ids:
        registros = await rag.text_chunks.get_by_ids(todos_chunk_ids)
        for cid, reg in zip(todos_chunk_ids, registros):
            if reg and reg.get("content", "").strip():
                registros_por_id[cid] = reg

    todos_chunks: list[dict[str, Any]] = []
    fontes_por_doc: dict[str, dict[str, Any]] = {}
    cabecalho_por_doc: dict[str, str] = {}

    for doc_id, cids in mapa_doc_chunks:
        chunks_doc = [
            {
                "id": cid,
                "doc_id": doc_id,
                "ordem": registros_por_id[cid].get("chunk_order_index", idx),
                "texto": normalizar_termos_banco(registros_por_id[cid]["content"].strip()),
            }
            for idx, cid in enumerate(cids)
            if cid in registros_por_id
        ]
        if not chunks_doc:
            continue
        chunks_doc.sort(key=lambda c: c["ordem"])
        primeiro_texto = chunks_doc[0]["texto"]
        fontes_por_doc[doc_id] = extrair_fonte_documento(doc_id, primeiro_texto)
        primeira_linha = primeiro_texto.splitlines()[0].strip() if primeiro_texto else ""
        if primeira_linha.startswith("---"):
            cabecalho_por_doc[doc_id] = primeira_linha
        todos_chunks.extend(chunks_doc)

    # Base pequena: envia todos os documentos na integra, sem precisar chamar o
    # modelo de embedding (evita descarregar o Qwen3 da memoria do Ollama quando
    # OLLAMA_MAX_LOADED_MODELS=1).
    total_chars_chunks = sum(len(c["texto"]) for c in todos_chunks)
    if todos_chunks and total_chars_chunks <= max_chars:
        partes = [c["texto"] for c in todos_chunks]
        fontes = list(fontes_por_doc.values())
        return "\n\n".join(partes), fontes

    resumo_grafo, chunks_grafo_ids, chunks_grafo_raw = await _consultar_grafo_lightrag(
        rag, question, top_k=top_k
    )

    # Caso o doc_status esteja vazio mas o LightRAG tenha retornado chunks via aquery_data:
    if not todos_chunks and chunks_grafo_raw:
        for idx, c in enumerate(chunks_grafo_raw):
            texto = normalizar_termos_banco((c.get("content") or "").strip())
            if not texto:
                continue
            cid = str(c.get("chunk_id") or c.get("id") or f"chunk_{idx}")
            doc_id = str(c.get("file_path") or c.get("full_doc_id") or f"doc_{idx}")
            todos_chunks.append({"id": cid, "doc_id": doc_id, "ordem": idx, "texto": texto})
            if doc_id not in fontes_por_doc:
                fontes_por_doc[doc_id] = extrair_fonte_documento(doc_id, texto)

    if not todos_chunks and not resumo_grafo:
        return "", []

    # Base grande: ranqueia os chunks por similaridade vetorial + relevancia no grafo.
    escolhidos: list[dict[str, Any]] = []
    if todos_chunks:
        vetores = await rag.chunks_vdb.get_vectors_by_ids([c["id"] for c in todos_chunks])
        consulta = np.array((await embedding_func([question]))[0], dtype=float)

        pontuados: list[tuple[float, dict[str, Any]]] = []
        for c in todos_chunks:
            score = 0.0
            if c["id"] in vetores:
                score = _cosseno(consulta, np.array(vetores[c["id"]], dtype=float))
            if c["id"] in chunks_grafo_ids:
                score += 0.05
            pontuados.append((score, c))

        pontuados.sort(key=lambda par: par[0], reverse=True)

        usado = 0
        docs_vistos: list[str] = []
        melhor_score_doc: dict[str, float] = {}

        for score, chunk in pontuados:
            if len(escolhidos) >= top_k:
                break
            doc_id = chunk["doc_id"]
            cabecalho_extra = ""
            if doc_id not in docs_vistos and chunk["ordem"] > 0 and doc_id in cabecalho_por_doc:
                cabecalho_extra = cabecalho_por_doc[doc_id] + "\n"

            custo = len(cabecalho_extra) + len(chunk["texto"])
            if escolhidos and usado + custo > max_chars:
                continue

            escolhidos.append(chunk)
            usado += custo
            if doc_id not in docs_vistos:
                docs_vistos.append(doc_id)
            if doc_id not in melhor_score_doc or score > melhor_score_doc[doc_id]:
                melhor_score_doc[doc_id] = score

        # Agrupa os chunks escolhidos por documento (ordenado pela maior relevancia)
        # e preserva a ordem original dos chunks dentro de cada documento.
        docs_ordenados = sorted(
            docs_vistos,
            key=lambda d: melhor_score_doc.get(d, 0.0),
            reverse=True,
        )
        blocos: list[str] = []
        fontes_selecionadas: list[dict[str, Any]] = []

        for doc_id in docs_ordenados:
            chunks_do_doc = sorted(
                (c for c in escolhidos if c["doc_id"] == doc_id),
                key=lambda c: c["ordem"],
            )
            if not chunks_do_doc:
                continue
            tem_primeiro = any(c["ordem"] == 0 for c in chunks_do_doc)
            textos_doc = [c["texto"] for c in chunks_do_doc]
            if not tem_primeiro and doc_id in cabecalho_por_doc:
                textos_doc[0] = f"{cabecalho_por_doc[doc_id]}\n{textos_doc[0]}"
            blocos.extend(textos_doc)
            if doc_id in fontes_por_doc:
                fontes_selecionadas.append(fontes_por_doc[doc_id])

        if resumo_grafo and usado + len(resumo_grafo) + 2 <= max_chars:
            blocos.append(resumo_grafo)

        return "\n\n".join(blocos), fontes_selecionadas

    return resumo_grafo, []
