from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.project_chat_schema import ChatMessage, MessageText


class ContextSource(BaseModel):
    id: str
    type: Literal["project", "developer", "document"] = "document"
    entity_id: int | None = None
    title: str


class GeneralChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: MessageText
    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=20,
    )


class GeneralChatResponse(BaseModel):
    answer: str
    sources: list[ContextSource] = Field(default_factory=list)
