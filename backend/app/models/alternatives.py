from typing import Any, Literal, Optional

from pydantic import BaseModel


class AlternativeSelectRequest(BaseModel):
    scenario_id: str


class AlternativesResponse(BaseModel):
    status: Literal["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "FAILED"]
    selected_scenario_id: Optional[str] = None
    scenarios: list[Any] = []
    error: Optional[str] = None
