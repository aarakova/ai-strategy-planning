"""
Тесты для GET /contexts/{contextId}/analysis
"""
from bson import ObjectId

from tests.conftest import FAKE_CTX_ID, MOCK_LLM_RESULT


async def test_returns_not_started_when_no_document(http_client, mock_db):
    """Если документ в analysis_results отсутствует — возвращается NOT_STARTED."""
    mock_db.analysis_results.find_one.return_value = None

    resp = await http_client.get(f"/contexts/{FAKE_CTX_ID}/analysis")

    assert resp.status_code == 200
    assert resp.json() == {"status": "NOT_STARTED"}


async def test_returns_in_progress_status(http_client, mock_db):
    """Если анализ запущен, но ещё не завершён — возвращается IN_PROGRESS."""
    mock_db.analysis_results.find_one.return_value = {
        "_id": ObjectId(),
        "contextId": FAKE_CTX_ID,
        "status": "IN_PROGRESS",
    }

    resp = await http_client.get(f"/contexts/{FAKE_CTX_ID}/analysis")

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "IN_PROGRESS"


async def test_returns_completed_result(http_client, mock_db):
    """Если анализ завершён — возвращаются все секции результата."""
    mock_db.analysis_results.find_one.return_value = {
        "_id": ObjectId(),
        "contextId": FAKE_CTX_ID,
        "status": "COMPLETED",
        **MOCK_LLM_RESULT,
    }

    resp = await http_client.get(f"/contexts/{FAKE_CTX_ID}/analysis")

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "COMPLETED"
    assert len(data["risks"]) == 2
    assert len(data["scheduleAnalysis"]) == 2
    assert len(data["resourceAnalysis"]) == 2
    assert data["aiExplanation"] == MOCK_LLM_RESULT["aiExplanation"]
    assert len(data["recommendations"]) == 1


async def test_strips_mongo_id_from_response(http_client, mock_db):
    """Поле _id из MongoDB не должно попадать в ответ (ObjectId не сериализуется в JSON)."""
    mock_db.analysis_results.find_one.return_value = {
        "_id": ObjectId(),
        "contextId": FAKE_CTX_ID,
        "status": "COMPLETED",
        **MOCK_LLM_RESULT,
    }

    resp = await http_client.get(f"/contexts/{FAKE_CTX_ID}/analysis")

    assert resp.status_code == 200
    assert "_id" not in resp.json()


async def test_returns_failed_with_error_message(http_client, mock_db):
    """Если анализ упал — возвращается FAILED с текстом ошибки."""
    mock_db.analysis_results.find_one.return_value = {
        "_id": ObjectId(),
        "contextId": FAKE_CTX_ID,
        "status": "FAILED",
        "error": "No endpoints found for model",
    }

    resp = await http_client.get(f"/contexts/{FAKE_CTX_ID}/analysis")

    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "FAILED"
    assert "error" in data
