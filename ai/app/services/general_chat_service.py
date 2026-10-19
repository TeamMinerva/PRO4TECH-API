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
) -> list[ContextSource]:
    """Destaca as fontes efetivamente mencionadas na pergunta ou na resposta."""
    if not fontes:
        return []

    texto_restante = f"{question}\n{answer}".casefold()
    ids_mencionados: set[str] = set()

    # Verifica primeiro os titulos mais longos para que um titulo curto contido
    # em outro (ex.: dev "Saci" dentro de "Projeto do Saci") so entre se tambem
    # aparecer fora do titulo maior.
    ordenadas_por_tamanho = sorted(
        fontes,
        key=lambda f: len(str(f.get("title") or "").strip()),
        reverse=True,
    )
    for f in ordenadas_por_tamanho:
        titulo = str(f.get("title") or "").strip().casefold()
        if titulo and titulo in texto_restante:
            ids_mencionados.add(str(f.get("id")))
            texto_restante = texto_restante.replace(titulo, " ")

    escolhidas = [f for f in fontes if str(f.get("id")) in ids_mencionados] or fontes
    return [ContextSource(**f) for f in escolhidas]


class GeneralChatService:
    async def responder(self, request: GeneralChatRequest) -> GeneralChatResponse:
        resultado = await rag.recuperar_contexto_geral(question=request.question)
        if isinstance(resultado, tuple):
            context, fontes_brutas = resultado
        else:
            context, fontes_brutas = resultado, []

        if not context.strip():
            context = SEM_CONTEXTO
            fontes_brutas = []

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

        fontes = filtrar_fontes_utilizadas(fontes_brutas, request.question, answer)
        return GeneralChatResponse(answer=answer, sources=fontes)


general_chat_service = GeneralChatService()
