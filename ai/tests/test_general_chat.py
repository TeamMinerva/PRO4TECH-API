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


async def test_executar_ate_desconectar_cancela_corrotina_quando_cliente_desconecta():
    import asyncio
    from types import SimpleNamespace

    import pytest
    from app.cancelamento import (
        RequisicaoCanceladaPeloCliente,
        executar_ate_desconectar,
    )

    evento_cancelada = asyncio.Event()
    evento_iniciada = asyncio.Event()

    async def tarefa_longa():
        evento_iniciada.set()
        try:
            await asyncio.sleep(30)
        except asyncio.CancelledError:
            evento_cancelada.set()
            raise

    async def receive():
        await evento_iniciada.wait()
        return {"type": "http.disconnect"}

    fake_request = SimpleNamespace(
        receive=receive,
        url=SimpleNamespace(path="/chat/general"),
    )

    with pytest.raises(RequisicaoCanceladaPeloCliente):
        await executar_ate_desconectar(fake_request, tarefa_longa())

    assert evento_cancelada.is_set()


async def test_chat_geral_inclui_todos_desenvolvedores_citados_na_resposta(client, monkeypatch):
    todas = [
        {
            "id": "projeto_3",
            "type": "project",
            "entity_id": 3,
            "title": "Portal de Análise de Crédito e Prevenção a Fraudes",
        },
        {"id": "dev_1", "type": "developer", "entity_id": 1, "title": "Letícia Furtado"},
        {"id": "dev_2", "type": "developer", "entity_id": 2, "title": "Isaura Batista"},
        {"id": "dev_4", "type": "developer", "entity_id": 4, "title": "Guilherme Rosa"},
        {"id": "dev_5", "type": "developer", "entity_id": 5, "title": "Caio César"},
        {"id": "dev_6", "type": "developer", "entity_id": 6, "title": "Wendy Mininel"},
    ]

    async def fake_contexto_geral(question, **kwargs):
        return (
            "--- PROJETO: Portal de Análise de Crédito e Prevenção a Fraudes ---",
            [todas[0], todas[1]],
            todas,
        )

    async def fake_chat(messages):
        return (
            "Os desenvolvedores que trabalham no projeto Portal de Análise de Crédito e Prevenção a Fraudes são:\n"
            "1. Letícia Furtado\n"
            "2. Caio César\n"
            "3. Guilherme Rosa\n"
            "4. Isaura Batista"
        )

    monkeypatch.setattr(rag, "recuperar_contexto_geral", fake_contexto_geral)
    monkeypatch.setattr(ollama_client, "chat", fake_chat)

    resp = await client.post(
        "/chat/general",
        json={"question": "e quais desenvolvedores trabalham nesse projeto?"},
    )

    assert resp.status_code == 200
    assert [f["id"] for f in resp.json()["sources"]] == [
        "projeto_3",
        "dev_1",
        "dev_5",
        "dev_4",
        "dev_2",
    ]


async def test_chat_geral_ignora_acentos_e_respeita_limites_de_palavra(client, monkeypatch):
    todas = [
        {"id": "dev_5", "type": "developer", "entity_id": 5, "title": "Caio César"},
        {"id": "dev_9", "type": "developer", "entity_id": 9, "title": "Ana"},
    ]

    async def fake_contexto_geral(question, **kwargs):
        return "ctx", [], todas

    async def fake_chat(messages):
        return "O Portal de Análise conta com Caio Cesar."

    monkeypatch.setattr(rag, "recuperar_contexto_geral", fake_contexto_geral)
    monkeypatch.setattr(ollama_client, "chat", fake_chat)

    resp = await client.post("/chat/general", json={"question": "quem atua?"})
    assert resp.status_code == 200
    assert resp.json()["sources"] == [
        {"id": "dev_5", "type": "developer", "entity_id": 5, "title": "Caio César"}
    ]


async def test_chat_geral_fallback_nao_vaza_fontes_extras_nao_citadas(client, monkeypatch):
    brutas = [{"id": "projeto_1", "type": "project", "entity_id": 1, "title": "Alfa"}]
    todas = [
        *brutas,
        {"id": "dev_6", "type": "developer", "entity_id": 6, "title": "Wendy Mininel"},
    ]

    async def fake_contexto_geral(question, **kwargs):
        return "ctx", brutas, todas

    async def fake_chat(messages):
        return "Não há detalhes adicionais registrados."

    monkeypatch.setattr(rag, "recuperar_contexto_geral", fake_contexto_geral)
    monkeypatch.setattr(ollama_client, "chat", fake_chat)

    resp = await client.post("/chat/general", json={"question": "tem mais algo?"})
    assert resp.status_code == 200
    assert resp.json()["sources"] == brutas
