import numpy as np

from app import rag
from tests.test_rag_projeto import montar_rag


async def test_base_vazia_retorna_vazio(monkeypatch):
    montar_rag(monkeypatch, {}, {})
    ctx, fontes = await rag.recuperar_contexto_geral("quais projetos existem?")
    assert ctx == ""
    assert fontes == []


async def test_base_pequena_retorna_projetos_e_desenvolvedores_com_fontes(monkeypatch):
    montar_rag(
        monkeypatch,
        {
            "projeto_1": [
                "--- PROJETO: Portal Minerva ---\nStatus: IN_PROGRESS. Tecnologias: React, FastAPI.",
                "Foi registrado o problema/bug 'Falha no JWT' no projeto 'Portal Minerva'. Solução aplicada: Ajuste de expiração.",
            ],
            "dev_3": [
                "--- DESENVOLVEDOR: Carlos Lima ---\nO desenvolvedor 'Carlos Lima' está com status ativo: true. Competências técnicas: React, TypeScript.",
            ],
        },
        {},
    )
    ctx, fontes = await rag.recuperar_contexto_geral("quais problemas e desenvolvedores?")
    assert "Portal Minerva" in ctx
    assert "Em andamento" in ctx and "IN_PROGRESS" not in ctx
    assert "Falha no JWT" in ctx
    assert "Carlos Lima" in ctx
    assert "status Ativo" in ctx and "status ativo: true" not in ctx
    assert fontes == [
        {"id": "projeto_1", "type": "project", "entity_id": 1, "title": "Portal Minerva"},
        {"id": "dev_3", "type": "developer", "entity_id": 3, "title": "Carlos Lima"},
    ]


async def test_base_grande_ranqueia_e_preserva_cabecalho_do_documento(monkeypatch):
    montar_rag(
        monkeypatch,
        {
            "projeto_1": [
                "--- PROJETO: Sistema Alpha ---\n" + ("a" * 80),
                "Bug de autenticação OAuth resolvido com refresh token. " + ("b" * 60),
            ],
            "projeto_2": [
                "--- PROJETO: Sistema Beta ---\n" + ("c" * 80),
                "Épico de relatórios financeiros em CSV. " + ("d" * 60),
            ],
            "dev_5": [
                "--- DESENVOLVEDOR: Marina Souza ---\nEspecialista em OAuth e segurança. " + ("e" * 60),
            ],
        },
        {
            "projeto_1-c0": [1, 0, 0],
            "projeto_1-c1": [0, 1, 0],
            "projeto_2-c0": [0, 0, 1],
            "projeto_2-c1": [0, 0, 0.9],
            "dev_5-c0": [0, 0.95, 0],
        },
    )

    async def fake_embedding(texts):
        return np.array([[0, 1, 0]])

    monkeypatch.setattr(rag, "embedding_func", fake_embedding)

    # Orcamento comporta apenas os 2 chunks mais proximos de [0, 1, 0]:
    # projeto_1-c1 (que nao e o chunk 0, logo deve receber o cabecalho "--- PROJETO: Sistema Alpha ---")
    # e dev_5-c0.
    ctx, fontes = await rag.recuperar_contexto_geral(
        "Como resolveram o bug de OAuth?",
        max_chars=320,
        top_k=2,
    )

    assert "--- PROJETO: Sistema Alpha ---" in ctx
    assert "Bug de autenticação OAuth" in ctx
    assert "Marina Souza" in ctx
    assert "Sistema Beta" not in ctx
    assert [f["id"] for f in fontes] == ["projeto_1", "dev_5"]


async def test_base_grande_inclui_catalogo_resumido_de_todos_os_projetos(monkeypatch):
    montar_rag(
        monkeypatch,
        {
            "projeto_1": [
                "--- PROJETO: Portal ESG ---\nO projeto 'Portal ESG' está no status PLANNED. Tecnologias usadas: Python, React.\n"
                + ("x" * 3500),
            ],
            "projeto_2": [
                "--- PROJETO: Portal Crédito ---\nO projeto 'Portal Crédito' está no status DONE. Tecnologias usadas: Java, Python.\n"
                + ("y" * 3500),
            ],
            "projeto_3": [
                "--- PROJETO: Sistema Logística ---\nO projeto 'Sistema Logística' está no status IN_PROGRESS. Tecnologias usadas: Go, Docker.\n"
                + ("z" * 3500),
            ],
        },
        {
            "projeto_1-c0": [1, 0, 0],
            "projeto_2-c0": [0.5, 0.5, 0],
            "projeto_3-c0": [0, 0, 1],
        },
    )

    async def fake_embedding(texts):
        return np.array([[1, 0, 0]])

    monkeypatch.setattr(rag, "embedding_func", fake_embedding)

    ctx, fontes = await rag.recuperar_contexto_geral(
        "Liste todos os projetos que utilizam python",
        max_chars=5000,
        top_k=6,
    )

    assert "CATÁLOGO RESUMIDO DE PROJETOS" in ctx
    assert "Portal ESG" in ctx
    assert "Portal Crédito" in ctx
    assert "Sistema Logística" in ctx
    assert [f["id"] for f in fontes] == ["projeto_1", "projeto_2", "projeto_3"]
