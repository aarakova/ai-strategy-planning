from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from ..database import get_db
from ..dependencies import get_context_for_user
from ..models.alternatives import AlternativeSelectRequest

router = APIRouter(prefix="/contexts", tags=["Alternatives"])

_MOCK_SCENARIOS = [
    {
        "id": "scen-1",
        "name": "Сбалансированный вариант",
        "type": "BALANCED",
        "description": "Равномерное распределение ресурсов между проектами с учётом зависимостей.",
        "status": "Рекомендуемый",
        "integral_score": 78,
        "total_duration_months": 8,
        "risk_count": 3,
        "constraint_compliance_percent": 90,
        "resource_requirements": [
            {"role": "Аналитики", "required_hours": 320},
            {"role": "Разработчики", "required_hours": 900},
            {"role": "Тестировщики", "required_hours": 240},
        ],
        "strengths": [
            "Соблюдение критического дедлайна",
            "Равномерная загрузка команды",
            "Минимальные риски по зависимостям",
        ],
        "weaknesses": [
            "Более длительный горизонт реализации",
            "Не позволяет ускорить запуск ключевых проектов",
        ],
        "ai_interpretation": "Наиболее устойчивый сценарий с предсказуемым результатом.",
        "risks": [
            {"risk": "Задержка проекта A на 2 недели", "impact": "Средний"},
            {"risk": "Недостаточная доступность разработчиков в июле", "impact": "Низкий"},
        ],
        "complied_constraints": [
            "Лимит аналитиков (500 ч/мес)",
            "Критический дедлайн 31.10.2026",
        ],
        "constraints_in_attention": ["Лимит разработчиков (900 ч/мес)"],
        "projects": [
            {"project_name": "Модуль авторизации", "share": 40, "resources": {"analysts": 120, "developers": 360, "testers": 96}},
            {"project_name": "Платёжная система", "share": 35, "resources": {"analysts": 112, "developers": 315, "testers": 84}},
            {"project_name": "Аналитический модуль", "share": 25, "resources": {"analysts": 88, "developers": 225, "testers": 60}},
        ],
    },
    {
        "id": "scen-2",
        "name": "Консервативный вариант",
        "type": "CONSERVATIVE",
        "description": "Минимизация рисков за счёт последовательной реализации проектов.",
        "status": "Допустимый",
        "integral_score": 61,
        "total_duration_months": 11,
        "risk_count": 1,
        "constraint_compliance_percent": 100,
        "resource_requirements": [
            {"role": "Аналитики", "required_hours": 280},
            {"role": "Разработчики", "required_hours": 750},
            {"role": "Тестировщики", "required_hours": 200},
        ],
        "strengths": [
            "Полное соответствие всем ресурсным ограничениям",
            "Минимальный риск",
        ],
        "weaknesses": [
            "Длительный горизонт реализации — 11 месяцев",
            "Поздний запуск доходных проектов",
        ],
        "ai_interpretation": "Безопасный вариант, но задерживает достижение стратегических целей.",
        "risks": [
            {"risk": "Потеря рыночного преимущества из-за медленного выхода", "impact": "Средний"},
        ],
        "complied_constraints": [
            "Лимит аналитиков (500 ч/мес)",
            "Лимит разработчиков (900 ч/мес)",
            "Критический дедлайн 31.10.2026",
        ],
        "constraints_in_attention": [],
        "projects": [
            {"project_name": "Модуль авторизации", "share": 100, "resources": {"analysts": 120, "developers": 350, "testers": 96}},
            {"project_name": "Платёжная система", "share": 0, "resources": {"analysts": 0, "developers": 0, "testers": 0}},
            {"project_name": "Аналитический модуль", "share": 0, "resources": {"analysts": 0, "developers": 0, "testers": 0}},
        ],
    },
    {
        "id": "scen-3",
        "name": "Ускоренный вариант",
        "type": "RISKY",
        "description": "Параллельный запуск всех проектов для максимально быстрого результата.",
        "status": "Требует внимания",
        "integral_score": 52,
        "total_duration_months": 6,
        "risk_count": 6,
        "constraint_compliance_percent": 65,
        "resource_requirements": [
            {"role": "Аналитики", "required_hours": 480},
            {"role": "Разработчики", "required_hours": 1400},
            {"role": "Тестировщики", "required_hours": 360},
        ],
        "strengths": ["Самый короткий горизонт — 6 месяцев", "Ранний запуск всех проектов"],
        "weaknesses": [
            "Превышение лимита разработчиков на 56%",
            "Высокий риск срыва дедлайнов",
            "Критическая перегрузка команды",
        ],
        "ai_interpretation": "Реализуем только при привлечении дополнительных ресурсов. Высокий риск.",
        "risks": [
            {"risk": "Критическая перегрузка разработчиков", "impact": "Высокий"},
            {"risk": "Снижение качества из-за параллельной разработки", "impact": "Высокий"},
            {"risk": "Задержка поставки из-за нехватки тестировщиков", "impact": "Средний"},
        ],
        "complied_constraints": ["Лимит аналитиков (500 ч/мес)"],
        "constraints_in_attention": [
            "Лимит разработчиков превышен: требуется 1400 при лимите 900",
            "Лимит тестировщиков превышен: требуется 360 при лимите 300",
        ],
        "projects": [
            {"project_name": "Модуль авторизации", "share": 100, "resources": {"analysts": 160, "developers": 480, "testers": 120}},
            {"project_name": "Платёжная система", "share": 100, "resources": {"analysts": 160, "developers": 480, "testers": 120}},
            {"project_name": "Аналитический модуль", "share": 100, "resources": {"analysts": 160, "developers": 440, "testers": 120}},
        ],
    },
]

_MOCK_COMPARISON_MATRIX = [
    {
        "type": "BALANCED",
        "integral_score": 78,
        "risk_count": 3,
        "constraint_compliance_percent": 90,
        "resource_feasibility_percent": 95,
        "total_duration_months": 8,
        "status": "Рекомендуемый",
    },
    {
        "type": "CONSERVATIVE",
        "integral_score": 61,
        "risk_count": 1,
        "constraint_compliance_percent": 100,
        "resource_feasibility_percent": 100,
        "total_duration_months": 11,
        "status": "Допустимый",
    },
    {
        "type": "RISKY",
        "integral_score": 52,
        "risk_count": 6,
        "constraint_compliance_percent": 65,
        "resource_feasibility_percent": 60,
        "total_duration_months": 6,
        "status": "Требует внимания",
    },
]


async def _run_plan_generation(context_id: str, scenario_ids: list[str]) -> None:
    db = get_db()
    await db.strategic_plans.update_one(
        {"contextId": context_id},
        {"$set": {"status": "IN_PROGRESS", "contextId": context_id, "selected_scenario_ids": scenario_ids}},
        upsert=True,
    )
    # TODO: call GigaChat API for plan generation


@router.get("/{contextId}/alternatives")
async def get_alternatives(ctx: dict = Depends(get_context_for_user)):
    return {
        "status": "COMPLETED",
        "selected_scenario_id": None,
        "scenarios": _MOCK_SCENARIOS,
        "comparison_matrix": _MOCK_COMPARISON_MATRIX,
    }


@router.post("/{contextId}/alternatives", status_code=status.HTTP_202_ACCEPTED)
async def select_alternatives(
    body: AlternativeSelectRequest,
    background_tasks: BackgroundTasks,
    ctx: dict = Depends(get_context_for_user),
):
    db = get_db()
    context_id = str(ctx["_id"])

    await db.alternative_scenarios.update_one(
        {"contextId": context_id},
        {"$set": {"selected_scenario_ids": body.scenario_ids, "contextId": context_id}},
        upsert=True,
    )
    await db.planning_contexts.update_one(
        {"_id": ctx["_id"]},
        {"$set": {"planning_stages_status.$[el].status": "COMPLETED"}},
        array_filters=[{"el.stage_name": "Альтернативы"}],
    )

    background_tasks.add_task(_run_plan_generation, context_id, body.scenario_ids)
    return {"detail": "Сценарий выбран, формирование плана запущено"}
