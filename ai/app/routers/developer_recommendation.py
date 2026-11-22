import logging

from fastapi import APIRouter, HTTPException, Request, Response

from app import ollama_client
from app.cancelamento import (
    RequisicaoCanceladaPeloCliente,
    executar_ate_desconectar,
)
from app.schemas.developer_recommendation_schema import (
    DeveloperRecommendationRequest,
    DeveloperRecommendationResponse,
)
from app.services.developer_recommendation_service import recomendar_desenvolvedores

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Developer Recommendation"])


@router.post("/developers/recommend", response_model=DeveloperRecommendationResponse)
async def recommend_developers(
    body: DeveloperRecommendationRequest,
    http_request: Request,
):
    try:
        return await executar_ate_desconectar(
            http_request,
            recomendar_desenvolvedores(body),
        )
    except RequisicaoCanceladaPeloCliente:
        return Response(status_code=499)
    except ollama_client.OllamaTimeout as exc:
        raise HTTPException(
            status_code=504,
            detail="O modelo demorou demais para responder.",
        ) from exc
    except ollama_client.OllamaUnavailable as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Ollama indisponível: {exc}",
        ) from exc
    except TimeoutError as exc:
        raise HTTPException(
            status_code=504,
            detail="O armazenamento de embeddings demorou demais para responder.",
        ) from exc
    except Exception as exc:
        logger.exception("Erro ao recomendar desenvolvedores para o PBI %s", body.pbi_id)
        raise HTTPException(
            status_code=500,
            detail="Não foi possível gerar a recomendação de desenvolvedores.",
        ) from exc
