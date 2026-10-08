import httpx

from app.config import settings


class OllamaUnavailable(Exception):
    pass


class OllamaTimeout(Exception):
    pass


async def ask(question: str, system_prompt: str | None = None) -> str:
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": question})

    payload = {
        "model": settings.ai_model,
        "messages": messages,
        "think": settings.ai_think,
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

    return response.json()["message"]["content"]


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
