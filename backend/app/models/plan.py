from typing import Any, Literal, Optional

from pydantic import BaseModel


class PlanPassport(BaseModel):
    selected_variant: str
    planning_horizon_months: int
    checkpoint_count: int
    risk_count: int
    constraints_in_attention_count: int
    execution_progress: int


class PlanRisk(BaseModel):
    risk: str
    impact: Literal["Низкий", "Средний", "Высокий"]


class ConstraintInAttention(BaseModel):
    constraint: str
    actual_value: str
    impact: str


class PlanResponse(BaseModel):
    status: Literal["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"]
    selected_scenario_type: Optional[Literal["BALANCED", "CONSERVATIVE", "RISKY"]] = None
    plan_passport: Optional[PlanPassport] = None
    stages: list[Any] = []
    resource_loading_by_stages: list[Any] = []
    plan_risks: list[PlanRisk] = []
    constraints_in_attention: list[ConstraintInAttention] = []
