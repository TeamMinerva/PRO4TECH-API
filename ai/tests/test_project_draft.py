import pytest
from pydantic import ValidationError

from app.schemas.project_draft_schema import ProjectDraft
from app.services.project_draft_formatter import TRUNCADO, formatar_rascunho

RASCUNHO = {
    "name": "Alfa",
    "status": "Planejado",
    "technologies": ["React", "Node"],
    "epics": [
        {
            "name": "Login",
            "objective": "Autenticar usuários",
            "expectedResult": "Acesso seguro",
            "features": [
                {
                    "name": "Tela de login",
                    "approvalCriteria": "Valida e-mail",
                    "pbis": [
                        {
                            "title": "Entrar",
                            "userStory": "Como usuário quero entrar",
                            "developers": ["Ana", "Caio"],
                        }
                    ],
                }
            ],
        }
    ],
}


def test_formata_apenas_o_preenchido_em_ordem():
    texto = formatar_rascunho(ProjectDraft.model_validate(RASCUNHO))

    assert texto.splitlines()[:3] == [
        "Projeto: Alfa",
        "Status: Planejado",
        "Tecnologias: React, Node",
    ]
    assert "Épico 1:" in texto and "  Feature 1.1:" in texto and "    PBI 1.1.1:" in texto
    assert "Resultado esperado: Acesso seguro" in texto
    assert "Desenvolvedores: Ana, Caio" in texto
    assert "Descrição" not in texto
    assert "Critérios de aceitação" not in texto


def test_rascunho_vazio_gera_texto_vazio():
    assert formatar_rascunho(ProjectDraft.model_validate({})) == ""


def test_aceita_nomes_em_snake_case_e_camel_case():
    camel = ProjectDraft.model_validate({"epics": [{"expectedResult": "x"}]})
    snake = ProjectDraft.model_validate({"epics": [{"expected_result": "x"}]})
    assert camel == snake


def test_rejeita_campo_desconhecido():
    with pytest.raises(ValidationError):
        ProjectDraft.model_validate({"name": "Alfa", "id": 3})
    with pytest.raises(ValidationError):
        ProjectDraft.model_validate({"epics": [{"nome": "errado"}]})


def test_rejeita_texto_acima_do_limite():
    with pytest.raises(ValidationError):
        ProjectDraft.model_validate({"name": "a" * 4001})


def test_trunca_no_limite_de_caracteres():
    draft = ProjectDraft.model_validate(
        {"epics": [{"name": "e" * 4000, "objective": "o" * 4000}]}
    )

    texto = formatar_rascunho(draft, max_chars=500)

    assert len(texto) <= 500
    assert texto.endswith(TRUNCADO)
