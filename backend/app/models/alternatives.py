from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class AlternativeSelectRequest(BaseModel):
    scenario_ids: list[str] = Field(min_length=1)


class AlternativesResponse(BaseModel):
    status: Literal["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"]
    selected_scenario_id: Optional[str] = None
    scenarios: list[Any] = []
    comparison_matrix: list[Any] = []
