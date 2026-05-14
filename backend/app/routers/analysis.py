from fastapi import APIRouter, Depends

from ..dependencies import get_context_for_user

router = APIRouter(prefix="/contexts", tags=["Analysis"])

_MOCK_ANALYSIS = {
    "status": "COMPLETED",
    "dependency_graph": {
        "nodes": [
            {"id": "p1", "name": "Модуль авторизации", "status": "В работе"},
            {"id": "p2", "name": "Платёжная система", "status": "Не начато"},
            {"id": "p3", "name": "Аналитический модуль", "status": "Не начато"},
        ],
        "edges": [
            {"source": "p1", "target": "p2"},
            {"source": "p2", "target": "p3"},
        ],
    },
    "analysis_risks": [
        {
            "risk": "Задержка проекта A блокирует проект B",
            "impact": "Высокий",
            "source": "dependency_analysis",
        },
        {
            "risk": "Дефицит разработчиков на этапах 2–3",
            "impact": "Средний",
            "source": "resource_analysis",
        },
        {
            "risk": "Риск превышения критического дедлайна",
            "impact": "Низкий",
            "source": "timeline_analysis",
        },
    ],
    "timeline_analysis": {
        "summary": [
            "Горизонт планирования покрывает портфель частично",
            "Наибольшее влияние создаёт цепочка A→B→C",
            "Критический путь составляет 8 месяцев",
        ]
    },
    "resource_analysis": [
        {"role": "Аналитики", "required": 320, "limit": 500, "delta": 180},
        {"role": "Разработчики", "required": 1200, "limit": 900, "delta": -300},
        {"role": "Тестировщики", "required": 240, "limit": 300, "delta": 60},
    ],
    "deviation_analysis": [
        {
            "project_name": "Модуль авторизации",
            "deviation": "Отставание на 10 дней",
            "portfolio_danger": "Средняя",
            "dependency_propagation": "Задержка блокирует запуск Платёжной системы",
        }
    ],
    "ai_explanation": (
        "Портфель реализуем частично. Основная угроза — цепочка зависимостей A→B→C "
        "и дефицит разработчиков в периоды пиковой нагрузки. "
        "Рекомендуется пересмотр порядка запуска проектов."
    ),
    "ai_recommendations": [
        {
            "title": "Перераспределить ресурсы разработчиков",
            "text": "Временно привлечь 2–3 разработчиков с проектов низкого приоритета.",
            "basis": "Дефицит 300 ч/мес при текущем плане загрузки",
        },
        {
            "title": "Пересмотреть порядок запуска проектов",
            "text": "Рассмотреть параллельный запуск проектов B и C для снижения зависимости от A.",
            "basis": "Анализ критического пути портфеля",
        },
    ],
}


@router.get("/{contextId}/analysis")
async def get_analysis(ctx: dict = Depends(get_context_for_user)):
    return _MOCK_ANALYSIS
