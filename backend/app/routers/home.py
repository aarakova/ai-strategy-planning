from fastapi import APIRouter, Depends

from ..database import get_db
from ..dependencies import get_context_for_user
from ..models.home import HomeResponse, KeyRisk, ResourceAnalysisItem, StrategicGoalItem, PlanPassport

router = APIRouter(prefix="/contexts", tags=["Home"])


@router.get("/{contextId}/home", response_model=HomeResponse)
async def get_home(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    context_id = str(ctx["_id"])

    plan = await db.strategic_plans.find_one({"contextId": context_id})
    goals = await db.strategic_goals.find({"contextId": context_id, "context": "USER_CREATED"}).to_list(length=100)
    analysis = await db.analysis_results.find_one({"contextId": context_id})

    plan_passport = None
    key_risks: list[KeyRisk] = []
    resource_analysis: list[ResourceAnalysisItem] = []

    if plan and plan.get("status") == "COMPLETED":
        pp = plan.get("plan_passport", {})
        plan_passport = PlanPassport(
            selected_variant=pp.get("selected_variant", ""),
            planning_horizon_months=pp.get("planning_horizon_months", 0),
            checkpoint_count=pp.get("checkpoint_count", 0),
            risk_count=pp.get("risk_count", 0),
            constraints_in_attention_count=pp.get("constraints_in_attention_count", 0),
            execution_progress=pp.get("execution_progress", 0),
        )
        key_risks = [
            KeyRisk(**r) for r in plan.get("plan_risks", [])
            if r.get("impact") in ("HIGH", "MEDIUM")
        ]

    if analysis and analysis.get("status") == "COMPLETED":
        resource_analysis = [ResourceAnalysisItem(**r) for r in analysis.get("resource_analysis", [])]

    strategic_goals = [
        StrategicGoalItem(id=str(g["_id"]), specific=g["specific"], priority=g["priority"])
        for g in goals
    ]

    return HomeResponse(
        portfolio_name=ctx["portfolio_name"],
        planning_stages_status=ctx.get("planning_stages_status", []),
        key_risks=key_risks,
        resource_analysis=resource_analysis,
        strategic_goals=strategic_goals,
        plan_passport=plan_passport,
    )
