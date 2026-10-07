from app import ollama_client


async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "model" in body and "think" in body


async def test_ask_sucesso(client, monkeypatch):
    async def fake_ask(question: str) -> str:
        return f"resposta para: {question}"

    monkeypatch.setattr(ollama_client, "ask", fake_ask)

    resp = await client.post("/ask", json={"question": "oi"})
    assert resp.status_code == 200
    assert resp.json() == {"answer": "resposta para: oi"}


async def test_ask_pergunta_vazia(client):
    resp = await client.post("/ask", json={"question": ""})
    assert resp.status_code == 422


async def test_ask_timeout(client, monkeypatch):
    async def fake_ask(question: str) -> str:
        raise ollama_client.OllamaTimeout()

    monkeypatch.setattr(ollama_client, "ask", fake_ask)

    resp = await client.post("/ask", json={"question": "oi"})
    assert resp.status_code == 504


async def test_ask_ollama_indisponivel(client, monkeypatch):
    async def fake_ask(question: str) -> str:
        raise ollama_client.OllamaUnavailable("conexao recusada")

    monkeypatch.setattr(ollama_client, "ask", fake_ask)

    resp = await client.post("/ask", json={"question": "oi"})
    assert resp.status_code == 503
    assert "conexao recusada" in resp.json()["detail"]
