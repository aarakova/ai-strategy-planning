import json

from bson import ObjectId
from fastapi import APIRouter, Depends

from .. import llm
from ..database import get_db
from ..dependencies import get_context_for_user

router = APIRouter(prefix="/contexts", tags=["Plan"])

_PLAN_SYSTEM_PROMPT = """\
Ты — эксперт по стратегическому планированию портфеля проектов.
На основе выбранного сценария сформируй детальный план реализации.

ВАЖНО: верни ТОЛЬКО JSON-объект — никаких пояснений, markdown или лишнего текста.

{"plan":{"plan_passport":{"selected_variant":"<название сценария>","planning_horizon_months":8,"checkpoint_count":4,"risk_count":5,"constraints_in_attention_count":2,"execution_progress":0},"stages":[{"stage_number":1,"name":"<название этапа>","period":"Месяц ГГГГ — Месяц ГГГГ","start_date":"ГГГГ-ММ-ДД","end_date":"ГГГГ-ММ-ДД","stage_status":"Планируется","checkpoint":{"name":"<контрольная точка>","date":"ГГГГ-ММ-ДД","status":"Запланирована"},"composition":[{"project_name":"<точное название>","share":60,"roles":"<роли через запятую>"}],"resources":[{"role":"Аналитики","required_hours":80,"available_hours":120,"loading_percent":67,"loading_degree":"Средняя"},{"role":"Разработчики","required_hours":300,"available_hours":320,"loading_percent":94,"loading_degree":"Высокая"},{"role":"Тестировщики","required_hours":60,"available_hours":80,"loading_percent":75,"loading_degree":"Средняя"}]}],"resource_loading_by_stages":[{"stage_number":1,"analysts_percent":67,"developers_percent":94,"testers_percent":75}],"plan_risks":[{"risk":"<текст риска>","impact":"Высокий|Средний|Низкий"}],"constraints_in_attention":[{"constraint":"<название>","actual_value":"<значение>","impact":"<описание>"}]}}

Правила:
- Разбей горизонт планирования на 3–4 логических этапа с учётом зависимостей проектов
- Каждый этап завершается контрольной точкой (checkpoint)
- project_name в composition: точные названия из входных данных
- loading_degree: "Низкая" (<60%), "Средняя" (60–80%), "Высокая" (80–95%), "Критичная" (≥95%)
- available_hours = лимиты ресурсов, разбитые пропорционально длительности этапа относительно общего горизонта
- НЕ добавляй текст до или после JSON
"""


def _build_plan_message(
    ctx: dict,
    scenario: dict,
    projects: list,
    dependencies: list,
    constraints: dict | None,
) -> str:
    lines = [
        f"Портфель: {ctx.get('portfolio_name', '')}, горизонт: {ctx.get('planning_horizon', '')}",
        f"Выбранный сценарий: {json.dumps({'type': scenario.get('type'), 'name': scenario.get('name'), 'description': scenario.get('description'), 'total_duration_months': scenario.get('total_duration_months'), 'projects': scenario.get('projects', [])}, ensure_ascii=False)}",
        f"Проекты портфеля: {json.dumps([{'name': p.get('name', ''), 'status': p.get('status', ''), 'start_date': str(p.get('start_date', '')), 'end_date': str(p.get('end_date', '')), 'workload': p.get('workload', {})} for p in projects], ensure_ascii=False)}",
        f"Зависимости: {json.dumps([{'main': d.get('main_project_name', ''), 'dependent': d.get('dependent_project_name', '')} for d in dependencies], ensure_ascii=False)}",
    ]
    if constraints:
        lines.append(
            f"Лимиты ресурсов: аналитики={constraints.get('analysts_limit')}, "
            f"разработчики={constraints.get('developers_limit')}, "
            f"тестировщики={constraints.get('testers_limit')}, "
            f"дедлайн={constraints.get('critical_deadline')}"
        )
    lines.append("Сформируй детальный план реализации.")
    return "\n".join(lines)


async def _run_plan_generation(context_id: str, scenario_id: str) -> None:
    db = get_db()
    await db.strategic_plans.update_one(
        {"contextId": context_id},
        {"$set": {"status": "IN_PROGRESS", "contextId": context_id, "plan": None, "error": None}},
        upsert=True,
    )
    try:
        ctx = await db.planning_contexts.find_one({"_id": ObjectId(context_id)})
        alt_doc = await db.alternative_scenarios.find_one({"contextId": context_id})
        scenarios = alt_doc.get("scenarios", []) if alt_doc else []
        scenario = next(
            (s for s in scenarios if s.get("type", "").lower() == scenario_id.lower()),
            scenarios[0] if scenarios else {},
        )

        projects = await db.projects.find({"contextId": context_id}).to_list(100)
        dependencies = await db.project_dependencies.find({"contextId": context_id}).to_list(100)
        constraints = await db.portfolio_constraints.find_one({"contextId": context_id})

        user_msg = _build_plan_message(ctx or {}, scenario, projects, dependencies, constraints)
        result = await llm.chat_json([
            {"role": "system", "content": _PLAN_SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ])
        plan = result.get("plan", result)
        await db.strategic_plans.update_one(
            {"contextId": context_id},
            {"$set": {"status": "COMPLETED", "plan": plan, "error": None}},
        )
        await db.planning_contexts.update_one(
            {"_id": ObjectId(context_id)},
            {"$set": {"planning_stages_status.$[el].status": "COMPLETED"}},
            array_filters=[{"el.stage_name": "План"}],
        )
    except Exception as e:
        await db.strategic_plans.update_one(
            {"contextId": context_id},
            {"$set": {"status": "FAILED", "error": str(e)}},
        )


@router.get("/{contextId}/plan")
async def get_plan(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    context_id = str(ctx["_id"])
    doc = await db.strategic_plans.find_one({"contextId": context_id})
    if not doc:
        return {"status": "NOT_STARTED", "plan": None, "error": None}
    return {
        "status": doc["status"],
        "plan": doc.get("plan"),
        "error": doc.get("error"),
    }
