from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from pydantic.alias_generators import to_camel

DraftText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, max_length=4000),
]
ShortText = Annotated[
    str,
    StringConstraints(strip_whitespace=True, max_length=200),
]


class _DraftModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        alias_generator=to_camel,
        populate_by_name=True,
    )


class DraftPbi(_DraftModel):
    title: DraftText = ""
    user_story: DraftText = ""
    acceptance_criteria: DraftText = ""
    developers: list[ShortText] = Field(default_factory=list, max_length=30)


class DraftFeature(_DraftModel):
    name: DraftText = ""
    description: DraftText = ""
    approval_criteria: DraftText = ""
    pbis: list[DraftPbi] = Field(default_factory=list, max_length=50)


class DraftEpic(_DraftModel):
    name: DraftText = ""
    description: DraftText = ""
    objective: DraftText = ""
    expected_result: DraftText = ""
    features: list[DraftFeature] = Field(default_factory=list, max_length=30)


class ProjectDraft(_DraftModel):
    name: DraftText = ""
    status: ShortText = ""
    technologies: list[ShortText] = Field(default_factory=list, max_length=50)
    epics: list[DraftEpic] = Field(default_factory=list, max_length=30)
