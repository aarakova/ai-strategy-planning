import asyncio
import json

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from .. import llm
from ..database import get_db
from ..dependencies import get_context_for_user
from ..models.alternatives import AlternativeSelectRequest

router = APIRouter(prefix="/contexts", tags=["Alternatives"])

_SYSTEM_PROMPT_TEMPLATE = """\
Ты — эксперт по стратегическому планированию портфеля проектов.
Сформируй ровно 1 сценарий реализации типа {scenario_type}.

ВАЖНО: верни ТОЛЬКО JSON-объект — никаких пояснений, рассуждений, markdown или лишнего текста до или после JSON.

Структура ответа:
{{"scenario":{{"type":"{scenario_type}","name":"<название>","description":"<1-2 предл>","ai_interpretation":"<1-2 предл>","total_duration_months":8,"risk_count":3,"constraint_compliance_percent":90,"resource_feasibility_percent":85,"strengths":["<1 предл>"],"weaknesses":["<1 предл>"],"total_resources":{{"analysts":600,"developers":1440,"testers":480}},"key_risks":[{{"text":"<1 предл>","level":"high|medium|low","impact":"Высокий|Средний|Низкий"}}],"complied_constraints":["<1 предл>"],"constraints_in_attention":["<1 предл>"],"projects":[{{"project_name":"<точное название>","dependency_note":"<1 предл>","period":"Месяц ГГГГ — Месяц ГГГГ","description":"<1 предл>","resources":{{"analysts":0,"developers":0,"testers":0}}}}]}}}}

Правила:
- Тип сценария строго {scenario_type}
- Порядок проектов — от первого к последнему по зависимостям
- project_name: точные названия из входных данных
- Все тексты на русском; каждое текстовое поле — не более 2 предложений
- total_resources — суммарные часы по всем проектам сценария
- НЕ добавляй текст до или после JSON
"""


def _build_alternatives_message(
    ctx: dict,
    orientations: list,
    projects: list,
    dependencies: list,
    constraints: dict | None,
    analysis: dict | None,
    goals: list,
) -> str:
    lines = [
        f"Портфель: {ctx.get('portfolio_name', '')}, горизонт: {ctx.get('planning_horizon', '')}",
        f"Ориентиры: {json.dumps([{'vision': o.get('vision', ''), 'priority': o.get('priority', '')} for o in orientations], ensure_ascii=False)}",
        f"Проекты: {json.dumps([{'name': p.get('name', ''), 'status': p.get('status', ''), 'start_date': str(p.get('start_date', '')), 'end_date': str(p.get('end_date', '')), 'workload': p.get('workload', {})} for p in projects], ensure_ascii=False)}",
        f"Зависимости: {json.dumps([{'main': d.get('main_project_name', ''), 'dependent': d.get('dependent_project_name', '')} for d in dependencies], ensure_ascii=False)}",
    ]
    if constraints:
        lines.append(
            f"Лимиты ресурсов: аналитики={constraints.get('analysts_limit')}, "
            f"разработчики={constraints.get('developers_limit')}, "
            f"тестировщики={constraints.get('testers_limit')}, "
            f"дедлайн={constraints.get('critical_deadline')}"
        )
    if analysis and analysis.get("status") == "COMPLETED":
        risks = [r.get("text", "")[:120] for r in analysis.get("risks", [])[:3]]
        lines.append(f"Риски из анализа: {'; '.join(risks)}")
    if goals:
        goal_texts = [g.get("specific", "")[:100] for g in goals[:3]]
        lines.append(f"Стратегические цели: {'; '.join(goal_texts)}")
    lines.append("Сформируй 3 сценария.")
    return "\n".join(lines)


async def _run_alternatives_generation(context_id: str) -> None:
    db = get_db()
    await db.alternative_scenarios.update_one(
        {"contextId": context_id},
        {"$set": {"status": "IN_PROGRESS", "contextId": context_id, "scenarios": [], "error": None}},
        upsert=True,
    )
    try:
        ctx = await db.planning_contexts.find_one({"_id": ObjectId(context_id)})
        orientations = await db.strategic_orientations.find({"contextId": context_id}).to_list(50)
        projects = await db.projects.find({"contextId": context_id}).to_list(100)
        dependencies = await db.project_dependencies.find({"contextId": context_id}).to_list(100)
        constraints = await db.portfolio_constraints.find_one({"contextId": context_id})
        analysis = await db.analysis_results.find_one({"contextId": context_id})
        goals = await db.strategic_goals.find({"contextId": context_id}).to_list(20)

        user_msg = _build_alternatives_message(
            ctx or {}, orientations, projects, dependencies, constraints, analysis, goals
        )
        scenarios = []
        errors = []
        for scenario_type in ("BALANCED", "CONSERVATIVE", "RISKY"):
            if scenarios or errors:
                await asyncio.sleep(8)
            try:
                system = _SYSTEM_PROMPT_TEMPLATE.format(scenario_type=scenario_type)
                result = await llm.chat_json([
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_msg},
                ])
                scenario = result.get("scenario")
                if scenario:
                    scenarios.append(scenario)
            except Exception as exc:
                errors.append(str(exc))
        if not scenarios:
            raise RuntimeError("; ".join(errors) or "Все запросы к LLM завершились неудачей")
        await db.alternative_scenarios.update_one(
            {"contextId": context_id},
            {"$set": {"status": "COMPLETED", "scenarios": scenarios, "error": None}},
        )
    except Exception as e:
        await db.alternative_scenarios.update_one(
            {"contextId": context_id},
            {"$set": {"status": "FAILED", "error": str(e)}},
        )


async def _run_plan_generation(context_id: str, scenario_id: str) -> None:
    db = get_db()
    await db.strategic_plans.update_one(
        {"contextId": context_id},
        {"$set": {"status": "IN_PROGRESS", "contextId": context_id, "selected_scenario_id": scenario_id}},
        upsert=True,
    )


@router.get("/{contextId}/alternatives")
async def get_alternatives(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    context_id = str(ctx["_id"])
    doc = await db.alternative_scenarios.find_one({"contextId": context_id})
    if not doc:
        return {"status": "NOT_STARTED", "scenarios": [], "selected_scenario_id": None, "error": None}
    return {
        "status": doc["status"],
        "scenarios": doc.get("scenarios", []),
        "selected_scenario_id": doc.get("selected_scenario_id"),
        "error": doc.get("error"),
    }


@router.post("/{contextId}/alternatives/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_alternatives(
    background_tasks: BackgroundTasks,
    ctx: dict = Depends(get_context_for_user),
):
    db = get_db()
    context_id = str(ctx["_id"])
    doc = await db.alternative_scenarios.find_one({"contextId": context_id})
    if doc and doc.get("status") == "IN_PROGRESS":
        raise HTTPException(status_code=409, detail="Генерация уже выполняется")
    background_tasks.add_task(_run_alternatives_generation, context_id)
    return {"detail": "Генерация сценариев запущена"}


@router.post("/{contextId}/alternatives")
async def select_alternative(
    body: AlternativeSelectRequest,
    background_tasks: BackgroundTasks,
    ctx: dict = Depends(get_context_for_user),
):
    db = get_db()
    context_id = str(ctx["_id"])

    await db.alternative_scenarios.update_one(
        {"contextId": context_id},
        {"$set": {"selected_scenario_id": body.scenario_id, "contextId": context_id}},
        upsert=True,
    )
    await db.planning_contexts.update_one(
        {"_id": ctx["_id"]},
        {"$set": {"planning_stages_status.$[el].status": "COMPLETED"}},
        array_filters=[{"el.stage_name": "Альтернативы"}],
    )
    background_tasks.add_task(_run_plan_generation, context_id, body.scenario_id)
    return {"detail": "Сценарий выбран, формирование плана запущено"}
