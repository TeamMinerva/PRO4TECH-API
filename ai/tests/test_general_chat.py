from app import ollama_client, rag


async def test_chat_geral_sucesso_com_fontes(client, monkeypatch):
    capturado = {}

    async def fake_contexto_geral(question, **kwargs):
        capturado["question"] = question
        return (
            "--- PROJETO: Alfa ---\nUsa React e Node.\n\n--- DESENVOLVEDOR: Ana ---\nDomina React.",
            [
                {"id": "projeto_1", "type": "project", "entity_id": 1, "title": "Alfa"},
                {"id": "dev_2", "type": "developer", "entity_id": 2, "title": "Ana"},
            ],
        )

    async def fake_chat(messages):
        capturado["messages"] = messages
        return "O projeto Alfa usa React e conta com a desenvolvedora Ana."

    monkeypatch.setattr(rag, "recuperar_contexto_geral", fake_contexto_geral)
    monkeypatch.setattr(ollama_client, "chat", fake_chat)

    resp = await client.post(
        "/chat/general",
        json={
            "question": "Quem trabalha com React?",
            "history": [
                {"role": "user", "content": "oi"},
                {"role": "assistant", "content": "olá"},
            ],
        },
    )

    assert resp.status_code == 200
    dados = resp.json()
    assert dados["answer"] == "O projeto Alfa usa React e conta com a desenvolvedora Ana."
    assert dados["sources"] == [
        {"id": "projeto_1", "type": "project", "entity_id": 1, "title": "Alfa"},
        {"id": "dev_2", "type": "developer", "entity_id": 2, "title": "Ana"},
    ]
    assert capturado["question"] == "Quem trabalha com React?"

    msgs = capturado["messages"]
    assert msgs[0]["role"] == "system"
    assert "PROJETO: Alfa" in msgs[0]["content"]
    assert "DESENVOLVEDOR: Ana" in msgs[0]["content"]
    assert [m["role"] for m in msgs[1:]] == ["user", "assistant", "user"]
    assert msgs[-1]["content"] == "Quem trabalha com React?"


async def test_chat_geral_filtra_fontes_mencionadas(client, monkeypatch):
    async def fake_contexto_geral(question, **kwargs):
        return (
            "--- PROJETO: Projeto do Saci ---\nUsa React.\n\n--- DESENVOLVEDOR: Saci ---\nAtivo.",
            [
                {"id": "projeto_2", "type": "project", "entity_id": 2, "title": "Projeto do Saci"},
                {"id": "dev_5", "type": "developer", "entity_id": 5, "title": "Saci"},
            ],
        )

    async def fake_chat(messages):
        return "Apenas o Projeto do Saci utiliza React."

    monkeypatch.setattr(rag, "recuperar_contexto_geral", fake_contexto_geral)
    monkeypatch.setattr(ollama_client, "chat", fake_chat)

    resp = await client.post("/chat", json={"question": "Qual projeto usa React?"})
    assert resp.status_code == 200
    assert resp.json()["sources"] == [
        {"id": "projeto_2", "type": "project", "entity_id": 2, "title": "Projeto do Saci"}
    ]


async def test_chat_geral_sem_contexto_avisa_o_modelo(client, monkeypatch):
    vistos = []

    async def fake_contexto_geral(question, **kwargs):
        return "", []

    async def fake_chat(messages):
        vistos.append(messages[0]["content"])
        return "Não há informações registradas na base."

    monkeypatch.setattr(rag, "recuperar_contexto_geral", fake_contexto_geral)
    monkeypatch.setattr(ollama_client, "chat", fake_chat)

    resp = await client.post("/chat/general", json={"question": "Algum bug registrado?"})
    assert resp.status_code == 200
    assert resp.json()["sources"] == []
    assert "Nenhuma informação relevante" in vistos[0]


async def test_chat_geral_valida_entrada(client):
    assert (await client.post("/chat/general", json={"question": "   "})).status_code == 422
    assert (
        await client.post(
            "/chat/general",
            json={"question": "x", "history": [{"role": "system", "content": "y"}]},
        )
    ).status_code == 422
    assert (
        await client.post(
            "/chat/general",
            json={"question": "x", "campo_extra": 123},
        )
    ).status_code == 422


async def test_chat_geral_timeout_e_indisponivel(client, monkeypatch):
    async def fake_contexto_geral(question, **kwargs):
        return "ctx", []

    monkeypatch.setattr(rag, "recuperar_contexto_geral", fake_contexto_geral)

    async def timeout(messages):
        raise ollama_client.OllamaTimeout()

    monkeypatch.setattr(ollama_client, "chat", timeout)
    assert (await client.post("/chat/general", json={"question": "x"})).status_code == 504

    async def fora(messages):
        raise ollama_client.OllamaUnavailable("recusada")

    monkeypatch.setattr(ollama_client, "chat", fora)
    assert (await client.post("/chat/general", json={"question": "x"})).status_code == 503


async def test_chat_geral_rag_nao_inicializado_retorna_500(client):
    resp = await client.post("/chat/general", json={"question": "x"})
    assert resp.status_code == 500
