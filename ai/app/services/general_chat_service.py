from typing import Any

from app import ollama_client, rag
from app.prompts.general_prompt import build_general_system_prompt
from app.schemas.general_chat_schema import (
    ContextSource,
    GeneralChatRequest,
    GeneralChatResponse,
)
from app.services.project_chat_service import limitar_historico

SEM_CONTEXTO = (
    "Nenhuma informação relevante foi encontrada na base de conhecimento."
)


def filtrar_fontes_utilizadas(
    fontes: list[dict[str, Any]],
    question: str,
    answer: str,
    fontes_extras: list[dict[str, Any]] | None = None,
) -> list[ContextSource]:
    """Destaca as fontes efetivamente mencionadas na pergunta ou na resposta."""
    if not fontes and not fontes_extras:
        return []

    escolhidas = rag.identificar_fontes_mencionadas(
        f"{question}\n{answer}",
        fontes,
        fontes_extras,
    ) or list(fontes)
    return [ContextSource(**f) for f in escolhidas]


class GeneralChatService:
    async def responder(self, request: GeneralChatRequest) -> GeneralChatResponse:
        resultado = await rag.recuperar_contexto_geral(
            question=request.question,
            incluir_todas_fontes=True,
        )
        if isinstance(resultado, tuple):
            if len(resultado) == 3:
                context, fontes_brutas, todas_fontes = resultado
            else:
                context, fontes_brutas = resultado
                todas_fontes = fontes_brutas
        else:
            context, fontes_brutas, todas_fontes = resultado, [], []

        if not context.strip():
            context = SEM_CONTEXTO
            fontes_brutas = []
            todas_fontes = []

        messages = [
            {
                "role": "system",
                "content": build_general_system_prompt(context, fontes_brutas),
            },
            *limitar_historico(request.history),
            {"role": "user", "content": request.question},
        ]

        answer = await ollama_client.chat(messages)
        if not answer:
            raise RuntimeError("O modelo não retornou uma resposta válida.")

        fontes = filtrar_fontes_utilizadas(
            fontes_brutas,
            request.question,
            answer,
            fontes_extras=todas_fontes,
        )
        return GeneralChatResponse(answer=answer, sources=fontes)


general_chat_service = GeneralChatService()
