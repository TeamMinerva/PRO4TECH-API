import re

import httpx

from app.config import settings


class OllamaUnavailable(Exception):
    pass


class OllamaTimeout(Exception):
    pass


_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)


def limpar_resposta(texto: str) -> str:
    """Remove o raciocinio do modelo e devolve so a resposta final.

    Algumas variantes do Qwen3 (ex.: *-thinking-2507) iniciam o raciocinio sem
    a tag de abertura, entao so aparece "</think>" no meio do texto.
    """
    texto = _THINK_RE.sub("", texto)
    if "</think>" in texto:
        texto = texto.rsplit("</think>", 1)[1]
    if "<think>" in texto:  # raciocinio aberto e nunca fechado (resposta cortada)
        texto = texto.split("<think>", 1)[0]
    return texto.strip()


async def chat(
    messages: list[dict[str, str]],
    think: bool | None = None,
    options: dict | None = None,
) -> str:
    """Envia uma conversa completa (system + historico + pergunta) ao Ollama."""
    payload = {
        "model": settings.ai_model,
        "messages": messages,
        "think": settings.ai_think if think is None else think,
        "stream": False,
    }

    if options is not None:
        payload["options"] = options

    try:
        async with httpx.AsyncClient(
            timeout=settings.ai_timeout_seconds
        ) as client:
            response = await client.post(
                f"{settings.ollama_url.rstrip('/')}/api/chat",
                json=payload,
            )
            response.raise_for_status()

    except httpx.TimeoutException as exc:
        raise OllamaTimeout() from exc

    except httpx.HTTPError as exc:
        raise OllamaUnavailable(str(exc)) from exc

    try:
        body = response.json()
        content = body["message"]["content"]

        if not isinstance(content, str):
            raise ValueError("Conteúdo de resposta inválido.")

        answer = limpar_resposta(content)

        if not answer:
            raise ValueError("O modelo retornou uma resposta vazia.")

        if body.get("done_reason") == "length":
            answer += (
                "\n\nA resposta atingiu o limite de geração. "
                "Você pode pedir mais detalhes sobre um ponto específico."
            )

        return answer

    except (ValueError, KeyError, TypeError) as exc:
        raise OllamaUnavailable(
            "O Ollama retornou uma resposta inválida."
        ) from exc


async def ask(
    question: str,
    system_prompt: str | None = None,
    think: bool | None = None,
) -> str:
    messages = []

    if system_prompt:
        messages.append(
            {"role": "system", "content": system_prompt}
        )

    messages.append({"role": "user", "content": question})

    return await chat(messages, think=think)


async def embed(
    texts: list[str],
    model: str,
) -> list[list[float]]:
    try:
        async with httpx.AsyncClient(
            timeout=settings.ai_timeout_seconds
        ) as client:
            response = await client.post(
                f"{settings.ollama_url.rstrip('/')}/api/embed",
                json={
                    "model": model,
                    "input": texts,
                },
            )
            response.raise_for_status()

    except httpx.TimeoutException as exc:
        raise OllamaTimeout() from exc

    except httpx.HTTPError as exc:
        raise OllamaUnavailable(str(exc)) from exc

    try:
        embeddings = response.json()["embeddings"]

        if not isinstance(embeddings, list) or len(embeddings) != len(texts):
            raise ValueError("Quantidade de embeddings inválida.")

        return embeddings

    except (ValueError, KeyError, TypeError) as exc:
        raise OllamaUnavailable(
            "O Ollama retornou embeddings inválidos."
        ) from exc
