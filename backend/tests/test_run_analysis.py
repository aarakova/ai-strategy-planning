"""
Тесты для фоновой задачи _run_analysis (context.py).
Проверяют жизненный цикл: IN_PROGRESS → COMPLETED / FAILED.
"""
from unittest.mock import AsyncMock, call, patch

import pytest
from bson import ObjectId

from app.routers.context import _run_analysis
from tests.conftest import FAKE_CTX_ID, MOCK_LLM_RESULT


def _make_cursor(items: list):
    from unittest.mock import MagicMock
    cursor = MagicMock()
    cursor.to_list = AsyncMock(return_value=items)
    return cursor


@pytest.fixture
def db_with_context(mock_db, fake_context):
    """mock_db с уже заполненным planning_contexts.find_one."""
    mock_db.planning_contexts.find_one.return_value = fake_context
    mock_db.strategic_orientations.find.return_value = _make_cursor(
        [{"vision": "Автоматизация", "priority": "Высокий", "contextId": FAKE_CTX_ID}]
    )
    mock_db.projects.find.return_value = _make_cursor(
        [
            {
                "name": "Проект A",
                "status": "В работе",
                "start_date": "2026-01-15",
                "end_date": "2026-06-30",
                "workload": {"analysts": 120, "developers": 320, "testers": 100},
                "contextId": FAKE_CTX_ID,
            }
        ]
    )
    mock_db.project_dependencies.find.return_value = _make_cursor([])
    mock_db.portfolio_constraints.find_one.return_value = {
        "analysts_limit": 600,
        "developers_limit": 1200,
        "testers_limit": 500,
        "critical_deadline": "2026-12-31",
        "contextId": FAKE_CTX_ID,
    }
    return mock_db


async def test_marks_in_progress_before_llm_call(db_with_context, monkeypatch):
    """Первое обновление analysis_results должно быть IN_PROGRESS."""
    monkeypatch.setattr("app.routers.context.get_db", lambda: db_with_context)

    with patch("app.llm.chat_json", new=AsyncMock(return_value=MOCK_LLM_RESULT)):
        await _run_analysis(FAKE_CTX_ID)

    first_update = db_with_context.analysis_results.update_one.call_args_list[0]
    set_doc = first_update[0][1]["$set"]
    assert set_doc["status"] == "IN_PROGRESS"


async def test_saves_completed_with_llm_result(db_with_context, monkeypatch):
    """После успешного вызова LLM сохраняется COMPLETED с полным результатом."""
    monkeypatch.setattr("app.routers.context.get_db", lambda: db_with_context)

    with patch("app.llm.chat_json", new=AsyncMock(return_value=MOCK_LLM_RESULT)):
        await _run_analysis(FAKE_CTX_ID)

    second_update = db_with_context.analysis_results.update_one.call_args_list[1]
    set_doc = second_update[0][1]["$set"]
    assert set_doc["status"] == "COMPLETED"
    assert set_doc["error"] is None
    assert set_doc["risks"] == MOCK_LLM_RESULT["risks"]
    assert set_doc["aiExplanation"] == MOCK_LLM_RESULT["aiExplanation"]


async def test_saves_failed_on_llm_error(db_with_context, monkeypatch):
    """Если LLM бросает исключение — сохраняется FAILED с текстом ошибки."""
    monkeypatch.setattr("app.routers.context.get_db", lambda: db_with_context)

    with patch("app.llm.chat_json", new=AsyncMock(side_effect=RuntimeError("No endpoints found for model"))):
        await _run_analysis(FAKE_CTX_ID)

    last_update = db_with_context.analysis_results.update_one.call_args_list[-1]
    set_doc = last_update[0][1]["$set"]
    assert set_doc["status"] == "FAILED"
    assert "No endpoints found" in set_doc["error"]


async def test_updates_stage_status_to_completed_on_success(db_with_context, monkeypatch):
    """При успехе этап 'Анализ' в planning_contexts должен стать COMPLETED."""
    monkeypatch.setattr("app.routers.context.get_db", lambda: db_with_context)

    with patch("app.llm.chat_json", new=AsyncMock(return_value=MOCK_LLM_RESULT)):
        await _run_analysis(FAKE_CTX_ID)

    db_with_context.planning_contexts.update_one.assert_called_once()
    update_call = db_with_context.planning_contexts.update_one.call_args
    set_doc = update_call[0][1]["$set"]
    assert set_doc["planning_stages_status.$[el].status"] == "COMPLETED"


async def test_does_not_update_stage_on_llm_failure(db_with_context, monkeypatch):
    """При ошибке LLM этап 'Анализ' не должен обновляться."""
    monkeypatch.setattr("app.routers.context.get_db", lambda: db_with_context)

    with patch("app.llm.chat_json", new=AsyncMock(side_effect=RuntimeError("timeout"))):
        await _run_analysis(FAKE_CTX_ID)

    db_with_context.planning_contexts.update_one.assert_not_called()


async def test_queries_all_required_collections(db_with_context, monkeypatch):
    """_run_analysis должен запрашивать данные из всех 4 коллекций контекста."""
    monkeypatch.setattr("app.routers.context.get_db", lambda: db_with_context)

    with patch("app.llm.chat_json", new=AsyncMock(return_value=MOCK_LLM_RESULT)):
        await _run_analysis(FAKE_CTX_ID)

    db_with_context.planning_contexts.find_one.assert_called_once()
    db_with_context.strategic_orientations.find.assert_called_once()
    db_with_context.projects.find.assert_called_once()
    db_with_context.project_dependencies.find.assert_called_once()
    db_with_context.portfolio_constraints.find_one.assert_called_once()
