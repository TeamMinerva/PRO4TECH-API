from app import ollama_client, rag
from app.prompts.developer_prompt import build_developer_system_prompt
from app.schemas.developer_chat_schema import DeveloperChatRequest
from app.services.project_chat_service import limitar_historico

SEM_CONTEXTO = (
    "Nenhuma informação relevante foi encontrada para o desenvolvedor selecionado."
)


class DeveloperChatService:
    async def responder(self, request: DeveloperChatRequest) -> str:
        # Somente informacoes pertencentes ao desenvolvedor selecionado.
        context = await rag.recuperar_contexto_desenvolvedor(
            developer_id=request.developer_id,
            question=request.question,
        )
        if not context.strip():
            context = SEM_CONTEXTO

        messages = [
            {
                "role": "system",
                "content": build_developer_system_prompt(
                    request.developer_id, context
                ),
            },
            *limitar_historico(request.history),
            {"role": "user", "content": request.question},
        ]

        answer = await ollama_client.chat(messages)
        if not answer:
            raise RuntimeError("O modelo não retornou uma resposta válida.")
        return answer


developer_chat_service = DeveloperChatService()
