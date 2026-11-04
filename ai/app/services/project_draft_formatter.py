from app.config import settings
from app.schemas.project_draft_schema import ProjectDraft

TRUNCADO = "[... rascunho truncado por tamanho ...]"


def formatar_rascunho(draft: ProjectDraft, max_chars: int | None = None) -> str:
    limite = max_chars if max_chars is not None else settings.chat_context_max_chars
    linhas: list[str] = []

    def campo(rotulo: str, valor: str, nivel: int = 0) -> None:
        if valor:
            linhas.append(f"{'  ' * nivel}{rotulo}: {valor}")

    campo("Projeto", draft.name)
    campo("Status", draft.status)
    campo("Tecnologias", ", ".join(draft.technologies))

    for i, epic in enumerate(draft.epics, start=1):
        linhas.append(f"Épico {i}:")
        campo("Nome", epic.name, 1)
        campo("Descrição", epic.description, 1)
        campo("Objetivo", epic.objective, 1)
        campo("Resultado esperado", epic.expected_result, 1)
        for j, feature in enumerate(epic.features, start=1):
            linhas.append(f"  Feature {i}.{j}:")
            campo("Nome", feature.name, 2)
            campo("Descrição", feature.description, 2)
            campo("Critérios de aprovação", feature.approval_criteria, 2)
            for k, pbi in enumerate(feature.pbis, start=1):
                linhas.append(f"    PBI {i}.{j}.{k}:")
                campo("Título", pbi.title, 3)
                campo("User story", pbi.user_story, 3)
                campo("Critérios de aceitação", pbi.acceptance_criteria, 3)
                campo("Desenvolvedores", ", ".join(pbi.developers), 3)

    texto = "\n".join(linhas)
    if len(texto) <= limite:
        return texto
    return texto[: max(limite - len(TRUNCADO) - 1, 0)].rstrip() + "\n" + TRUNCADO
