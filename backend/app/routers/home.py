from fastapi import APIRouter, Depends

from ..dependencies import get_context_for_user

router = APIRouter(prefix="/contexts", tags=["Home"])

_MOCK_KEY_RISKS = [
    {"risk": "Задержка проекта A блокирует запуск проекта B", "impact": "HIGH"},
    {"risk": "Дефицит ресурсов разработчиков на пиковом этапе", "impact": "MEDIUM"},
]

_MOCK_RESOURCE_ANALYSIS = [
    {"role": "Аналитики", "required": 320, "limit": 500, "delta": 180},
    {"role": "Разработчики", "required": 1200, "limit": 900, "delta": -300},
    {"role": "Тестировщики", "required": 240, "limit": 300, "delta": 60},
]

_MOCK_GOALS = [
    {"id": "mock-g1", "specific": "Увеличить долю цифровых продаж до 60%", "priority": "HIGH"},
    {"id": "mock-g2", "specific": "Сократить время вывода продукта до 6 месяцев", "priority": "MEDIUM"},
    {"id": "mock-g3", "specific": "Снизить операционные затраты на 15%", "priority": "LOW"},
]

_MOCK_PLAN_PASSPORT = {
    "selected_variant": "Сбалансированный вариант",
    "planning_horizon_months": 8,
    "checkpoint_count": 4,
    "risk_count": 5,
    "constraints_in_attention_count": 2,
    "execution_progress": 25,
}


@router.get("/{contextId}/home")
async def get_home(ctx: dict = Depends(get_context_for_user)):
    return {
        "portfolio_name": ctx["portfolio_name"],
        "planning_stages_status": ctx.get("planning_stages_status", []),
        "key_risks": _MOCK_KEY_RISKS,
        "resource_analysis": _MOCK_RESOURCE_ANALYSIS,
        "strategic_goals": _MOCK_GOALS,
        "plan_passport": _MOCK_PLAN_PASSPORT,
    }
