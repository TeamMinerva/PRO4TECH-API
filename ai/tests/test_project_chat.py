from app import ollama_client, rag


async def test_chat_projeto_sucesso(client, monkeypatch):
    capturado = {}

    async def fake_contexto(project_id, question, **kwargs):
        capturado["project_id"] = project_id
        return "PROJETO: Alfa. Usa React."

    async def fake_chat(messages):
        capturado["messages"] = messages
        return "Usa React."

    monkeypatch.setattr(rag, "recuperar_contexto_projeto", fake_contexto)
    monkeypatch.setattr(ollama_client, "chat", fake_chat)

    resp = await client.post(
        "/chat/project",
        json={
            "project_id": 7,
            "question": "Qual tecnologia?",
            "history": [
                {"role": "user", "content": "oi"},
                {"role": "assistant", "content": "olá"},
            ],
        },
    )

    assert resp.status_code == 200
    assert resp.json() == {"project_id": 7, "answer": "Usa React."}
    assert capturado["project_id"] == 7

    msgs = capturado["messages"]
    assert msgs[0]["role"] == "system" and "PROJETO: Alfa" in msgs[0]["content"]
    assert [m["role"] for m in msgs[1:]] == ["user", "assistant", "user"]
    assert msgs[-1]["content"] == "Qual tecnologia?"


async def test_chat_projeto_sem_contexto_avisa_o_modelo(client, monkeypatch):
    vistos = []

    async def fake_contexto(project_id, question, **kwargs):
        return ""

    async def fake_chat(messages):
        vistos.append(messages[0]["content"])
        return "Não há dados."

    monkeypatch.setattr(rag, "recuperar_contexto_projeto", fake_contexto)
    monkeypatch.setattr(ollama_client, "chat", fake_chat)

    resp = await client.post("/chat/project", json={"project_id": 1, "question": "?"})
    assert resp.status_code == 200
    assert "Nenhuma informação relevante" in vistos[0]


async def test_chat_projeto_valida_entrada(client):
    assert (await client.post("/chat/project", json={"project_id": 0, "question": "x"})).status_code == 422
    assert (await client.post("/chat/project", json={"project_id": 1, "question": "  "})).status_code == 422
    assert (
        await client.post(
            "/chat/project",
            json={"project_id": 1, "question": "x", "history": [{"role": "system", "content": "y"}]},
        )
    ).status_code == 422


async def test_chat_projeto_timeout_e_indisponivel(client, monkeypatch):
    async def fake_contexto(project_id, question, **kwargs):
        return "ctx"

    monkeypatch.setattr(rag, "recuperar_contexto_projeto", fake_contexto)

    async def timeout(messages):
        raise ollama_client.OllamaTimeout()

    monkeypatch.setattr(ollama_client, "chat", timeout)
    assert (await client.post("/chat/project", json={"project_id": 1, "question": "x"})).status_code == 504

    async def fora(messages):
        raise ollama_client.OllamaUnavailable("recusada")

    monkeypatch.setattr(ollama_client, "chat", fora)
    assert (await client.post("/chat/project", json={"project_id": 1, "question": "x"})).status_code == 503


async def test_chat_projeto_rag_nao_inicializado_retorna_500(client):
    resp = await client.post("/chat/project", json={"project_id": 1, "question": "x"})
    assert resp.status_code == 500
