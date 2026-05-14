from unittest.mock import AsyncMock, MagicMock

import pytest
from bson import ObjectId
from httpx import ASGITransport, AsyncClient

from app.dependencies import get_context_for_user
from app.main import app

FAKE_CTX_ID = "6a05d0e1707a777b8054b6a8"

MOCK_LLM_RESULT = {
    "risks": [
        {"text": "Дефицит разработчиков", "level": "high", "impact": "Высокий"},
        {"text": "Каскадная задержка", "level": "medium", "impact": "Средний"},
    ],
    "scheduleAnalysis": ["Проект A выходит за критический срок", "Цепочка B→C создаёт риск"],
    "resourceAnalysis": [
        {"role": "Аналитики", "demand": "600 ч", "limit": "600 ч", "balance": "Профицит 0 ч", "status": "warning"},
        {"role": "Разработчики", "demand": "1440 ч", "limit": "1200 ч", "balance": "Дефицит 240 ч", "status": "critical"},
    ],
    "deviationAnalysis": [
        {"project": "Проект A", "deviation": "Отставание 2 нед.", "danger": "Высокая", "transfer": "Блокирует Проект B"},
    ],
    "aiExplanation": "Портфель реализуем частично из-за дефицита разработчиков.",
    "recommendations": [
        {"title": "Перераспределить ресурсы", "text": "Привлечь разработчиков с проектов низкого приоритета."},
    ],
}

VALID_SUBMIT_BODY = {
    "orientations": [{"vision": "Автоматизация процессов", "priority": "Высокий"}],
    "projects": [
        {
            "name": "Проект A",
            "status": "В работе",
            "start_date": "2026-01-15",
            "end_date": "2026-06-30",
            "workload": {"analysts": 120, "developers": 320, "testers": 100},
        }
    ],
    "dependencies": [],
    "portfolio_constraints": {
        "analysts_limit": 600,
        "developers_limit": 1200,
        "testers_limit": 500,
        "critical_deadline": "2026-12-31",
    },
}


def _make_cursor(items: list):
    cursor = MagicMock()
    cursor.to_list = AsyncMock(return_value=items)
    return cursor


@pytest.fixture
def fake_context():
    return {
        "_id": ObjectId(FAKE_CTX_ID),
        "userId": "user123",
        "portfolio_name": "Тестовый портфель",
        "planning_horizon": "2026 год",
        "planning_stages_status": [
            {"stage_name": "Контекст", "status": "COMPLETED"},
            {"stage_name": "Анализ", "status": "NOT_STARTED"},
        ],
    }


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.analysis_results.find_one = AsyncMock(return_value=None)
    db.analysis_results.update_one = AsyncMock()
    db.planning_contexts.find_one = AsyncMock(return_value=None)
    db.planning_contexts.update_one = AsyncMock()
    db.strategic_orientations.delete_many = AsyncMock()
    db.strategic_orientations.insert_many = AsyncMock()
    db.strategic_orientations.find = MagicMock(return_value=_make_cursor([]))
    db.projects.delete_many = AsyncMock()
    db.projects.insert_many = AsyncMock()
    db.projects.find = MagicMock(return_value=_make_cursor([]))
    db.project_dependencies.delete_many = AsyncMock()
    db.project_dependencies.insert_many = AsyncMock()
    db.project_dependencies.find = MagicMock(return_value=_make_cursor([]))
    db.portfolio_constraints.delete_many = AsyncMock()
    db.portfolio_constraints.insert_one = AsyncMock()
    db.portfolio_constraints.find_one = AsyncMock(return_value=None)
    return db


@pytest.fixture
async def http_client(mock_db, fake_context, monkeypatch):
    monkeypatch.setattr("app.routers.analysis.get_db", lambda: mock_db)
    monkeypatch.setattr("app.routers.context.get_db", lambda: mock_db)
    app.dependency_overrides[get_context_for_user] = lambda: fake_context
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
