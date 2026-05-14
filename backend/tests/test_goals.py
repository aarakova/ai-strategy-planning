# -*- coding: utf-8 -*-
"""
Unit-тесты для эндпоинтов /contexts/{contextId}/goals.

Запуск:
  python -m pytest tests/test_goals.py -v
"""
from unittest.mock import AsyncMock, MagicMock

import pytest
from bson import ObjectId

from tests.conftest import FAKE_CTX_ID

# ─── Вспомогательные данные ───────────────────────────────────────────────────

VALID_GOAL_BODY = {
    "goals": [
        {
            "specific": "Сократить цикл релиза",
            "kpi_name": "Длительность цикла",
            "kpi_target_value": 14.0,
            "kpi_unit": "дней",
            "achievable": "За счёт CI/CD автоматизации",
            "timebound": "2026-12-31",
            "priority": "Высокий",
            "orientation_ids": [],
            "project_names": ["Проект А"],
            "orientation_explanation": "Поддерживает ускорение поставки",
        }
    ]
}

MOCK_GOAL_DOC = {
    "_id": ObjectId(),
    "specific": "Сократить цикл релиза",
    "kpi_name": "Длительность цикла",
    "kpi_target_value": 14.0,
    "kpi_unit": "дней",
    "achievable": "За счёт CI/CD автоматизации",
    "timebound": "2026-12-31",
    "priority": "Высокий",
    "orientation_ids": [],
    "project_names": ["Проект А"],
    "orientation_explanation": "Поддерживает ускорение поставки",
    "context": "USER_CREATED",
    "contextId": FAKE_CTX_ID,
}

MOCK_AI_SUGGESTIONS = {
    "ai_suggestions": [
        {
            "specific": "Увеличить долю автоматизированных тестов",
            "kpi_name": "Покрытие тестами",
            "kpi_target_value": 80.0,
            "kpi_unit": "%",
            "achievable": "За счёт внедрения TDD",
            "timebound": "2026-09-30",
            "priority": "Средний",
            "orientation_ids": [],
            "project_names": ["Проект А"],
            "orientation_explanation": "Снижает операционные риски",
            "context": "AI_SUGGESTED",
            "ai_explanation": "Повышение покрытия тестами снизит число инцидентов.",
            "project_coverage": {"degree": "Умеренное", "explanation": "Охватывает 1 проект"},
            "realism_check": {"degree": "Высокая", "score": 85, "issues": []},
        }
    ]
}


def _make_cursor(items):
    cursor = MagicMock()
    cursor.to_list = AsyncMock(return_value=items)
    return cursor


# ─── GET /goals ───────────────────────────────────────────────────────────────

async def test_get_goals_returns_empty_list(http_client, mock_db):
    mock_db.strategic_goals.find = MagicMock(return_value=_make_cursor([]))

    resp = await http_client.get(f"/contexts/{FAKE_CTX_ID}/goals")

    assert resp.status_code == 200
    assert resp.json() == {"goals": []}


async def test_get_goals_returns_saved_goals(http_client, mock_db):
    mock_db.strategic_goals.find = MagicMock(return_value=_make_cursor([MOCK_GOAL_DOC]))

    resp = await http_client.get(f"/contexts/{FAKE_CTX_ID}/goals")

    assert resp.status_code == 200
    data = resp.json()
    assert len(data["goals"]) == 1
    goal = data["goals"][0]
    assert goal["specific"] == "Сократить цикл релиза"
    assert goal["kpi_target_value"] == 14.0
    assert goal["context"] == "USER_CREATED"
    assert "id" in goal


# ─── POST /goals ──────────────────────────────────────────────────────────────

async def test_post_goals_saves_and_returns(http_client, mock_db):
    inserted_id = ObjectId()
    mock_db.strategic_goals.insert_many = AsyncMock(
        return_value=MagicMock(inserted_ids=[inserted_id])
    )
    saved_doc = MOCK_GOAL_DOC | {"_id": inserted_id}
    mock_db.strategic_goals.find = MagicMock(return_value=_make_cursor([saved_doc]))

    resp = await http_client.post(f"/contexts/{FAKE_CTX_ID}/goals", json=VALID_GOAL_BODY)

    assert resp.status_code == 200
    data = resp.json()
    assert len(data["goals"]) == 1
    assert data["goals"][0]["specific"] == "Сократить цикл релиза"


async def test_post_goals_clears_previous(http_client, mock_db):
    inserted_id = ObjectId()
    mock_db.strategic_goals.insert_many = AsyncMock(
        return_value=MagicMock(inserted_ids=[inserted_id])
    )
    mock_db.strategic_goals.find = MagicMock(return_value=_make_cursor([MOCK_GOAL_DOC | {"_id": inserted_id}]))

    await http_client.post(f"/contexts/{FAKE_CTX_ID}/goals", json=VALID_GOAL_BODY)

    mock_db.strategic_goals.delete_many.assert_called_once_with(
        {"contextId": FAKE_CTX_ID, "context": "USER_CREATED"}
    )


async def test_post_goals_updates_stage_completed(http_client, mock_db):
    inserted_id = ObjectId()
    mock_db.strategic_goals.insert_many = AsyncMock(
        return_value=MagicMock(inserted_ids=[inserted_id])
    )
    mock_db.strategic_goals.find = MagicMock(return_value=_make_cursor([MOCK_GOAL_DOC | {"_id": inserted_id}]))

    await http_client.post(f"/contexts/{FAKE_CTX_ID}/goals", json=VALID_GOAL_BODY)

    mock_db.planning_contexts.update_one.assert_called_once()
    call_args = mock_db.planning_contexts.update_one.call_args
    assert call_args[0][1]["$set"]["planning_stages_status.$[el].status"] == "COMPLETED"
    assert call_args[1]["array_filters"] == [{"el.stage_name": "Цели"}]


async def test_post_goals_saves_empty_list(http_client, mock_db):
    resp = await http_client.post(f"/contexts/{FAKE_CTX_ID}/goals", json={"goals": []})

    assert resp.status_code == 200
    assert resp.json() == {"goals": []}
    mock_db.strategic_goals.delete_many.assert_called_once()


async def test_post_goals_invalid_body_returns_422(http_client):
    resp = await http_client.post(f"/contexts/{FAKE_CTX_ID}/goals", json={})
    assert resp.status_code == 422


# ─── GET /goals/suggestions ───────────────────────────────────────────────────

async def test_get_suggestions_returns_ai_suggestions(http_client, mock_db, monkeypatch):
    mock_db.strategic_orientations.find = MagicMock(return_value=_make_cursor([]))
    mock_db.projects.find = MagicMock(return_value=_make_cursor([]))
    mock_db.analysis_results.find_one = AsyncMock(return_value=None)

    monkeypatch.setattr(
        "app.routers.goals.llm.chat_json",
        AsyncMock(return_value=MOCK_AI_SUGGESTIONS),
    )

    resp = await http_client.get(f"/contexts/{FAKE_CTX_ID}/goals/suggestions")

    assert resp.status_code == 200
    data = resp.json()
    assert "ai_suggestions" in data
    assert len(data["ai_suggestions"]) == 1
    suggestion = data["ai_suggestions"][0]
    assert suggestion["specific"] == "Увеличить долю автоматизированных тестов"
    assert suggestion["context"] == "AI_SUGGESTED"
    assert suggestion["realism_check"]["score"] == 85


async def test_get_suggestions_503_on_llm_error(http_client, mock_db, monkeypatch):
    mock_db.strategic_orientations.find = MagicMock(return_value=_make_cursor([]))
    mock_db.projects.find = MagicMock(return_value=_make_cursor([]))
    mock_db.analysis_results.find_one = AsyncMock(return_value=None)

    monkeypatch.setattr(
        "app.routers.goals.llm.chat_json",
        AsyncMock(side_effect=RuntimeError("LLM unavailable")),
    )

    resp = await http_client.get(f"/contexts/{FAKE_CTX_ID}/goals/suggestions")

    assert resp.status_code == 503
    assert "LLM" in resp.json()["detail"]
