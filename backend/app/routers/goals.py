from fastapi import APIRouter, Depends, HTTPException, status

from ..database import get_db
from ..dependencies import get_context_for_user
from ..models.goals import (
    GoalResponseItem,
    GoalSuggestionsResponse,
    GoalsResponse,
    GoalsSubmitRequest,
)

router = APIRouter(prefix="/contexts", tags=["Goals"])


def _doc_to_goal(doc: dict) -> GoalResponseItem:
    return GoalResponseItem(
        id=str(doc["_id"]),
        specific=doc["specific"],
        kpi_name=doc["kpi_name"],
        kpi_target_value=doc["kpi_target_value"],
        kpi_unit=doc["kpi_unit"],
        achievable=doc["achievable"],
        timebound=doc["timebound"],
        priority=doc["priority"],
        orientation_ids=doc.get("orientation_ids", []),
        project_names=doc.get("project_names", []),
        orientation_explanation=doc.get("orientation_explanation"),
        context=doc.get("context", "USER_CREATED"),
        ai_explanation=doc.get("ai_explanation"),
        project_coverage=doc.get("project_coverage"),
        realism_check=doc.get("realism_check"),
    )


@router.get("/{contextId}/goals", response_model=GoalsResponse)
async def get_goals(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    docs = await db.strategic_goals.find(
        {"contextId": str(ctx["_id"]), "context": "USER_CREATED"}
    ).to_list(length=200)
    return GoalsResponse(goals=[_doc_to_goal(d) for d in docs])


@router.post("/{contextId}/goals", response_model=GoalsResponse)
async def submit_goals(body: GoalsSubmitRequest, ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    context_id = str(ctx["_id"])

    await db.strategic_goals.delete_many({"contextId": context_id, "context": "USER_CREATED"})

    docs = [g.model_dump(mode="json") | {"contextId": context_id, "context": "USER_CREATED"} for g in body.goals]
    inserted = []
    if docs:
        result = await db.strategic_goals.insert_many(docs)
        inserted = await db.strategic_goals.find({"_id": {"$in": result.inserted_ids}}).to_list(length=200)

    await db.planning_contexts.update_one(
        {"_id": ctx["_id"]},
        {"$set": {"planning_stages_status.$[el].status": "COMPLETED"}},
        array_filters=[{"el.stage_name": "Цели"}],
    )
    return GoalsResponse(goals=[_doc_to_goal(d) for d in inserted])


@router.get("/{contextId}/goals/suggestions", response_model=GoalSuggestionsResponse)
async def get_goal_suggestions(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    docs = await db.ai_goal_suggestions.find({"contextId": str(ctx["_id"])}).to_list(length=100)
    if not docs:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Предложения ещё не сформированы")
    return GoalSuggestionsResponse(ai_suggestions=[_doc_to_goal(d) for d in docs])
