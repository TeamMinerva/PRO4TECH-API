import logging

from fastapi import APIRouter, HTTPException

from app import ollama_client
from app.schemas.developer_chat_schema import (
    DeveloperChatRequest,
    DeveloperChatResponse,
)
from app.services.developer_chat_service import developer_chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat/developer", tags=["Developer Chat"])


@router.post("", response_model=DeveloperChatResponse)
async def chat_developer(request: DeveloperChatRequest) -> DeveloperChatResponse:
    try:
        answer = await developer_chat_service.responder(request)
    except ollama_client.OllamaTimeout:
        raise HTTPException(
            status_code=504,
            detail="O modelo demorou demais para responder.",
        )
    except ollama_client.OllamaUnavailable as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama indisponivel: {exc}",
        )
    except Exception:
        logger.exception(
            "Erro ao processar chat do desenvolvedor %s", request.developer_id
        )
        raise HTTPException(
            status_code=500,
            detail="Não foi possível processar a pergunta sobre o desenvolvedor.",
        )

    return DeveloperChatResponse(
        developer_id=request.developer_id,
        answer=answer,
    )
