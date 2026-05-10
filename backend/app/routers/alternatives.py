from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from ..database import get_db
from ..dependencies import get_context_for_user
from ..models.alternatives import AlternativeSelectRequest, AlternativesResponse

router = APIRouter(prefix="/contexts", tags=["Alternatives"])


async def _run_plan_generation(context_id: str, scenario_ids: list[str]) -> None:
    """Background task: generate strategic plan; replace with GigaChat call."""
    db = get_db()
    await db.strategic_plans.update_one(
        {"contextId": context_id},
        {"$set": {"status": "IN_PROGRESS", "contextId": context_id, "selected_scenario_ids": scenario_ids}},
        upsert=True,
    )
    # TODO: call GigaChat API, build plan, update document with status=COMPLETED


@router.get("/{contextId}/alternatives", response_model=AlternativesResponse)
async def get_alternatives(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    doc = await db.alternative_scenarios.find_one({"contextId": str(ctx["_id"])})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Альтернативы ещё не сформированы")
    return AlternativesResponse(
        status=doc.get("status", "PENDING"),
        selected_scenario_id=doc.get("selected_scenario_id"),
        scenarios=doc.get("scenarios", []),
        comparison_matrix=doc.get("comparison_matrix", []),
    )


@router.post("/{contextId}/alternatives", status_code=status.HTTP_202_ACCEPTED)
async def select_alternatives(
    body: AlternativeSelectRequest,
    background_tasks: BackgroundTasks,
    ctx: dict = Depends(get_context_for_user),
):
    db = get_db()
    context_id = str(ctx["_id"])

    doc = await db.alternative_scenarios.find_one({"contextId": context_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Сценарий не найден")

    await db.alternative_scenarios.update_one(
        {"contextId": context_id},
        {"$set": {"selected_scenario_ids": body.scenario_ids}},
    )
    await db.planning_contexts.update_one(
        {"_id": ctx["_id"]},
        {"$set": {"planning_stages_status.$[el].status": "COMPLETED"}},
        array_filters=[{"el.stage_name": "Альтернативы"}],
    )

    background_tasks.add_task(_run_plan_generation, context_id, body.scenario_ids)
    return {"detail": "Сценарий выбран, формирование плана запущено"}
