import logging

from fastapi import APIRouter, HTTPException

from app import ollama_client
from app.schemas.project_chat_schema import ProjectChatRequest, ProjectChatResponse
from app.services.project_chat_service import project_chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat/project", tags=["Project Chat"])


@router.post("", response_model=ProjectChatResponse)
async def chat_project(request: ProjectChatRequest) -> ProjectChatResponse:
    try:
        answer = await project_chat_service.responder(request)
    except ollama_client.OllamaTimeout:
        raise HTTPException(status_code=504, detail="O modelo demorou demais para responder.")
    except ollama_client.OllamaUnavailable as exc:
        raise HTTPException(status_code=503, detail=f"Ollama indisponivel: {exc}")
    except Exception:
        logger.exception("Erro ao processar chat do projeto %s", request.project_id)
        raise HTTPException(
            status_code=500,
            detail="Não foi possível processar a pergunta sobre o projeto.",
        )

    return ProjectChatResponse(project_id=request.project_id, answer=answer)
