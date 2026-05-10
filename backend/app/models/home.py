from typing import Literal, Optional

from pydantic import BaseModel

from .contexts import PlanningStageStatus


class KeyRisk(BaseModel):
    risk: str
    impact: Literal["LOW", "MEDIUM", "HIGH"]


class ResourceAnalysisItem(BaseModel):
    role: Literal["Аналитики", "Разработчики", "Тестировщики"]
    required: int
    limit: int
    delta: int


class StrategicGoalItem(BaseModel):
    id: str
    specific: str
    priority: Literal["HIGH", "MEDIUM", "LOW"]


class PlanPassport(BaseModel):
    selected_variant: str
    planning_horizon_months: int
    checkpoint_count: int
    risk_count: int
    constraints_in_attention_count: int
    execution_progress: int


class HomeResponse(BaseModel):
    portfolio_name: str
    planning_stages_status: list[PlanningStageStatus]
    key_risks: list[KeyRisk]
    resource_analysis: list[ResourceAnalysisItem]
    strategic_goals: list[StrategicGoalItem]
    plan_passport: Optional[PlanPassport] = None
