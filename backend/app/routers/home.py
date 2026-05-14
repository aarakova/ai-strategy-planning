from fastapi import APIRouter, Depends

from ..database import get_db
from ..dependencies import get_context_for_user

router = APIRouter(prefix="/contexts", tags=["Home"])


@router.get("/{contextId}/home")
async def get_home(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    context_id = str(ctx["_id"])

    analysis = await db.analysis_results.find_one({"contextId": context_id})
    plan = await db.strategic_plans.find_one({"contextId": context_id})
    goal_docs = await db.strategic_goals.find(
        {"contextId": context_id, "context": "USER_CREATED"}
    ).to_list(length=50)

    key_risks = analysis.get("risks", []) if analysis else []
    resource_analysis = analysis.get("resourceAnalysis", []) if analysis else []

    strategic_goals = [
        {
            "id": str(d["_id"]),
            "specific": d.get("specific", ""),
            "priority": d.get("priority", ""),
        }
        for d in goal_docs
    ]

    plan_passport = plan.get("plan_passport") if plan else None

    return {
        "portfolio_name": ctx["portfolio_name"],
        "planning_stages_status": ctx.get("planning_stages_status", []),
        "key_risks": key_risks,
        "resource_analysis": resource_analysis,
        "strategic_goals": strategic_goals,
        "plan_passport": plan_passport,
    }
