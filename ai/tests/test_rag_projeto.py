import numpy as np

from app import rag


class FakeDocStatus:
    def __init__(self, docs):
        self.docs = docs

    async def get_by_id(self, doc_id):
        return self.docs.get(doc_id)


class FakeChunks:
    def __init__(self, chunks):
        self.chunks = chunks

    async def get_by_ids(self, ids):
        return [self.chunks.get(i) for i in ids]


class FakeVdb:
    def __init__(self, vectors):
        self.vectors = vectors

    async def get_vectors_by_ids(self, ids):
        return {i: self.vectors[i] for i in ids if i in self.vectors}


def montar_rag(monkeypatch, chunks_por_doc, vetores):
    docs, chunks = {}, {}
    for doc_id, textos in chunks_por_doc.items():
        ids = [f"{doc_id}-c{i}" for i in range(len(textos))]
        docs[doc_id] = {
            "status": "processed",
            "chunks_count": len(ids),
            "chunks_list": ids,
        }
        for i, (cid, texto) in enumerate(zip(ids, textos)):
            chunks[cid] = {"content": texto, "chunk_order_index": i}

    class FakeRag:
        doc_status = FakeDocStatus(docs)
        text_chunks = FakeChunks(chunks)
        chunks_vdb = FakeVdb(vetores)

    monkeypatch.setattr(rag, "rag_instance", FakeRag())


async def test_projeto_nao_indexado_retorna_vazio(monkeypatch):
    montar_rag(monkeypatch, {}, {})
    assert await rag.recuperar_contexto_projeto(1, "oi") == ""


async def test_projeto_pequeno_retorna_tudo_e_nao_mistura_outros(monkeypatch):
    montar_rag(
        monkeypatch,
        {
            "projeto_1": ["cabecalho A", "bug do projeto A"],
            "projeto_2": ["segredo do projeto B"],
        },
        {},
    )
    ctx = await rag.recuperar_contexto_projeto(1, "bugs?")
    assert "cabecalho A" in ctx and "bug do projeto A" in ctx
    assert "projeto B" not in ctx


async def test_projeto_grande_ranqueia_por_similaridade(monkeypatch):
    textos = ["CABECALHO " + "x" * 50, "banco " + "b" * 50, "login " + "l" * 50, "bug " + "g" * 50]
    vetores = {
        "projeto_1-c0": [1, 0, 0],
        "projeto_1-c1": [0, 1, 0],
        "projeto_1-c2": [0, 0, 1],
        "projeto_1-c3": [0, 0.9, 0.1],
    }
    montar_rag(monkeypatch, {"projeto_1": textos}, vetores)

    async def fake_embedding(texts):
        return np.array([[0, 1, 0]])

    monkeypatch.setattr(rag, "embedding_func", fake_embedding)

    # Orcamento so cabe ~3 chunks: cabecalho + os 2 mais proximos de [0,1,0].
    ctx = await rag.recuperar_contexto_projeto(1, "banco de dados", max_chars=200, top_k=3)
    assert ctx.startswith("CABECALHO")
    assert "banco" in ctx and "bug" in ctx
    assert "login" not in ctx
    assert len(ctx) <= 200 + 4
