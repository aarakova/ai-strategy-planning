from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel


class PlanningStageStatus(BaseModel):
    stage_name: Literal["Контекст", "Анализ", "Цели", "Альтернативы", "План"]
    status: Literal["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]


class MultiprojectCreateRequest(BaseModel):
    portfolio_name: str
    planning_horizon: date


class MultiprojectListItem(BaseModel):
    id: str
    portfolio_name: str
    planning_horizon: date
    planning_stages_status: list[PlanningStageStatus]
    created_at: datetime
