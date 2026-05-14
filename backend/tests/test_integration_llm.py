# -*- coding: utf-8 -*-
"""
Интеграционные тесты — реальные вызовы LLM через OpenRouter.

Требования:
  - OPENROUTER_API_KEY в backend/.env
  - Рабочая модель в OPENROUTER_MODEL

Запуск только интеграционных тестов:
  python -m pytest tests/test_integration_llm.py -v

Пропустить при обычном прогоне:
  python -m pytest tests/ -v -m "not integration"

После прогона смотри лог ввода/вывода LLM:
  tests/llm_test_log.md
"""
import json
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

from app import llm
from app.config import settings
from app.routers.context import _SYSTEM_PROMPT, _build_user_message, _run_analysis
from tests.conftest import FAKE_CTX_ID

pytestmark = pytest.mark.integration

LOG_PATH = Path(__file__).parent / "llm_test_log.md"

# ─── Тестовый портфель ────────────────────────────────────────────────────────

_CTX = {
    "portfolio_name": "Цифровая трансформация",
    "planning_horizon": "2026 год (Q1–Q4)",
}

_ORIENTATIONS = [
    {"vision": "Автоматизировать 80% бизнес-процессов к концу 2026 года", "priority": "Высокий"},
    {"vision": "Снизить операционные затраты на 20%", "priority": "Средний"},
]

_PROJECTS = [
    {
        "name": "Единая платформа авторизации",
        "status": "В работе",
        "start_date": "2026-01-15",
        "end_date": "2026-06-30",
        "workload": {"analysts": 120, "developers": 320, "testers": 100},
        "deviations": "Отставание от плана на 2 недели",
    },
    {
        "name": "Система электронного документооборота",
        "status": "Не начато",
        "start_date": "2026-04-01",
        "end_date": "2026-10-31",
        "workload": {"analysts": 160, "developers": 400, "testers": 140},
        "constraints": "Интеграция с 1С и SAP",
    },
    {
        "name": "Модуль аналитики и отчётности",
        "status": "Не начато",
        "start_date": "2026-08-01",
        "end_date": "2026-12-31",
        "workload": {"analysts": 240, "developers": 480, "testers": 160},
    },
    {
        "name": "Интеграционная шина данных",
        "status": "В работе",
        "start_date": "2026-02-01",
        "end_date": "2026-07-31",
        "workload": {"analysts": 80, "developers": 240, "testers": 80},
        "deviations": "Риск задержки поставки лицензий на 4–6 недель",
    },
]

_DEPENDENCIES = [
    {"main_project_name": "Единая платформа авторизации",         "dependent_project_name": "Система электронного документооборота"},
    {"main_project_name": "Интеграционная шина данных",           "dependent_project_name": "Модуль аналитики и отчётности"},
    {"main_project_name": "Система электронного документооборота", "dependent_project_name": "Модуль аналитики и отчётности"},
]

_CONSTRAINTS = {
    "analysts_limit": 600,
    "developers_limit": 1200,
    "testers_limit": 500,
    "critical_deadline": "2026-12-31",
}

# ─── Вспомогательные функции ──────────────────────────────────────────────────

def _append_log(section: str, messages: list[dict], result: dict) -> None:
    """Дописывает запись о вызове LLM в лог-файл."""
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(f"## {section}  \n")
        f.write(f"*{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} · модель: `{settings.openrouter_model}`*\n\n")

        for msg in messages:
            role = msg["role"].upper()
            content = msg["content"]
            f.write(f"### Вход ({role})\n\n```\n{content}\n```\n\n")

        f.write("### Ответ LLM\n\n")
        f.write(f"```json\n{json.dumps(result, ensure_ascii=False, indent=2)}\n```\n\n")
        f.write("---\n\n")


# ─── Фикстуры ─────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def require_api_key():
    if not settings.openrouter_api_key:
        pytest.skip("OPENROUTER_API_KEY не установлен в backend/.env")


@pytest.fixture(scope="session", autouse=True)
def init_log_file():
    """Создаёт/очищает лог-файл в начале тестовой сессии."""
    LOG_PATH.write_text(
        f"# LLM Test Log\n\n"
        f"Сессия: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n"
        f"Модель: `{settings.openrouter_model}`\n\n"
        f"---\n\n",
        encoding="utf-8",
    )


@pytest.fixture(scope="module")
async def cached_analysis():
    """
    Делает ОДИН вызов LLM на весь модуль.
    Все структурные тесты используют этот общий результат,
    чтобы не превышать rate limit бесплатного тарифа.
    Записывает вход и выход в tests/llm_test_log.md.
    """
    llm._client = None
    user_msg = _build_user_message(_CTX, _ORIENTATIONS, _PROJECTS, _DEPENDENCIES, _CONSTRAINTS)
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user",   "content": user_msg},
    ]
    result = await llm.chat_json(messages)
    _append_log("Анализ портфеля (cached_analysis)", messages, result)
    return result


# ─── Базовая связность ────────────────────────────────────────────────────────

async def test_llm_returns_dict_on_simple_request():
    """LLM отвечает валидным JSON-объектом на простой запрос."""
    llm._client = None
    messages = [{"role": "user", "content": 'Верни JSON объект: {"ok": true, "value": 42}'}]
    result = await llm.chat_json(messages)
    _append_log("Простой запрос (test_llm_returns_dict_on_simple_request)", messages, result)
    assert isinstance(result, dict)


# ─── Структура ответа аналитического промпта ──────────────────────────────────

async def test_analysis_response_contains_all_required_keys(cached_analysis):
    """Ответ содержит все 6 обязательных секций."""
    required = {"risks", "scheduleAnalysis", "resourceAnalysis",
                "deviationAnalysis", "aiExplanation", "recommendations"}
    missing = required - cached_analysis.keys()
    assert not missing, f"Отсутствуют ключи: {missing}"


async def test_risks_have_valid_levels(cached_analysis):
    """Каждый риск имеет level из допустимого множества и непустой текст."""
    valid_levels = {"high", "medium", "low"}
    risks = cached_analysis.get("risks", [])
    assert len(risks) >= 2, "Промпт требует минимум 2 риска"
    for risk in risks:
        assert risk.get("level") in valid_levels, f"Недопустимый level: {risk.get('level')}"
        assert risk.get("text"), "text риска не должен быть пустым"
        assert risk.get("impact"), "impact риска не должен быть пустым"


async def test_resource_analysis_has_valid_statuses(cached_analysis):
    """Каждая роль в resourceAnalysis имеет статус из допустимого множества."""
    valid_statuses = {"ok", "warning", "critical"}
    resources = cached_analysis.get("resourceAnalysis", [])
    assert resources, "resourceAnalysis не должен быть пустым"
    for item in resources:
        assert item.get("status") in valid_statuses, (
            f"Недопустимый status для роли '{item.get('role')}': {item.get('status')}"
        )
        for field in ("role", "demand", "limit", "balance"):
            assert item.get(field), f"Поле '{field}' не должно быть пустым"


async def test_schedule_analysis_has_minimum_items(cached_analysis):
    """scheduleAnalysis содержит минимум 2 пункта."""
    items = cached_analysis.get("scheduleAnalysis", [])
    assert len(items) >= 2, f"Ожидалось ≥2 пунктов, получено {len(items)}"
    for item in items:
        assert isinstance(item, str) and item.strip(), "Каждый пункт — непустая строка"


async def test_ai_explanation_is_non_empty_string(cached_analysis):
    """aiExplanation — непустая строка длиннее 20 символов."""
    explanation = cached_analysis.get("aiExplanation", "")
    assert isinstance(explanation, str) and len(explanation) > 20


async def test_recommendations_have_title_and_text(cached_analysis):
    """Каждая рекомендация содержит непустые title и text."""
    recs = cached_analysis.get("recommendations", [])
    assert len(recs) >= 2, "Промпт требует минимум 2 рекомендации"
    for rec in recs:
        assert rec.get("title"), "title не должен быть пустым"
        assert rec.get("text"),  "text не должен быть пустым"


async def test_deviation_analysis_covers_all_projects(cached_analysis):
    """deviationAnalysis упоминает все проекты из портфеля."""
    deviations = cached_analysis.get("deviationAnalysis", [])
    names_in_response = {d.get("project", "") for d in deviations}
    expected = {p["name"] for p in _PROJECTS}
    missing = expected - names_in_response
    assert not missing, f"Проекты не упомянуты в deviationAnalysis: {missing}"


# ─── Сквозной тест: _run_analysis с реальным LLM + мок БД ────────────────────

def _make_cursor(items: list):
    cursor = MagicMock()
    cursor.to_list = AsyncMock(return_value=items)
    return cursor


async def test_run_analysis_end_to_end(fake_context, monkeypatch):
    """
    _run_analysis вызывает реальный LLM, получает корректный ответ
    и сохраняет COMPLETED в analysis_results.
    Записывает вход и выход в tests/llm_test_log.md.
    """
    llm._client = None

    mock_db = MagicMock()
    mock_db.analysis_results.update_one = AsyncMock()
    mock_db.planning_contexts.find_one = AsyncMock(return_value=fake_context)
    mock_db.planning_contexts.update_one = AsyncMock()
    mock_db.strategic_orientations.find = MagicMock(return_value=_make_cursor(_ORIENTATIONS))
    mock_db.projects.find = MagicMock(return_value=_make_cursor(_PROJECTS))
    mock_db.project_dependencies.find = MagicMock(return_value=_make_cursor(_DEPENDENCIES))
    mock_db.portfolio_constraints.find_one = AsyncMock(return_value=_CONSTRAINTS)

    monkeypatch.setattr("app.routers.context.get_db", lambda: mock_db)

    await _run_analysis(FAKE_CTX_ID)

    calls = mock_db.analysis_results.update_one.call_args_list
    last_set = calls[-1][0][1]["$set"]

    # Логируем что сохранилось в БД
    user_msg = _build_user_message(fake_context, _ORIENTATIONS, _PROJECTS, _DEPENDENCIES, _CONSTRAINTS)
    _append_log(
        "Сквозной тест _run_analysis (test_run_analysis_end_to_end)",
        [{"role": "system", "content": _SYSTEM_PROMPT}, {"role": "user", "content": user_msg}],
        {k: v for k, v in last_set.items() if k != "status"},
    )

    assert last_set["status"] == "COMPLETED", (
        f"Ожидался COMPLETED, получен: {last_set.get('status')}. "
        f"Ошибка: {last_set.get('error')}"
    )
    assert "risks" in last_set
    assert "aiExplanation" in last_set
