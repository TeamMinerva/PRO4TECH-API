from fastapi import APIRouter, HTTPException, Request, Response

from app import ollama_client
from app.cancelamento import (
    RequisicaoCanceladaPeloCliente,
    executar_ate_desconectar,
)
from app.schemas.similar_projects_schema import (
    SimilarProjectsRequest,
    SimilarProjectsResponse,
)
from app.services.similar_projects_service import (
    OriginEmbeddingsUnavailableError,
    ProjectNotIndexedError,
    VectorLookupTimeoutError,
    VectorStorageError,
    buscar_projetos_semelhantes,
)

router = APIRouter()


@router.post("/projects/similar", response_model=SimilarProjectsResponse)
async def similar_projects(body: SimilarProjectsRequest, http_request: Request):
    try:
        return await executar_ate_desconectar(
            http_request,
            buscar_projetos_semelhantes(body),
        )
    except RequisicaoCanceladaPeloCliente:
        return Response(status_code=499)
    except ProjectNotIndexedError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except OriginEmbeddingsUnavailableError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except VectorLookupTimeoutError as exc:
        raise HTTPException(
            status_code=504,
            detail="O armazenamento de embeddings demorou demais para responder.",
        ) from exc
    except VectorStorageError as exc:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível consultar o armazenamento de embeddings.",
        ) from exc
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
