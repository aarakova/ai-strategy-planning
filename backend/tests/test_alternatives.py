from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId

FAKE_CTX_ID = "6a05d0e1707a777b8054b6a8"

MOCK_SCENARIO = {
    "type": "BALANCED",
    "name": "Сбалансированный",
    "description": "Тестовый сценарий.",
    "ai_interpretation": "Интерпретация.",
    "total_duration_months": 8,
    "risk_count": 3,
    "constraint_compliance_percent": 90,
    "resource_feasibility_percent": 85,
    "strengths": ["Сильная сторона"],
    "weaknesses": ["Слабая сторона"],
    "total_resources": {"analysts": 600, "developers": 1440, "testers": 480},
    "key_risks": [{"text": "Риск", "level": "high", "impact": "Высокий"}],
    "complied_constraints": ["Ограничение соблюдено"],
    "constraints_in_attention": [],
    "projects": [],
}


@pytest.mark.asyncio
async def test_get_alternatives_not_started(http_client, mock_db):
    mock_db.alternative_scenarios.find_one = AsyncMock(return_value=None)
    resp = await http_client.get(f"/contexts/{FAKE_CTX_ID}/alternatives")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "NOT_STARTED"
    assert data["scenarios"] == []
    assert data["selected_scenario_id"] is None


@pytest.mark.asyncio
async def test_get_alternatives_returns_saved(http_client, mock_db):
    mock_db.alternative_scenarios.find_one = AsyncMock(
        return_value={
            "contextId": FAKE_CTX_ID,
            "status": "COMPLETED",
            "scenarios": [MOCK_SCENARIO],
            "selected_scenario_id": None,
            "error": None,
        }
    )
    resp = await http_client.get(f"/contexts/{FAKE_CTX_ID}/alternatives")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "COMPLETED"
    assert len(data["scenarios"]) == 1


@pytest.mark.asyncio
async def test_post_generate_launches_background(http_client, mock_db, monkeypatch):
    mock_db.alternative_scenarios.find_one = AsyncMock(return_value=None)
    mock_db.alternative_scenarios.update_one = AsyncMock()
    monkeypatch.setattr("app.routers.alternatives.llm.chat_json", AsyncMock(return_value={"scenario": MOCK_SCENARIO}))
    monkeypatch.setattr("app.routers.alternatives.asyncio.sleep", AsyncMock())
    resp = await http_client.post(f"/contexts/{FAKE_CTX_ID}/alternatives/generate")
    assert resp.status_code == 202
    assert "запущена" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_post_generate_returns_409_if_in_progress(http_client, mock_db):
    mock_db.alternative_scenarios.find_one = AsyncMock(
        return_value={"contextId": FAKE_CTX_ID, "status": "IN_PROGRESS"}
    )
    resp = await http_client.post(f"/contexts/{FAKE_CTX_ID}/alternatives/generate")
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_post_select_saves_scenario_id(http_client, mock_db):
    mock_db.alternative_scenarios.update_one = AsyncMock()
    mock_db.planning_contexts.update_one = AsyncMock()
    resp = await http_client.post(
        f"/contexts/{FAKE_CTX_ID}/alternatives",
        json={"scenario_id": "balanced"},
    )
    assert resp.status_code == 200
    call_args = mock_db.alternative_scenarios.update_one.call_args
    assert call_args[0][1]["$set"]["selected_scenario_id"] == "balanced"


@pytest.mark.asyncio
async def test_post_select_updates_stage_completed(http_client, mock_db):
    mock_db.alternative_scenarios.update_one = AsyncMock()
    mock_db.planning_contexts.update_one = AsyncMock()
    await http_client.post(
        f"/contexts/{FAKE_CTX_ID}/alternatives",
        json={"scenario_id": "balanced"},
    )
    mock_db.planning_contexts.update_one.assert_called_once()
    call_args = mock_db.planning_contexts.update_one.call_args
    assert call_args[0][1]["$set"]["planning_stages_status.$[el].status"] == "COMPLETED"


@pytest.mark.asyncio
async def test_run_generation_saves_completed(mock_db, monkeypatch):
    from app.routers.alternatives import _run_alternatives_generation

    mock_db.planning_contexts.find_one = AsyncMock(
        return_value={"_id": ObjectId(FAKE_CTX_ID), "portfolio_name": "Test", "planning_horizon": "2026"}
    )
    mock_db.portfolio_constraints.find_one = AsyncMock(return_value=None)
    mock_db.analysis_results.find_one = AsyncMock(return_value=None)
    mock_db.alternative_scenarios.update_one = AsyncMock()

    llm_result = {"scenario": MOCK_SCENARIO}
    monkeypatch.setattr("app.routers.alternatives.get_db", lambda: mock_db)
    monkeypatch.setattr("app.routers.alternatives.llm.chat_json", AsyncMock(return_value=llm_result))
    monkeypatch.setattr("app.routers.alternatives.asyncio.sleep", AsyncMock())

    await _run_alternatives_generation(FAKE_CTX_ID)

    calls = mock_db.alternative_scenarios.update_one.call_args_list
    final_call = calls[-1]
    assert final_call[0][1]["$set"]["status"] == "COMPLETED"
    assert len(final_call[0][1]["$set"]["scenarios"]) == 3


@pytest.mark.asyncio
async def test_run_generation_saves_failed_on_error(mock_db, monkeypatch):
    from app.routers.alternatives import _run_alternatives_generation

    mock_db.planning_contexts.find_one = AsyncMock(
        return_value={"_id": ObjectId(FAKE_CTX_ID), "portfolio_name": "Test", "planning_horizon": "2026"}
    )
    mock_db.portfolio_constraints.find_one = AsyncMock(return_value=None)
    mock_db.analysis_results.find_one = AsyncMock(return_value=None)
    mock_db.alternative_scenarios.update_one = AsyncMock()

    monkeypatch.setattr("app.routers.alternatives.get_db", lambda: mock_db)
    monkeypatch.setattr(
        "app.routers.alternatives.llm.chat_json",
        AsyncMock(side_effect=RuntimeError("LLM недоступен")),
    )
    monkeypatch.setattr("app.routers.alternatives.asyncio.sleep", AsyncMock())

    await _run_alternatives_generation(FAKE_CTX_ID)

    calls = mock_db.alternative_scenarios.update_one.call_args_list
    final_call = calls[-1]
    assert final_call[0][1]["$set"]["status"] == "FAILED"
    assert "LLM недоступен" in final_call[0][1]["$set"]["error"]
