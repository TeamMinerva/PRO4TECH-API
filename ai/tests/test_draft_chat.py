from app import ollama_client, rag

RASCUNHO = {
    "name": "Alfa",
    "technologies": ["React"],
    "epics": [{"name": "Login", "expectedResult": "Acesso seguro"}],
}


async def test_chat_rascunho_sucesso(client, monkeypatch):
    capturado = {}

    async def fake_contexto_geral(question, **kwargs):
        capturado["question"] = question
        return "--- PROJETO: Beta ---\nUsa Vue.", [{"id": "projeto_2", "title": "Beta"}]

    async def fake_chat(messages):
        capturado["messages"] = messages
        return "Falta definir as features do épico Login."

    monkeypatch.setattr(rag, "recuperar_contexto_geral", fake_contexto_geral)
    monkeypatch.setattr(ollama_client, "chat", fake_chat)

    resp = await client.post(
        "/chat/project-draft",
        json={
            "draft": RASCUNHO,
            "question": "O que falta?",
            "history": [
                {"role": "user", "content": "oi"},
                {"role": "assistant", "content": "olá"},
            ],
        },
    )

    assert resp.status_code == 200
    assert resp.json() == {"answer": "Falta definir as features do épico Login."}
    assert capturado["question"].startswith("O que falta?")
    assert "Projeto: Alfa" in capturado["question"]

    msgs = capturado["messages"]
    sistema = msgs[0]["content"]
    assert msgs[0]["role"] == "system"
    assert "Projeto: Alfa" in sistema and "Resultado esperado: Acesso seguro" in sistema
    assert "PROJETO: Beta" in sistema
    assert [m["role"] for m in msgs[1:]] == ["user", "assistant", "user"]
    assert msgs[-1]["content"] == "O que falta?"


async def test_chat_rascunho_vazio_e_sem_contexto_avisa_o_modelo(client, monkeypatch):
    capturado = {}

    async def fake_contexto_geral(question, **kwargs):
        return "", []

    async def fake_chat(messages):
        capturado["sistema"] = messages[0]["content"]
        return "ok"

    monkeypatch.setattr(rag, "recuperar_contexto_geral", fake_contexto_geral)
    monkeypatch.setattr(ollama_client, "chat", fake_chat)

    resp = await client.post(
        "/chat/project-draft",
        json={"draft": {}, "question": "Por onde começo?"},
    )

    assert resp.status_code == 200
    assert "O formulário ainda não foi preenchido." in capturado["sistema"]
    assert "Nenhuma informação relevante foi encontrada" in capturado["sistema"]


async def test_chat_rascunho_valida_entrada(client):
    sem_pergunta = await client.post("/chat/project-draft", json={"draft": {}, "question": "  "})
    sem_rascunho = await client.post("/chat/project-draft", json={"question": "oi"})
    campo_extra = await client.post(
        "/chat/project-draft",
        json={"draft": {"id": 3}, "question": "oi"},
    )

    assert sem_pergunta.status_code == 422
    assert sem_rascunho.status_code == 422
    assert campo_extra.status_code == 422


async def test_chat_rascunho_timeout_e_indisponivel(client, monkeypatch):
    async def fake_contexto_geral(question, **kwargs):
        return "", []

    monkeypatch.setattr(rag, "recuperar_contexto_geral", fake_contexto_geral)
    corpo = {"draft": RASCUNHO, "question": "oi"}

    async def timeout(messages):
        raise ollama_client.OllamaTimeout()

    async def indisponivel(messages):
        raise ollama_client.OllamaUnavailable("fora")

    monkeypatch.setattr(ollama_client, "chat", timeout)
    assert (await client.post("/chat/project-draft", json=corpo)).status_code == 504

    monkeypatch.setattr(ollama_client, "chat", indisponivel)
    assert (await client.post("/chat/project-draft", json=corpo)).status_code == 503
