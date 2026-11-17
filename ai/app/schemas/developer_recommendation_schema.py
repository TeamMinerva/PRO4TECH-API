from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from typing_extensions import Annotated

Text = Annotated[str, StringConstraints(strip_whitespace=True, max_length=8000)]


class DeveloperRecommendationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    pbi_id: int | None = Field(default=None, gt=0)
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]
    user_story: Text = ""
    acceptance_criteria: Text = ""
    limit: int = Field(default=3, ge=1, le=10)
    inactive_developer_ids: list[int] = Field(default_factory=list, max_length=1000)


class RecommendedDeveloper(BaseModel):
    developer_id: int
    name: str
    score: float = Field(
        ge=0,
        le=1,
        description="Média dos até três maiores cossenos entre o PBI e os trechos do desenvolvedor; não é probabilidade.",
    )
    justification: str
    evidence: list[str]


class DeveloperRecommendationResponse(BaseModel):
    pbi_id: int | None
    developers: list[RecommendedDeveloper]
    message: str
    automatic_assignment: bool = False
