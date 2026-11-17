import numpy as np

from app import ollama_client, rag
from app.services import developer_recommendation_service as service


def dev_chunk(developer_id, nome, status, texto, vetor):
    return {
        "id": f"dev_{developer_id}-c0",
        "ordem": 0,
        "texto": f"--- DESENVOLVEDOR: {nome} ---\nO desenvolvedor '{nome}' está com status {status}. {texto}",
        "vetor": vetor,
    }


def montar(monkeypatch, devs, consulta=(1.0, 0.0)):
    async def fake_listar():
        return devs

    async def fake_embedding(texts):
        return np.array([consulta])

    monkeypatch.setattr(rag, "listar_chunks_desenvolvedores", fake_listar)
    monkeypatch.setattr(rag, "embedding_func", fake_embedding)


async def fake_ask(prompt, system_prompt=None, think=None):
    return "Atuou em funcionalidades parecidas."


BODY = {"pbi_id": 7, "title": "Login com JWT", "user_story": "Como usuário quero entrar"}


async def test_recommends_ordered_and_excludes_inactive(client, monkeypatch):
    montar(
        monkeypatch,
        {
            1: [dev_chunk(1, "Ana", "Ativo", "PBI login.", [0.9, 0.1])],
            2: [dev_chunk(2, "Beto", "Inativo", "PBI login.", [1.0, 0.0])],
            3: [dev_chunk(3, "Caio", "Ativo", "PBI login.", [0.7, 0.7])],
            4: [dev_chunk(4, "Duda", "Ativo", "PBI relatórios.", [0.0, 1.0])],
        },
    )
    monkeypatch.setattr(ollama_client, "ask", fake_ask)

    response = await client.post("/developers/recommend", json=BODY)

    assert response.status_code == 200
    body = response.json()
    assert [d["developer_id"] for d in body["developers"]] == [1, 3]
    assert body["developers"][0]["name"] == "Ana"
    assert body["developers"][0]["justification"]
    assert body["automatic_assignment"] is False


async def test_explicitly_inactive_ids_are_excluded(client, monkeypatch):
    montar(
        monkeypatch,
        {1: [dev_chunk(1, "Ana", "Ativo", "PBI login.", [1.0, 0.0])]},
    )
    monkeypatch.setattr(ollama_client, "ask", fake_ask)

    response = await client.post(
        "/developers/recommend", json={**BODY, "inactive_developer_ids": [1]}
    )

    assert response.json()["developers"] == []


async def test_no_relevant_match_returns_empty_with_message(client, monkeypatch):
    montar(
        monkeypatch,
        {1: [dev_chunk(1, "Ana", "Ativo", "PBI relatórios.", [0.0, 1.0])]},
    )
    called = []

    async def spy_ask(*args, **kwargs):
        called.append(1)
        return "x"

    monkeypatch.setattr(ollama_client, "ask", spy_ask)

    response = await client.post("/developers/recommend", json=BODY)

    assert response.status_code == 200
    body = response.json()
    assert body["developers"] == []
    assert body["message"] == service.NO_MATCH_MESSAGE
    assert called == []


async def test_status_missing_in_text_is_treated_as_not_active(client, monkeypatch):
    chunk = dev_chunk(1, "Ana", "Ativo", "PBI login.", [1.0, 0.0])
    chunk["texto"] = "--- DESENVOLVEDOR: Ana ---\nSem status."
    montar(monkeypatch, {1: [chunk]})
    monkeypatch.setattr(ollama_client, "ask", fake_ask)

    response = await client.post("/developers/recommend", json=BODY)

    assert response.json()["developers"] == []


async def test_empty_knowledge_base_returns_message(client, monkeypatch):
    montar(monkeypatch, {})

    response = await client.post("/developers/recommend", json=BODY)

    assert response.status_code == 200
    assert response.json()["developers"] == []


async def test_invalid_payload_is_rejected(client):
    response = await client.post("/developers/recommend", json={"title": ""})
    assert response.status_code == 422


async def test_ollama_unavailable_returns_503(client, monkeypatch):
    montar(monkeypatch, {1: [dev_chunk(1, "Ana", "Ativo", "login", [1.0, 0.0])]})

    async def boom(*args, **kwargs):
        raise ollama_client.OllamaUnavailable("fora do ar")

    monkeypatch.setattr(ollama_client, "ask", boom)

    response = await client.post("/developers/recommend", json=BODY)

    assert response.status_code == 503
