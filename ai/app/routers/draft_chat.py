import logging

from fastapi import APIRouter, HTTPException

from app import ollama_client
from app.schemas.draft_chat_schema import (
    DraftAnalysisRequest,
    DraftAnalysisResponse,
    DraftChatRequest,
    DraftChatResponse,
)
from app.services.draft_chat_service import draft_chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat/project-draft", tags=["Draft Chat"])


@router.post("", response_model=DraftChatResponse)
async def chat_project_draft(request: DraftChatRequest) -> DraftChatResponse:
    try:
        answer = await draft_chat_service.responder(request)
    except ollama_client.OllamaTimeout:
        raise HTTPException(
            status_code=504, detail="O modelo demorou demais para responder."
        )
    except ollama_client.OllamaUnavailable as exc:
        raise HTTPException(status_code=503, detail=f"Ollama indisponivel: {exc}")
    except Exception:
        logger.exception("Erro ao processar chat do rascunho de projeto")
        raise HTTPException(
            status_code=500,
            detail="Não foi possível processar a pergunta sobre o rascunho.",
        )

    return DraftChatResponse(answer=answer)


@router.post("/analyze", response_model=DraftAnalysisResponse)
async def analyze_project_draft(
    request: DraftAnalysisRequest,
) -> DraftAnalysisResponse:
    try:
        answer = await draft_chat_service.analisar(request)
    except ollama_client.OllamaTimeout:
        raise HTTPException(
            status_code=504, detail="O modelo demorou demais para responder."
        )
    except ollama_client.OllamaUnavailable as exc:
        raise HTTPException(status_code=503, detail=f"Ollama indisponivel: {exc}")
    except Exception:
        logger.exception("Erro ao analisar rascunho de projeto")
        raise HTTPException(
            status_code=500,
            detail="Não foi possível analisar o rascunho do projeto.",
        )

    return DraftAnalysisResponse(answer=answer)
