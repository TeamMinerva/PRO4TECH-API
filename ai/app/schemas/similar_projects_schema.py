from pydantic import BaseModel, ConfigDict, Field
from typing_extensions import Annotated


ProjectId = Annotated[int, Field(gt=0)]


class SimilarProjectsRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    project_id: ProjectId
    candidate_project_ids: list[ProjectId]
    limit: int = Field(default=5, ge=1, le=20)


class SimilarProjectEvidence(BaseModel):
    text: str
    source_text: str


class SimilarProjectResult(BaseModel):
    project_id: int
    similarity: float = Field(
        ge=0,
        le=1,
        description=(
            "Média dos até três maiores cossenos entre chunks dos projetos, "
            "limitados ao intervalo [0, 1]; não representa uma probabilidade."
        ),
    )
    justification: str
    evidence: list[SimilarProjectEvidence]


class SimilarProjectsResponse(BaseModel):
    project_id: int
    similar_projects: list[SimilarProjectResult]
    unavailable_project_ids: list[int]
