from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from ..database import get_db
from ..dependencies import get_current_user
from ..models.contexts import MultiprojectCreateRequest, MultiprojectListItem, PlanningStageStatus

router = APIRouter(prefix="/contexts", tags=["Multiprojects"])

_DEFAULT_STAGES = [
    {"stage_name": "Контекст", "status": "NOT_STARTED"},
    {"stage_name": "Анализ", "status": "NOT_STARTED"},
    {"stage_name": "Цели", "status": "NOT_STARTED"},
    {"stage_name": "Альтернативы", "status": "NOT_STARTED"},
    {"stage_name": "План", "status": "NOT_STARTED"},
]

_CHILD_COLLECTIONS = [
    "strategic_orientations", "projects", "project_dependencies",
    "portfolio_constraints", "analysis_results", "strategic_goals",
    "ai_goal_suggestions", "alternative_scenarios", "strategic_plans",
]


def _serialize(doc: dict) -> MultiprojectListItem:
    return MultiprojectListItem(
        id=str(doc["_id"]),
        portfolio_name=doc["portfolio_name"],
        planning_horizon=doc["planning_horizon"],
        planning_stages_status=[PlanningStageStatus(**s) for s in doc["planning_stages_status"]],
        created_at=doc["created_at"],
    )


@router.get("", response_model=list[MultiprojectListItem])
async def list_contexts(user_id: str = Depends(get_current_user)):
    db = get_db()
    docs = await db.planning_contexts.find({"userId": user_id}).to_list(length=100)
    return [_serialize(d) for d in docs]


@router.post("", status_code=status.HTTP_201_CREATED, response_model=MultiprojectListItem)
async def create_context(body: MultiprojectCreateRequest, user_id: str = Depends(get_current_user)):
    db = get_db()
    doc = {
        "userId": user_id,
        "portfolio_name": body.portfolio_name,
        "planning_horizon": body.planning_horizon.isoformat(),
        "planning_stages_status": _DEFAULT_STAGES,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.planning_contexts.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize(doc)


@router.delete("/{contextId}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_context(contextId: str, user_id: str = Depends(get_current_user)):
    db = get_db()
    try:
        oid = ObjectId(contextId)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Мультипроект не найден")
    result = await db.planning_contexts.delete_one({"_id": oid, "userId": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Мультипроект не найден")
    for col in _CHILD_COLLECTIONS:
        await db[col].delete_many({"contextId": contextId})
