from fastapi import APIRouter, Depends, HTTPException, status

from ..database import get_db
from ..dependencies import get_context_for_user
from ..models.plan import PlanResponse

router = APIRouter(prefix="/contexts", tags=["Plan"])


@router.get("/{contextId}/plan", response_model=PlanResponse)
async def get_plan(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    doc = await db.strategic_plans.find_one({"contextId": str(ctx["_id"])})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="План ещё не сформирован")
    return PlanResponse(
        status=doc.get("status", "PENDING"),
        selected_scenario_type=doc.get("selected_scenario_type"),
        plan_passport=doc.get("plan_passport"),
        stages=doc.get("stages", []),
        resource_loading_by_stages=doc.get("resource_loading_by_stages", []),
        plan_risks=doc.get("plan_risks", []),
        constraints_in_attention=doc.get("constraints_in_attention", []),
    )
