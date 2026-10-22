import numpy as np
import pytest

from app import ollama_client, rag


class FakeDocStatus:
    def __init__(self, docs):
        self.docs = docs

    async def get_by_id(self, doc_id):
        return self.docs.get(doc_id)


class FakeChunks:
    def __init__(self, chunks):
        self.chunks = chunks

    async def get_by_ids(self, ids):
        return [self.chunks.get(chunk_id) for chunk_id in ids]


class FakeVdb:
    def __init__(self, vectors):
        self.vectors = vectors

    async def get_vectors_by_ids(self, ids):
        return {chunk_id: self.vectors[chunk_id] for chunk_id in ids if chunk_id in self.vectors}


def montar_rag(monkeypatch, projects, vectors):
    docs = {}
    chunks = {}
    for project_id, textos in projects.items():
        doc_id = f"projeto_{project_id}"
        chunk_ids = [f"{doc_id}-c{index}" for index in range(len(textos))]
        docs[doc_id] = {"chunks_list": chunk_ids}
        for index, (chunk_id, texto) in enumerate(zip(chunk_ids, textos)):
            chunks[chunk_id] = {"content": texto, "chunk_order_index": index}

    class FakeRag:
        doc_status = FakeDocStatus(docs)
        text_chunks = FakeChunks(chunks)
        chunks_vdb = FakeVdb(vectors)

    monkeypatch.setattr(rag, "rag_instance", FakeRag())


async def test_similar_projects_orders_deduplicates_limits_and_preserves_evidence(
    client, monkeypatch
):
    montar_rag(
        monkeypatch,
        {
            1: ["Origem: autenticação", "Origem: usuários"],
            2: ["Candidato 2: login", "Candidato 2: gestão de usuários"],
            3: ["Candidato 3: relatórios"],
        },
        {
            "projeto_1-c0": [1, 0],
            "projeto_1-c1": [0, 1],
            "projeto_2-c0": [0.9, 0.1],
            "projeto_2-c1": [0.8, 0.2],
            "projeto_3-c0": [0, 1],
        },
    )
    prompts = []

    async def fake_ask(prompt, system_prompt=None, think=None):
        prompts.append((prompt, system_prompt, think))
        return "Os projetos compartilham autenticação e gestão de usuários."

    monkeypatch.setattr(ollama_client, "ask", fake_ask)

    response = await client.post(
        "/projects/similar",
        json={
            "project_id": 1,
            "candidate_project_ids": [1, 2, 3, 2],
            "limit": 1,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["project_id"] == 1
    assert [item["project_id"] for item in body["similar_projects"]] == [2]
    result = body["similar_projects"][0]
    expected_similarity = (0.9 / np.sqrt(0.82) + 0.2 / np.sqrt(0.68)) / 2
    assert result["similarity"] == pytest.approx(expected_similarity)
    assert result["justification"].startswith("Os projetos")
    assert result["evidence"][0] == {
        "text": "Candidato 2: login",
        "source_text": "Origem: autenticação",
    }
    assert len(result["evidence"]) == 2
    assert len(prompts) == 1
    assert "Origem: autenticação" in prompts[0][0]
    assert "Candidato 2: login" in prompts[0][0]
    assert prompts[0][2] is False
    assert body["unavailable_project_ids"] == []


async def test_similar_projects_missing_origin_returns_not_found(client, monkeypatch):
    montar_rag(monkeypatch, {}, {})
    response = await client.post(
        "/projects/similar",
        json={"project_id": 1, "candidate_project_ids": [2]},
    )
    assert response.status_code == 404


async def test_similar_projects_no_candidates_returns_empty_without_llm(client, monkeypatch):
    montar_rag(monkeypatch, {1: ["Projeto de origem"]}, {"projeto_1-c0": [1, 0]})

    async def unexpected_ask(*args, **kwargs):
        pytest.fail("Não deve gerar justificativa sem candidatos.")

    monkeypatch.setattr(ollama_client, "ask", unexpected_ask)
    response = await client.post(
        "/projects/similar",
        json={"project_id": 1, "candidate_project_ids": [1, 1]},
    )
    assert response.status_code == 200
    assert response.json()["similar_projects"] == []
    assert response.json()["unavailable_project_ids"] == []


async def test_similar_projects_skips_unindexed_or_vectorless_candidates(client, monkeypatch):
    montar_rag(
        monkeypatch,
        {1: ["Origem"], 2: ["Sem vetor"]},
        {"projeto_1-c0": [1, 0]},
    )
    response = await client.post(
        "/projects/similar",
        json={"project_id": 1, "candidate_project_ids": [2, 3]},
    )
    assert response.status_code == 200
    assert response.json()["similar_projects"] == []
    assert response.json()["unavailable_project_ids"] == [2, 3]


async def test_similar_projects_reports_missing_origin_embeddings(client, monkeypatch):
    montar_rag(monkeypatch, {1: ["Origem"]}, {})
    response = await client.post(
        "/projects/similar",
        json={"project_id": 1, "candidate_project_ids": []},
    )
    assert response.status_code == 409


async def test_similar_projects_rejects_invalid_parameters(client):
    for body in (
        {"project_id": 0, "candidate_project_ids": []},
        {"project_id": 1, "candidate_project_ids": [-2]},
        {"project_id": 1, "candidate_project_ids": [], "limit": 21},
        {"project_id": 1, "candidate_project_ids": [], "extra": True},
    ):
        response = await client.post("/projects/similar", json=body)
        assert response.status_code == 422


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [
        (ollama_client.OllamaTimeout(), 504),
        (ollama_client.OllamaUnavailable("offline"), 503),
    ],
)
async def test_similar_projects_returns_ollama_failures(
    client, monkeypatch, exception, status_code
):
    montar_rag(
        monkeypatch,
        {1: ["Origem"], 2: ["Candidato"]},
        {"projeto_1-c0": [1, 0], "projeto_2-c0": [1, 0]},
    )

    async def fail_ask(*args, **kwargs):
        raise exception

    monkeypatch.setattr(ollama_client, "ask", fail_ask)
    response = await client.post(
        "/projects/similar",
        json={"project_id": 1, "candidate_project_ids": [2]},
    )
    assert response.status_code == status_code
