from fastapi import APIRouter, Depends

from ..dependencies import get_context_for_user

router = APIRouter(prefix="/contexts", tags=["Plan"])

_MOCK_PLAN = {
    "status": "COMPLETED",
    "selected_scenario_type": "BALANCED",
    "plan_passport": {
        "selected_variant": "Сбалансированный вариант",
        "planning_horizon_months": 8,
        "checkpoint_count": 4,
        "risk_count": 5,
        "constraints_in_attention_count": 2,
        "execution_progress": 25,
    },
    "stages": [
        {
            "stage_number": 1,
            "name": "Подготовка архитектурной основы",
            "period": "Май 2026 — Июнь 2026",
            "start_date": "2026-05-01",
            "end_date": "2026-06-30",
            "stage_status": "В работе",
            "checkpoint": {
                "name": "Архитектура утверждена",
                "date": "2026-06-30",
                "status": "Запланирована",
            },
            "composition": [
                {"project_name": "Модуль авторизации", "share": 60, "roles": "Backend, Frontend"},
                {"project_name": "Аналитический модуль", "share": 20, "roles": "Аналитики"},
            ],
            "resources": [
                {"role": "Аналитики", "required_hours": 80, "available_hours": 120, "loading_percent": 67, "loading_degree": "Средняя"},
                {"role": "Разработчики", "required_hours": 300, "available_hours": 320, "loading_percent": 94, "loading_degree": "Высокая"},
                {"role": "Тестировщики", "required_hours": 60, "available_hours": 80, "loading_percent": 75, "loading_degree": "Средняя"},
            ],
        },
        {
            "stage_number": 2,
            "name": "Разработка ключевых модулей",
            "period": "Июль 2026 — Август 2026",
            "start_date": "2026-07-01",
            "end_date": "2026-08-31",
            "stage_status": "Планируется",
            "checkpoint": {
                "name": "MVP платёжной системы",
                "date": "2026-08-31",
                "status": "Запланирована",
            },
            "composition": [
                {"project_name": "Платёжная система", "share": 70, "roles": "Backend, QA"},
                {"project_name": "Модуль авторизации", "share": 30, "roles": "Frontend"},
            ],
            "resources": [
                {"role": "Аналитики", "required_hours": 100, "available_hours": 120, "loading_percent": 83, "loading_degree": "Высокая"},
                {"role": "Разработчики", "required_hours": 420, "available_hours": 320, "loading_percent": 131, "loading_degree": "Критичная"},
                {"role": "Тестировщики", "required_hours": 80, "available_hours": 80, "loading_percent": 100, "loading_degree": "Критичная"},
            ],
        },
        {
            "stage_number": 3,
            "name": "Интеграция и тестирование",
            "period": "Сентябрь 2026 — Октябрь 2026",
            "start_date": "2026-09-01",
            "end_date": "2026-10-31",
            "stage_status": "Планируется",
            "checkpoint": {
                "name": "Интеграционное тестирование завершено",
                "date": "2026-10-15",
                "status": "Запланирована",
            },
            "composition": [
                {"project_name": "Платёжная система", "share": 40, "roles": "QA, DevOps"},
                {"project_name": "Аналитический модуль", "share": 60, "roles": "Backend, QA"},
            ],
            "resources": [
                {"role": "Аналитики", "required_hours": 80, "available_hours": 120, "loading_percent": 67, "loading_degree": "Средняя"},
                {"role": "Разработчики", "required_hours": 280, "available_hours": 320, "loading_percent": 88, "loading_degree": "Высокая"},
                {"role": "Тестировщики", "required_hours": 100, "available_hours": 80, "loading_percent": 125, "loading_degree": "Критичная"},
            ],
        },
        {
            "stage_number": 4,
            "name": "Запуск и мониторинг",
            "period": "Ноябрь 2026 — Декабрь 2026",
            "start_date": "2026-11-01",
            "end_date": "2026-12-31",
            "stage_status": "Планируется",
            "checkpoint": {
                "name": "Промышленный запуск",
                "date": "2026-12-15",
                "status": "Запланирована",
            },
            "composition": [
                {"project_name": "Модуль авторизации", "share": 100, "roles": "DevOps, Support"},
                {"project_name": "Платёжная система", "share": 100, "roles": "DevOps, Support"},
                {"project_name": "Аналитический модуль", "share": 80, "roles": "Backend, QA"},
            ],
            "resources": [
                {"role": "Аналитики", "required_hours": 60, "available_hours": 120, "loading_percent": 50, "loading_degree": "Низкая"},
                {"role": "Разработчики", "required_hours": 200, "available_hours": 320, "loading_percent": 63, "loading_degree": "Средняя"},
                {"role": "Тестировщики", "required_hours": 60, "available_hours": 80, "loading_percent": 75, "loading_degree": "Средняя"},
            ],
        },
    ],
    "resource_loading_by_stages": [
        {"stage_number": 1, "analysts_percent": 67, "developers_percent": 94, "testers_percent": 75},
        {"stage_number": 2, "analysts_percent": 83, "developers_percent": 131, "testers_percent": 100},
        {"stage_number": 3, "analysts_percent": 67, "developers_percent": 88, "testers_percent": 125},
        {"stage_number": 4, "analysts_percent": 50, "developers_percent": 63, "testers_percent": 75},
    ],
    "plan_risks": [
        {"risk": "Перегрузка разработчиков на этапе 2", "impact": "Высокий"},
        {"risk": "Критическая нагрузка тестировщиков на этапах 2–3", "impact": "Высокий"},
        {"risk": "Задержка MVP платёжной системы может сдвинуть этап 3", "impact": "Средний"},
        {"risk": "Зависимость запуска от готовности модуля авторизации", "impact": "Средний"},
        {"risk": "Недостаточный буфер времени перед дедлайном", "impact": "Низкий"},
    ],
    "constraints_in_attention": [
        {
            "constraint": "Лимит разработчиков",
            "actual_value": "420 ч/мес при лимите 320 на этапе 2",
            "impact": "Требуется дополнительный наём или перераспределение задач",
        },
        {
            "constraint": "Лимит тестировщиков",
            "actual_value": "100 ч/мес при лимите 80 на этапе 3",
            "impact": "Риск снижения качества или переноса релиза",
        },
    ],
}


@router.get("/{contextId}/plan")
async def get_plan(ctx: dict = Depends(get_context_for_user)):
    return _MOCK_PLAN
