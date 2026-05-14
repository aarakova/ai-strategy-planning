import json

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, status

from .. import llm
from ..database import get_db
from ..dependencies import get_context_for_user
from ..models.context import ContextSubmitRequest

router = APIRouter(prefix="/contexts", tags=["Context"])

_SYSTEM_PROMPT = """Ты — эксперт по стратегическому портфельному планированию проектов.
Твоя задача — проанализировать портфель проектов и дать структурированную оценку его реализуемости.

Верни ответ ТОЛЬКО в формате JSON без пояснений, точно по следующей схеме:
{
  "risks": [
    { "text": "краткое описание риска", "level": "high|medium|low", "impact": "Высокий|Средний|Низкий" }
  ],
  "scheduleAnalysis": [
    "пункт анализа сроков 1",
    "пункт анализа сроков 2"
  ],
  "resourceAnalysis": [
    { "role": "название роли", "demand": "XXX ч", "limit": "XXX ч", "balance": "Профицит XXX ч | Дефицит XXX ч", "status": "ok|warning|critical" }
  ],
  "deviationAnalysis": [
    { "project": "название проекта", "deviation": "описание отклонения или статуса", "danger": "Высокая|Средняя|Низкая", "transfer": "каскадный эффект на другие проекты" }
  ],
  "aiExplanation": "общий вывод об исполнимости портфеля (3-4 предложения)",
  "recommendations": [
    { "title": "заголовок рекомендации", "text": "подробное описание действия и его обоснования" }
  ]
}

Правила:
- level: "high" если риск критичен, "medium" — умеренный, "low" — низкий
- status ресурсов: "ok" если demand < limit, "warning" если demand близок к limit (≥80%), "critical" если demand > limit
- balance: "Профицит X ч" если limit > demand, "Дефицит X ч" если demand > limit
- Укажи минимум 2 риска, 2–4 пункта scheduleAnalysis, все роли из ограничений, все проекты в deviationAnalysis, минимум 2 рекомендации
- Все тексты на русском языке"""


def _clean(doc: dict) -> dict:
    """Remove MongoDB internal fields before serializing."""
    return {k: v for k, v in doc.items() if k not in ("_id", "contextId")}


def _build_user_message(ctx: dict, orientations: list, projects: list, dependencies: list, constraints: dict | None) -> str:
    return (
        f"Проанализируй следующий портфель проектов:\n\n"
        f"Название портфеля: {ctx.get('portfolio_name', '')}\n"
        f"Горизонт планирования: {ctx.get('planning_horizon', '')}\n\n"
        f"Стратегические ориентиры:\n{json.dumps([_clean(o) for o in orientations], ensure_ascii=False, indent=2)}\n\n"
        f"Проекты портфеля:\n{json.dumps([_clean(p) for p in projects], ensure_ascii=False, indent=2)}\n\n"
        f"Зависимости между проектами:\n{json.dumps([_clean(d) for d in dependencies], ensure_ascii=False, indent=2)}\n\n"
        f"Ресурсные ограничения:\n{json.dumps(_clean(constraints) if constraints else {}, ensure_ascii=False, indent=2)}\n\n"
        "Определи риски, оцени реализуемость по срокам и ресурсам, выяви отклонения и дай рекомендации."
    )


async def _run_analysis(context_id: str) -> None:
    db = get_db()

    await db.analysis_results.update_one(
        {"contextId": context_id},
        {"$set": {"status": "IN_PROGRESS", "contextId": context_id}},
        upsert=True,
    )

    try:
        ctx = await db.planning_contexts.find_one({"_id": ObjectId(context_id)})
        orientations = await db.strategic_orientations.find({"contextId": context_id}).to_list(100)
        projects = await db.projects.find({"contextId": context_id}).to_list(100)
        dependencies = await db.project_dependencies.find({"contextId": context_id}).to_list(100)
        constraints = await db.portfolio_constraints.find_one({"contextId": context_id})

        result = await llm.chat_json([
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_message(ctx, orientations, projects, dependencies, constraints)},
        ])

        await db.analysis_results.update_one(
            {"contextId": context_id},
            {"$set": {"status": "COMPLETED", "error": None, **result}},
        )
        await db.planning_contexts.update_one(
            {"_id": ObjectId(context_id)},
            {"$set": {"planning_stages_status.$[el].status": "COMPLETED"}},
            array_filters=[{"el.stage_name": "Анализ"}],
        )
    except Exception as e:
        await db.analysis_results.update_one(
            {"contextId": context_id},
            {"$set": {"status": "FAILED", "error": str(e)}},
        )


@router.get("/{contextId}/context")
async def get_context(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    context_id = str(ctx["_id"])

    orientations = await db.strategic_orientations.find({"contextId": context_id}).to_list(100)
    projects = await db.projects.find({"contextId": context_id}).to_list(100)
    dependencies = await db.project_dependencies.find({"contextId": context_id}).to_list(100)
    constraints = await db.portfolio_constraints.find_one({"contextId": context_id})

    return {
        "orientations": [_clean(o) for o in orientations],
        "projects": [_clean(p) for p in projects],
        "dependencies": [_clean(d) for d in dependencies],
        "portfolio_constraints": _clean(constraints) if constraints else None,
    }


@router.post("/{contextId}/context", status_code=status.HTTP_202_ACCEPTED)
async def submit_context(
    body: ContextSubmitRequest,
    background_tasks: BackgroundTasks,
    ctx: dict = Depends(get_context_for_user),
):
    db = get_db()
    context_id = str(ctx["_id"])

    await db.strategic_orientations.delete_many({"contextId": context_id})
    await db.projects.delete_many({"contextId": context_id})
    await db.project_dependencies.delete_many({"contextId": context_id})
    await db.portfolio_constraints.delete_many({"contextId": context_id})

    orientations = [o.model_dump(mode="json") | {"contextId": context_id} for o in body.orientations]
    if orientations:
        await db.strategic_orientations.insert_many(orientations)

    projects = [p.model_dump(mode="json") | {"contextId": context_id} for p in body.projects]
    if projects:
        await db.projects.insert_many(projects)

    dependencies = [d.model_dump(mode="json") | {"contextId": context_id} for d in body.dependencies]
    if dependencies:
        await db.project_dependencies.insert_many(dependencies)

    await db.portfolio_constraints.insert_one(
        body.portfolio_constraints.model_dump(mode="json") | {"contextId": context_id}
    )

    await db.planning_contexts.update_one(
        {"_id": ctx["_id"]},
        {"$set": {"planning_stages_status.$[el].status": "COMPLETED"}},
        array_filters=[{"el.stage_name": "Контекст"}],
    )

    background_tasks.add_task(_run_analysis, context_id)
    return {"detail": "Контекст принят, анализ запущен"}
