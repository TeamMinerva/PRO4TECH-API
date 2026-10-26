import numpy as np

from app import rag
from tests.test_rag_projeto import montar_rag


async def test_desenvolvedor_nao_indexado_retorna_vazio(monkeypatch):
    montar_rag(monkeypatch, {}, {})
    assert await rag.recuperar_contexto_desenvolvedor(1, "oi") == ""


async def test_desenvolvedor_pequeno_retorna_tudo_normalizado_e_nao_mistura_outros(monkeypatch):
    montar_rag(
        monkeypatch,
        {
            "dev_1": [
                "--- DESENVOLVEDOR: Ana ---\nO desenvolvedor 'Ana' está com status ativo: true.",
                "Atua no projeto X (status PLANNED) e resolveu bug de WebSocket.",
            ],
            "dev_2": ["segredo do desenvolvedor B"],
        },
        {},
    )
    ctx = await rag.recuperar_contexto_desenvolvedor(1, "bugs?")
    assert "DESENVOLVEDOR: Ana" in ctx
    assert "status Ativo" in ctx and "status ativo: true" not in ctx
    assert "Planejado" in ctx and "PLANNED" not in ctx
    assert "bug de WebSocket" in ctx
    assert "desenvolvedor B" not in ctx


async def test_desenvolvedor_grande_ranqueia_por_similaridade(monkeypatch):
    textos = [
        "CABECALHO DEV " + "x" * 50,
        "bug websocket " + "b" * 50,
        "pbi login " + "l" * 50,
        "solucao ack " + "g" * 50,
    ]
    vetores = {
        "dev_1-c0": [1, 0, 0],
        "dev_1-c1": [0, 1, 0],
        "dev_1-c2": [0, 0, 1],
        "dev_1-c3": [0, 0.9, 0.1],
    }
    montar_rag(monkeypatch, {"dev_1": textos}, vetores)

    async def fake_embedding(texts):
        return np.array([[0, 1, 0]])

    monkeypatch.setattr(rag, "embedding_func", fake_embedding)

    ctx = await rag.recuperar_contexto_desenvolvedor(1, "websocket", max_chars=210, top_k=3)
    assert ctx.startswith("CABECALHO DEV")
    assert "bug websocket" in ctx and "solucao ack" in ctx
    assert "pbi login" not in ctx
    assert len(ctx) <= 210 + 4
