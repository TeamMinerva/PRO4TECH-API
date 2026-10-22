from fastapi import APIRouter, HTTPException

from app import ollama_client
from app.schemas.similar_projects_schema import (
    SimilarProjectsRequest,
    SimilarProjectsResponse,
)
from app.services.similar_projects_service import (
    OriginEmbeddingsUnavailableError,
    ProjectNotIndexedError,
    buscar_projetos_semelhantes,
)

router = APIRouter()


@router.post("/projects/similar", response_model=SimilarProjectsResponse)
async def similar_projects(body: SimilarProjectsRequest):
    try:
        return await buscar_projetos_semelhantes(body)
    except ProjectNotIndexedError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except OriginEmbeddingsUnavailableError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except ollama_client.OllamaTimeout as exc:
        raise HTTPException(
            status_code=504,
            detail="O modelo demorou demais para gerar as justificativas.",
        ) from exc
    except ollama_client.OllamaUnavailable as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama indisponível: {exc}",
        ) from exc
