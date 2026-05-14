"""
Тесты для POST /contexts/{contextId}/context
"""
from tests.conftest import FAKE_CTX_ID, VALID_SUBMIT_BODY


async def test_returns_202_accepted(http_client):
    resp = await http_client.post(f"/contexts/{FAKE_CTX_ID}/context", json=VALID_SUBMIT_BODY)
    assert resp.status_code == 202


async def test_clears_old_data_before_save(http_client, mock_db):
    """Перед записью старые данные должны удаляться из всех коллекций."""
    await http_client.post(f"/contexts/{FAKE_CTX_ID}/context", json=VALID_SUBMIT_BODY)

    mock_db.strategic_orientations.delete_many.assert_called_once_with({"contextId": FAKE_CTX_ID})
    mock_db.projects.delete_many.assert_called_once_with({"contextId": FAKE_CTX_ID})
    mock_db.project_dependencies.delete_many.assert_called_once_with({"contextId": FAKE_CTX_ID})
    mock_db.portfolio_constraints.delete_many.assert_called_once_with({"contextId": FAKE_CTX_ID})


async def test_saves_orientations(http_client, mock_db):
    """Стратегические ориентиры должны сохраняться в коллекцию."""
    await http_client.post(f"/contexts/{FAKE_CTX_ID}/context", json=VALID_SUBMIT_BODY)

    mock_db.strategic_orientations.insert_many.assert_called_once()
    inserted = mock_db.strategic_orientations.insert_many.call_args[0][0]
    assert len(inserted) == 1
    assert inserted[0]["vision"] == "Автоматизация процессов"
    assert inserted[0]["contextId"] == FAKE_CTX_ID


async def test_saves_projects(http_client, mock_db):
    """Проекты должны сохраняться в коллекцию с привязкой к контексту."""
    await http_client.post(f"/contexts/{FAKE_CTX_ID}/context", json=VALID_SUBMIT_BODY)

    mock_db.projects.insert_many.assert_called_once()
    inserted = mock_db.projects.insert_many.call_args[0][0]
    assert inserted[0]["name"] == "Проект A"
    assert inserted[0]["contextId"] == FAKE_CTX_ID


async def test_saves_portfolio_constraints(http_client, mock_db):
    """Портфельные ограничения должны сохраняться."""
    await http_client.post(f"/contexts/{FAKE_CTX_ID}/context", json=VALID_SUBMIT_BODY)

    mock_db.portfolio_constraints.insert_one.assert_called_once()
    inserted = mock_db.portfolio_constraints.insert_one.call_args[0][0]
    assert inserted["analysts_limit"] == 600
    assert inserted["contextId"] == FAKE_CTX_ID


async def test_marks_context_stage_completed(http_client, mock_db):
    """Этап 'Контекст' в planning_contexts должен стать COMPLETED."""
    await http_client.post(f"/contexts/{FAKE_CTX_ID}/context", json=VALID_SUBMIT_BODY)

    mock_db.planning_contexts.update_one.assert_called_once()
    update_call = mock_db.planning_contexts.update_one.call_args
    set_doc = update_call[0][1]["$set"]
    assert set_doc["planning_stages_status.$[el].status"] == "COMPLETED"


async def test_returns_422_without_orientations(http_client):
    """Запрос без ориентиров (пустой список) должен вернуть 422."""
    body = {**VALID_SUBMIT_BODY, "orientations": []}
    resp = await http_client.post(f"/contexts/{FAKE_CTX_ID}/context", json=body)
    assert resp.status_code == 422


async def test_returns_422_without_projects(http_client):
    """Запрос без проектов должен вернуть 422."""
    body = {**VALID_SUBMIT_BODY, "projects": []}
    resp = await http_client.post(f"/contexts/{FAKE_CTX_ID}/context", json=body)
    assert resp.status_code == 422
