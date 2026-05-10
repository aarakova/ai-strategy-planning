from typing import Any, Literal, Optional

from pydantic import BaseModel


class AnalysisRiskItem(BaseModel):
    risk: str
    impact: Literal["Низкий", "Средний", "Высокий"]
    source: str


class ResourceAnalysis(BaseModel):
    role: Literal["Аналитики", "Разработчики", "Тестировщики"]
    required: int
    limit: int
    delta: int


class DeviationAnalysis(BaseModel):
    project_name: str
    deviation: str
    portfolio_danger: Literal["Низкая", "Средняя", "Высокая"]
    dependency_propagation: str


class AiRecommendation(BaseModel):
    title: str
    text: str
    basis: str


class AnalysisResponse(BaseModel):
    status: Literal["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"]
    dependency_graph: Optional[dict[str, Any]] = None
    analysis_risks: list[AnalysisRiskItem] = []
    timeline_analysis: Optional[dict[str, Any]] = None
    resource_analysis: list[ResourceAnalysis] = []
    deviation_analysis: list[DeviationAnalysis] = []
    ai_explanation: Optional[str] = None
    ai_recommendations: list[AiRecommendation] = []
