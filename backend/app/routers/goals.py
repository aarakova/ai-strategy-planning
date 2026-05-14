from fastapi import APIRouter, Depends

from ..database import get_db
from ..dependencies import get_context_for_user
from ..models.goals import GoalsSubmitRequest

router = APIRouter(prefix="/contexts", tags=["Goals"])

_MOCK_SUGGESTIONS = [
    {
        "id": "ai-s1",
        "specific": "Увеличить долю цифровых продаж до 60% к Q4 2026",
        "kpi_name": "Доля цифровых продаж",
        "kpi_target_value": 60,
        "kpi_unit": "%",
        "achievable": "За счёт внедрения новых онлайн-каналов и автоматизации продаж",
        "timebound": "2026-12-31",
        "priority": "Высокий",
        "orientation_ids": [],
        "project_names": ["Модуль авторизации", "Платёжная система"],
        "orientation_explanation": "Напрямую связана с ориентиром цифровой трансформации",
        "context": "AI_SUGGESTED",
        "ai_explanation": "На основе анализа портфеля цель достижима при оптимизации команды разработки.",
        "project_coverage": {"degree": "Сильное", "explanation": "Охватывает 2 из 3 ключевых проектов"},
        "realism_check": {"degree": "Высокая", "score": 82, "issues": []},
    },
    {
        "id": "ai-s2",
        "specific": "Сократить время вывода нового продукта на рынок до 6 месяцев",
        "kpi_name": "Time-to-market",
        "kpi_target_value": 6,
        "kpi_unit": "месяцев",
        "achievable": "За счёт внедрения Agile-практик и CI/CD",
        "timebound": "2026-09-30",
        "priority": "Средний",
        "orientation_ids": [],
        "project_names": ["Аналитический модуль"],
        "orientation_explanation": "Поддерживает ориентир операционной эффективности",
        "context": "AI_SUGGESTED",
        "ai_explanation": "Текущий средний цикл — 10 месяцев. Сокращение до 6 требует структурных изменений.",
        "project_coverage": {"degree": "Умеренное", "explanation": "Охватывает 1 из 3 проектов"},
        "realism_check": {"degree": "Средняя", "score": 65, "issues": ["Требует дополнительных ресурсов на DevOps"]},
    },
]


def _doc_to_dict(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "specific": doc["specific"],
        "kpi_name": doc["kpi_name"],
        "kpi_target_value": doc["kpi_target_value"],
        "kpi_unit": doc["kpi_unit"],
        "achievable": doc["achievable"],
        "timebound": str(doc["timebound"]),
        "priority": doc["priority"],
        "orientation_ids": doc.get("orientation_ids", []),
        "project_names": doc.get("project_names", []),
        "orientation_explanation": doc.get("orientation_explanation"),
        "context": doc.get("context", "USER_CREATED"),
        "ai_explanation": doc.get("ai_explanation"),
        "project_coverage": doc.get("project_coverage"),
        "realism_check": doc.get("realism_check"),
    }


@router.get("/{contextId}/goals")
async def get_goals(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    docs = await db.strategic_goals.find(
        {"contextId": str(ctx["_id"]), "context": "USER_CREATED"}
    ).to_list(length=200)
    return {"goals": [_doc_to_dict(d) for d in docs]}


@router.post("/{contextId}/goals")
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
    return {"goals": [_doc_to_dict(d) for d in inserted]}


@router.get("/{contextId}/goals/suggestions")
async def get_goal_suggestions(ctx: dict = Depends(get_context_for_user)):
    return {"ai_suggestions": _MOCK_SUGGESTIONS}
