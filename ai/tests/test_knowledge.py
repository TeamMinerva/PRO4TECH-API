from app import rag


async def test_insert_sucesso(client, monkeypatch):
    chamadas = []

    async def fake_insert(text: str) -> None:
        chamadas.append(text)

    monkeypatch.setattr(rag, "insert", fake_insert)

    resp = await client.post("/knowledge", json={"text": "Projeto X usa React."})
    assert resp.status_code == 204
    assert chamadas == ["Projeto X usa React."]


async def test_insert_texto_vazio(client):
    resp = await client.post("/knowledge", json={"text": ""})
    assert resp.status_code == 422


async def test_query_sucesso(client, monkeypatch):
    async def fake_query(question: str, mode: str = "mix") -> str:
        assert mode == "mix"
        return f"resposta contextual para: {question}"

    monkeypatch.setattr(rag, "query", fake_query)

    resp = await client.post("/knowledge/query", json={"question": "quais projetos usam React?"})
    assert resp.status_code == 200
    assert resp.json() == {"answer": "resposta contextual para: quais projetos usam React?"}


async def test_query_modo_customizado(client, monkeypatch):
    modos_recebidos = []

    async def fake_query(question: str, mode: str = "mix") -> str:
        modos_recebidos.append(mode)
        return "ok"

    monkeypatch.setattr(rag, "query", fake_query)

    await client.post("/knowledge/query", json={"question": "oi", "mode": "local"})
    assert modos_recebidos == ["local"]


async def test_query_rag_nao_inicializado(client):
    # Sem monkeypatch: get_rag() levanta RuntimeError porque o lifespan
    # (que chamaria rag.startup()) nunca roda nos testes.
    resp = await client.post("/knowledge/query", json={"question": "oi"})
    assert resp.status_code == 500
