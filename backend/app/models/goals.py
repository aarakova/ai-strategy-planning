from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel


class GoalItem(BaseModel):
    specific: str
    kpi_name: str
    kpi_target_value: float
    kpi_unit: str
    achievable: str
    timebound: date
    priority: Literal["Высокий", "Средний", "Низкий"]
    orientation_ids: list[str] = []
    project_names: list[str] = []
    orientation_explanation: Optional[str] = None


class ProjectCoverage(BaseModel):
    degree: Literal["Слабое", "Умеренное", "Сильное"]
    explanation: str


class RealismCheck(BaseModel):
    degree: Literal["Низкая", "Средняя", "Высокая"]
    score: int
    issues: list[str] = []


class GoalResponseItem(GoalItem):
    id: str
    context: Literal["USER_CREATED", "AI_SUGGESTED"]
    ai_explanation: Optional[str] = None
    project_coverage: Optional[ProjectCoverage] = None
    realism_check: Optional[RealismCheck] = None


class GoalsSubmitRequest(BaseModel):
    goals: list[GoalItem]


class GoalsResponse(BaseModel):
    goals: list[GoalResponseItem]


class GoalSuggestionsResponse(BaseModel):
    ai_suggestions: list[GoalResponseItem]
