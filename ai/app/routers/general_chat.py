import logging

from fastapi import APIRouter, HTTPException, Request, Response

from app import ollama_client
from app.cancelamento import (
    RequisicaoCanceladaPeloCliente,
    executar_ate_desconectar,
)
from app.schemas.general_chat_schema import GeneralChatRequest, GeneralChatResponse
from app.services.general_chat_service import general_chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["General Chat"])


@router.post("/general", response_model=GeneralChatResponse)
@router.post("", response_model=GeneralChatResponse)
async def chat_general(
    request: GeneralChatRequest,
    http_request: Request,
) -> GeneralChatResponse | Response:
    try:
        return await executar_ate_desconectar(
            http_request,
            general_chat_service.responder(request),
        )
    except RequisicaoCanceladaPeloCliente:
        return Response(status_code=499)
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
        logger.exception("Erro ao processar chat geral")
        raise HTTPException(
            status_code=500,
            detail="Não foi possível processar a pergunta na base de conhecimento.",
        )
