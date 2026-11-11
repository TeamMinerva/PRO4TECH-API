from app import ollama_client, rag
from app.prompts.draft_prompt import (
    DRAFT_ANALYSIS_USER_PROMPT,
    build_draft_analysis_system_prompt,
    build_draft_system_prompt,
)
from app.schemas.draft_chat_schema import DraftAnalysisRequest, DraftChatRequest
from app.services.project_chat_service import limitar_historico
from app.services.project_draft_formatter import formatar_rascunho


CONSULTA_RASCUNHO_MAX_CHARS = 800


class DraftChatService:
    async def responder(self, request: DraftChatRequest) -> str:
        draft_text = formatar_rascunho(request.draft)
        rascunho_resumido = formatar_rascunho(
            request.draft, max_chars=CONSULTA_RASCUNHO_MAX_CHARS
        )
        consulta = "\n\n".join(
            parte for parte in (request.question, rascunho_resumido) if parte
        )
        resultado = await rag.recuperar_contexto_geral(question=consulta)
        context = resultado[0] if isinstance(resultado, tuple) else resultado

        messages = [
            {
                "role": "system",
                "content": build_draft_system_prompt(draft_text, context.strip()),
            },
            *limitar_historico(request.history),
            {"role": "user", "content": request.question},
        ]

        answer = await ollama_client.chat(messages)
        if not answer:
            raise RuntimeError("O modelo não retornou uma resposta válida.")
        return answer

    async def analisar(self, request: DraftAnalysisRequest) -> str:
        draft_text = formatar_rascunho(request.draft)
        rascunho_resumido = formatar_rascunho(
            request.draft, max_chars=CONSULTA_RASCUNHO_MAX_CHARS
        )
        consulta = rascunho_resumido or DRAFT_ANALYSIS_USER_PROMPT
        resultado = await rag.recuperar_contexto_geral(question=consulta)
        context = resultado[0] if isinstance(resultado, tuple) else resultado

        messages = [
            {
                "role": "system",
                "content": build_draft_analysis_system_prompt(
                    draft_text, context.strip()
                ),
            },
            *limitar_historico(request.history),
            {"role": "user", "content": DRAFT_ANALYSIS_USER_PROMPT},
        ]

        answer = await ollama_client.chat(messages)
        if not answer:
            raise RuntimeError("O modelo não retornou uma resposta válida.")
        return answer


draft_chat_service = DraftChatService()
