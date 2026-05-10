from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field


class Workload(BaseModel):
    analysts: int = Field(ge=1)
    developers: int = Field(ge=1)
    testers: int = Field(ge=1)


class ProjectItem(BaseModel):
    name: str
    status: Literal["Завершено", "В работе", "Не начато"]
    start_date: date
    end_date: date
    workload: Workload
    constraints: Optional[str] = None
    deviations: Optional[str] = None
    description: Optional[str] = None


class OrientationItem(BaseModel):
    vision: str
    priority: Literal["Высокий", "Средний", "Низкий"]


class DependencyItem(BaseModel):
    main_project_name: str
    dependent_project_name: str


class PortfolioConstraints(BaseModel):
    analysts_limit: int = Field(ge=0)
    developers_limit: int = Field(ge=0)
    testers_limit: int = Field(ge=0)
    critical_deadline: date


class ContextSubmitRequest(BaseModel):
    orientations: list[OrientationItem] = Field(min_length=1)
    projects: list[ProjectItem] = Field(min_length=1)
    dependencies: list[DependencyItem] = []
    portfolio_constraints: PortfolioConstraints
