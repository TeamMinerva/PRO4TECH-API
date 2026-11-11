from pydantic import BaseModel, ConfigDict, Field

from app.schemas.project_chat_schema import ChatMessage, MessageText
from app.schemas.project_draft_schema import ProjectDraft


class DraftChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    draft: ProjectDraft
    question: MessageText
    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=20,
    )


class DraftChatResponse(BaseModel):
    answer: str


class DraftAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    draft: ProjectDraft
    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=20,
    )


class DraftAnalysisResponse(BaseModel):
    answer: str
