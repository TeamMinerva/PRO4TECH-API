from types import SimpleNamespace

import numpy as np
import pytest

from app import rag


class FakeDocStatus:
    def __init__(self):
        self.document = None

    async def get_by_id(self, doc_id):
        return self.document


class FakeTextChunks:
    def __init__(self):
        self.chunks = {}

    async def get_by_ids(self, ids):
        return [self.chunks.get(chunk_id) for chunk_id in ids]


class FakeVectorStorage:
    def __init__(self, vectors):
        self.vectors = vectors

    async def get_vectors_by_ids(self, ids):
        return {chunk_id: self.vectors[chunk_id] for chunk_id in ids if chunk_id in self.vectors}


class FakeRag:
    def __init__(self, *, deletion_status="not_found", indexing_status="processed"):
        self.deletion_status = deletion_status
        self.indexing_status = indexing_status
        self.doc_status = FakeDocStatus()
        self.text_chunks = FakeTextChunks()
        self.chunks_vdb = FakeVectorStorage({"chunk-1": np.ones(rag.settings.embedding_dim).tolist()})
        self.inserted = []

    async def adelete_by_doc_id(self, doc_id):
        return SimpleNamespace(status=self.deletion_status)

    async def ainsert(self, text, ids):
        self.inserted.append((text, ids))
        self.doc_status.document = {
            "status": self.indexing_status,
            "chunks_count": 1,
            "chunks_list": ["chunk-1"],
        }
        self.text_chunks.chunks["chunk-1"] = {"content": text}


async def test_insert_verifies_document_chunks_and_vectors(monkeypatch):
    instance = FakeRag()
    monkeypatch.setattr(rag, "rag_instance", instance)

    await rag.insert("Projeto indexado", doc_id="projeto_1")

    assert instance.inserted == [("Projeto indexado", ["projeto_1"])]


async def test_insert_rejects_document_not_processed(monkeypatch):
    instance = FakeRag(indexing_status="failed")
    monkeypatch.setattr(rag, "rag_instance", instance)

    with pytest.raises(RuntimeError, match="não foi indexado completamente"):
        await rag.insert("Indexação falhou", doc_id="projeto_1")


async def test_insert_rejects_missing_vectors(monkeypatch):
    instance = FakeRag()
    instance.chunks_vdb = FakeVectorStorage({})
    monkeypatch.setattr(rag, "rag_instance", instance)

    with pytest.raises(RuntimeError, match="embeddings não estão todos disponíveis"):
        await rag.insert("Sem embedding", doc_id="projeto_1")


async def test_insert_does_not_ignore_delete_failures(monkeypatch):
    instance = FakeRag(deletion_status="fail")
    monkeypatch.setattr(rag, "rag_instance", instance)

    with pytest.raises(RuntimeError, match="documento projeto_1: fail"):
        await rag.insert("Não substitua", doc_id="projeto_1")
    assert instance.inserted == []
