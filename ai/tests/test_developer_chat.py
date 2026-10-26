from app import ollama_client, rag


async def test_chat_desenvolvedor_sucesso(client, monkeypatch):
    capturado = {}

    async def fake_contexto(developer_id, question, **kwargs):
        capturado["developer_id"] = developer_id
        return "--- DESENVOLVEDOR: Letícia Furtado ---\nCompetências técnicas: Node.js, React."

    async def fake_chat(messages):
        capturado["messages"] = messages
        return "Domina Node.js e React."

    monkeypatch.setattr(rag, "recuperar_contexto_desenvolvedor", fake_contexto)
    monkeypatch.setattr(ollama_client, "chat", fake_chat)

    resp = await client.post(
        "/chat/developer",
        json={
            "developer_id": 2,
            "question": "Quais competências?",
            "history": [
                {"role": "user", "content": "oi"},
                {"role": "assistant", "content": "olá"},
            ],
        },
    )

    assert resp.status_code == 200
    assert resp.json() == {"developer_id": 2, "answer": "Domina Node.js e React."}
    assert capturado["developer_id"] == 2

    msgs = capturado["messages"]
    assert msgs[0]["role"] == "system" and "DESENVOLVEDOR: Letícia Furtado" in msgs[0]["content"]
    assert [m["role"] for m in msgs[1:]] == ["user", "assistant", "user"]
    assert msgs[-1]["content"] == "Quais competências?"


async def test_chat_desenvolvedor_sem_contexto_avisa_o_modelo(client, monkeypatch):
    vistos = []

    async def fake_contexto(developer_id, question, **kwargs):
        return ""

    async def fake_chat(messages):
        vistos.append(messages[0]["content"])
        return "Não há dados."

    monkeypatch.setattr(rag, "recuperar_contexto_desenvolvedor", fake_contexto)
    monkeypatch.setattr(ollama_client, "chat", fake_chat)

    resp = await client.post("/chat/developer", json={"developer_id": 1, "question": "?"})
    assert resp.status_code == 200
    assert "Nenhuma informação relevante" in vistos[0]


async def test_chat_desenvolvedor_valida_entrada(client):
    assert (await client.post("/chat/developer", json={"developer_id": 0, "question": "x"})).status_code == 422
    assert (await client.post("/chat/developer", json={"developer_id": 1, "question": "  "})).status_code == 422
    assert (
        await client.post(
            "/chat/developer",
            json={"developer_id": 1, "question": "x", "history": [{"role": "system", "content": "y"}]},
        )
    ).status_code == 422


async def test_chat_desenvolvedor_timeout_e_indisponivel(client, monkeypatch):
    async def fake_contexto(developer_id, question, **kwargs):
        return "ctx"

    monkeypatch.setattr(rag, "recuperar_contexto_desenvolvedor", fake_contexto)

    async def timeout(messages):
        raise ollama_client.OllamaTimeout()

    monkeypatch.setattr(ollama_client, "chat", timeout)
    assert (await client.post("/chat/developer", json={"developer_id": 1, "question": "x"})).status_code == 504

    async def fora(messages):
        raise ollama_client.OllamaUnavailable("recusada")

    monkeypatch.setattr(ollama_client, "chat", fora)
    assert (await client.post("/chat/developer", json={"developer_id": 1, "question": "x"})).status_code == 503


async def test_chat_desenvolvedor_rag_nao_inicializado_retorna_500(client):
    resp = await client.post("/chat/developer", json={"developer_id": 1, "question": "x"})
    assert resp.status_code == 500
