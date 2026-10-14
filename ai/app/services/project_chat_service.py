from app import ollama_client, rag
from app.config import settings
from app.prompts.project_prompt import build_project_system_prompt
from app.schemas.project_chat_schema import ChatMessage, ProjectChatRequest

SEM_CONTEXTO = (
    "Nenhuma informação relevante foi encontrada para o projeto selecionado."
)


def limitar_historico(history: list[ChatMessage]) -> list[dict[str, str]]:
    """Mantem as mensagens mais recentes que cabem no orcamento de contexto."""
    selecionadas: list[dict[str, str]] = []
    usado = 0
    for message in reversed(history[-settings.chat_history_max_messages :]):
        if usado + len(message.content) > settings.chat_history_max_chars:
            break
        selecionadas.append({"role": message.role, "content": message.content})
        usado += len(message.content)
    selecionadas.reverse()
    return selecionadas


class ProjectChatService:
    async def responder(self, request: ProjectChatRequest) -> str:
        # Somente informacoes pertencentes ao projeto.
        context = await rag.recuperar_contexto_projeto(
            project_id=request.project_id,
            question=request.question,
        )
        if not context.strip():
            context = SEM_CONTEXTO

        messages = [
            {
                "role": "system",
                "content": build_project_system_prompt(request.project_id, context),
            },
            *limitar_historico(request.history),
            {"role": "user", "content": request.question},
        ]

        answer = await ollama_client.chat(messages)
        if not answer:
            raise RuntimeError("O modelo não retornou uma resposta válida.")
        return answer


project_chat_service = ProjectChatService()
