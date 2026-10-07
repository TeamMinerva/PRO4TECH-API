import httpx

from app.config import settings


class OllamaUnavailable(Exception):
    pass


class OllamaTimeout(Exception):
    pass


async def ask(question: str) -> str:
    payload = {
        "model": settings.ai_model,
        "messages": [{"role": "user", "content": question}],
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

    # Com think=true o raciocinio vem em message.thinking; a resposta final fica em message.content.
    return response.json()["message"]["content"]
