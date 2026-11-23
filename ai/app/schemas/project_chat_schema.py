
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict, StringConstraints
from typing_extensions import Annotated


ProjectId = Annotated[int, Field(gt=0)]
MessageText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=8000),
]


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    content: MessageText


class ProjectChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    project_id: ProjectId
    question: MessageText
    history: list[ChatMessage] = Field(
        default_factory=list,
        max_length=20,
    )


class ProjectChatResponse(BaseModel):
    project_id: int
    answer: str
