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


async def chat(messages: list[dict[str, str]], think: bool | None = None) -> str:
    """Envia uma conversa completa (system + historico + pergunta) ao Ollama."""
    payload = {
        "model": settings.ai_model,
        "messages": messages,
        "think": settings.ai_think if think is None else think,
        "stream": False,
    }
    try:
        async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
            response = await client.post(f"{settings.ollama_url}/api/chat", json=payload)
            response.raise_for_status()
    except httpx.TimeoutException as exc:
        raise OllamaTimeout() from exc
    except httpx.HTTPError as exc:
        raise OllamaUnavailable(str(exc)) from exc

    content = response.json()["message"]["content"]
    # Com think=true o Ollama separa o raciocinio em message.thinking; isto cobre
    # os modelos que ainda o devolvem inline no content.
    return limpar_resposta(content)


async def ask(
    question: str,
    system_prompt: str | None = None,
    think: bool | None = None,
) -> str:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": question})
    return await chat(messages, think=think)


async def embed(texts: list[str], model: str) -> list[list[float]]:
    try:
        async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
            response = await client.post(
                f"{settings.ollama_url}/api/embed",
                json={"model": model, "input": texts},
            )
            response.raise_for_status()
    except httpx.TimeoutException as exc:
        raise OllamaTimeout() from exc
    except httpx.HTTPError as exc:
        raise OllamaUnavailable(str(exc)) from exc

    return response.json()["embeddings"]
