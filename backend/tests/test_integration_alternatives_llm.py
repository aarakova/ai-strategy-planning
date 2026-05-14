# -*- coding: utf-8 -*-
"""
Интеграционные тесты генерации альтернатив с реальным LLM (OpenRouter).

Входные данные соответствуют сценарию из MANUAL_TEST_DATA.md:
  портфель «Цифровая трансформация ИТ-инфраструктуры», 4 проекта,
  3 зависимости, лимит разработчиков занижен → ожидается выявление дефицита.

Требования:
  - OPENROUTER_API_KEY в backend/.env
  - Рабочая модель в OPENROUTER_MODEL

Запуск:
  python -m pytest tests/test_integration_alternatives_llm.py -v -s

Пропустить при обычном прогоне:
  python -m pytest tests/ -v -m "not integration"

Лог ввода/вывода сохраняется в tests/llm_test_log.md.
"""
import asyncio
import json
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import openai
import pytest
from bson import ObjectId

from app import llm
from app.config import settings
from app.routers.alternatives import (
    _SYSTEM_PROMPT_TEMPLATE,
    _build_alternatives_message,
    _run_alternatives_generation,
)
from tests.conftest import FAKE_CTX_ID

pytestmark = pytest.mark.integration

LOG_PATH = Path(__file__).parent / "llm_test_log.md"

# ─── Тестовые данные из MANUAL_TEST_DATA.md ───────────────────────────────────

_CTX = {
    "portfolio_name": "Цифровая трансформация ИТ-инфраструктуры",
    "planning_horizon": "2026-12-31",
}

_ORIENTATIONS = [
    {
        "vision": "Автоматизировать не менее 80% ключевых бизнес-процессов компании к концу 2026 года",
        "priority": "Высокий",
    },
    {
        "vision": "Снизить операционные затраты на 20% за счёт внедрения цифровых инструментов",
        "priority": "Средний",
    },
    {
        "vision": "Обеспечить соответствие всех систем требованиям регулятора по информационной безопасности (ГОСТ Р 57580)",
        "priority": "Высокий",
    },
]

_PROJECTS = [
    {
        "name": "Единая платформа авторизации",
        "status": "В работе",
        "start_date": "2026-01-15",
        "end_date": "2026-06-30",
        "workload": {"analysts": 120, "developers": 320, "testers": 100},
        "constraints": "Необходимо соответствие ГОСТ Р 57580 и интеграция с корпоративным LDAP",
        "deviations": "Отставание от плана на 2 недели из-за позднего согласования требований безопасности",
        "description": "Централизованная система SSO для всех внутренних сервисов",
    },
    {
        "name": "Система электронного документооборота",
        "status": "Не начато",
        "start_date": "2026-04-01",
        "end_date": "2026-10-31",
        "workload": {"analysts": 160, "developers": 400, "testers": 140},
        "constraints": "Интеграция с 1С и SAP; поддержка электронной подписи по ФЗ-63",
        "description": "Полный перевод внутреннего документооборота в цифровой формат",
    },
    {
        "name": "Модуль аналитики и отчётности",
        "status": "Не начато",
        "start_date": "2026-08-01",
        "end_date": "2026-12-31",
        "workload": {"analysts": 240, "developers": 480, "testers": 160},
        "description": "BI-дашборды и автоматическая генерация управленческих отчётов",
    },
    {
        "name": "Интеграционная шина данных",
        "status": "В работе",
        "start_date": "2026-02-01",
        "end_date": "2026-07-31",
        "workload": {"analysts": 80, "developers": 240, "testers": 80},
        "deviations": "Риск задержки поставки лицензий middleware от вендора на 4–6 недель",
        "description": "ESB-шина для обмена данными между всеми системами портфеля",
    },
]

_DEPENDENCIES = [
    {
        "main_project_name": "Единая платформа авторизации",
        "dependent_project_name": "Система электронного документооборота",
    },
    {
        "main_project_name": "Интеграционная шина данных",
        "dependent_project_name": "Модуль аналитики и отчётности",
    },
    {
        "main_project_name": "Система электронного документооборота",
        "dependent_project_name": "Модуль аналитики и отчётности",
    },
]

_CONSTRAINTS = {
    "analysts_limit": 600,
    "developers_limit": 1200,
    "testers_limit": 500,
    "critical_deadline": "2026-12-31",
}

_EXPECTED_PROJECT_NAMES = {p["name"] for p in _PROJECTS}
_VALID_SCENARIO_TYPES = {"BALANCED", "CONSERVATIVE", "RISKY"}
_VALID_RISK_LEVELS = {"high", "medium", "low"}

# ─── Вспомогательные функции ──────────────────────────────────────────────────

def _append_log(section: str, messages: list[dict], result: dict) -> None:
    with LOG_PATH.open("a", encoding="utf-8") as f:
        f.write(f"## {section}\n")
        f.write(f"*{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} · модель: `{settings.openrouter_model}`*\n\n")
        for msg in messages:
            f.write(f"### Вход ({msg['role'].upper()})\n\n```\n{msg['content']}\n```\n\n")
        f.write("### Ответ LLM\n\n")
        f.write(f"```json\n{json.dumps(result, ensure_ascii=False, indent=2)}\n```\n\n")
        f.write("---\n\n")


def _make_cursor(items: list):
    cursor = MagicMock()
    cursor.to_list = AsyncMock(return_value=items)
    return cursor


# ─── Фикстуры ─────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def require_api_key():
    if not settings.openrouter_api_key:
        pytest.skip("OPENROUTER_API_KEY не установлен в backend/.env")


@pytest.fixture(scope="module")
async def cached_scenarios():
    """
    Делает 3 реальных вызова LLM (по одному на тип сценария) за весь модуль.
    Все структурные тесты переиспользуют этот кеш, не расходуя rate limit.
    Записывает вход и выход в tests/llm_test_log.md.
    """
    llm._client = None
    user_msg = _build_alternatives_message(
        _CTX, _ORIENTATIONS, _PROJECTS, _DEPENDENCIES, _CONSTRAINTS, None, []
    )

    scenarios = []
    for i, scenario_type in enumerate(("BALANCED", "CONSERVATIVE", "RISKY")):
        if i > 0:
            await asyncio.sleep(8)
        system = _SYSTEM_PROMPT_TEMPLATE.format(scenario_type=scenario_type)
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ]
        try:
            result = await llm.chat_json(messages)
        except openai.RateLimitError as e:
            pytest.skip(f"OpenRouter rate limit exceeded: {e}")
        _append_log(f"Альтернатива {scenario_type} (cached_scenarios)", messages, result)
        scenario = result.get("scenario")
        if scenario:
            scenarios.append(scenario)

    return scenarios


# ─── Структурные тесты ────────────────────────────────────────────────────────

async def test_all_three_scenarios_generated(cached_scenarios):
    """LLM вернул ровно 3 сценария — по одному на каждый тип."""
    assert len(cached_scenarios) == 3, (
        f"Ожидалось 3 сценария, получено {len(cached_scenarios)}"
    )


async def test_scenario_types_cover_all_variants(cached_scenarios):
    """Типы сценариев покрывают BALANCED, CONSERVATIVE и RISKY."""
    actual_types = {s.get("type") for s in cached_scenarios}
    missing = _VALID_SCENARIO_TYPES - actual_types
    assert not missing, f"Отсутствуют типы сценариев: {missing}"


async def test_each_scenario_has_required_fields(cached_scenarios):
    """Каждый сценарий содержит все обязательные поля."""
    required = {
        "type", "name", "description", "ai_interpretation",
        "total_duration_months", "risk_count",
        "constraint_compliance_percent", "resource_feasibility_percent",
        "strengths", "weaknesses", "total_resources",
        "key_risks", "complied_constraints", "constraints_in_attention", "projects",
    }
    for scenario in cached_scenarios:
        missing = required - scenario.keys()
        assert not missing, (
            f"Сценарий {scenario.get('type')} — отсутствуют поля: {missing}"
        )


async def test_scenario_projects_reference_portfolio_names(cached_scenarios):
    """Каждый сценарий содержит проекты из портфеля MANUAL_TEST_DATA."""
    for scenario in cached_scenarios:
        project_names = {p.get("project_name") for p in scenario.get("projects", [])}
        unknown = project_names - _EXPECTED_PROJECT_NAMES
        assert not unknown, (
            f"Сценарий {scenario.get('type')} содержит неизвестные проекты: {unknown}"
        )
        assert project_names, (
            f"Сценарий {scenario.get('type')} не содержит проектов"
        )


async def test_total_resources_are_positive(cached_scenarios):
    """total_resources содержит положительные числа для всех ролей."""
    for scenario in cached_scenarios:
        res = scenario.get("total_resources", {})
        for role in ("analysts", "developers", "testers"):
            value = res.get(role, 0)
            assert isinstance(value, (int, float)) and value > 0, (
                f"Сценарий {scenario.get('type')}: total_resources.{role} = {value!r}"
            )


async def test_key_risks_have_valid_levels(cached_scenarios):
    """Уровень каждого риска входит в допустимое множество."""
    for scenario in cached_scenarios:
        for risk in scenario.get("key_risks", []):
            assert risk.get("level") in _VALID_RISK_LEVELS, (
                f"Сценарий {scenario.get('type')}: недопустимый level риска: {risk.get('level')!r}"
            )
            assert risk.get("text"), (
                f"Сценарий {scenario.get('type')}: text риска не должен быть пустым"
            )


async def test_duration_months_positive(cached_scenarios):
    """total_duration_months — положительное целое число."""
    for scenario in cached_scenarios:
        months = scenario.get("total_duration_months", 0)
        assert isinstance(months, (int, float)) and months > 0, (
            f"Сценарий {scenario.get('type')}: total_duration_months = {months!r}"
        )


async def test_compliance_percents_in_range(cached_scenarios):
    """constraint_compliance_percent и resource_feasibility_percent в диапазоне 0–100."""
    for scenario in cached_scenarios:
        for field in ("constraint_compliance_percent", "resource_feasibility_percent"):
            value = scenario.get(field, -1)
            assert 0 <= value <= 100, (
                f"Сценарий {scenario.get('type')}: {field} = {value!r} вне диапазона"
            )


async def test_risky_scenario_has_more_risks_than_conservative(cached_scenarios):
    """RISKY содержит больше рисков, чем CONSERVATIVE (ожидаемая логика)."""
    by_type = {s["type"]: s for s in cached_scenarios if "type" in s}
    if "RISKY" in by_type and "CONSERVATIVE" in by_type:
        risky_count = by_type["RISKY"].get("risk_count", 0)
        conservative_count = by_type["CONSERVATIVE"].get("risk_count", 0)
        assert risky_count >= conservative_count, (
            f"RISKY ({risky_count} рисков) должен быть ≥ CONSERVATIVE ({conservative_count} рисков)"
        )


async def test_conservative_compliance_not_lower_than_risky(cached_scenarios):
    """CONSERVATIVE не должен хуже соблюдать ограничения, чем RISKY."""
    by_type = {s["type"]: s for s in cached_scenarios if "type" in s}
    if "CONSERVATIVE" in by_type and "RISKY" in by_type:
        cons = by_type["CONSERVATIVE"].get("constraint_compliance_percent", 0)
        risky = by_type["RISKY"].get("constraint_compliance_percent", 100)
        assert cons >= risky, (
            f"CONSERVATIVE ({cons}%) должен соблюдать ограничения не хуже RISKY ({risky}%)"
        )


# ─── Сквозной тест: _run_alternatives_generation с реальным LLM ───────────────

async def test_run_alternatives_generation_end_to_end(fake_context, monkeypatch):
    """
    _run_alternatives_generation вызывает реальный LLM,
    получает 3 сценария и сохраняет COMPLETED в alternative_scenarios.
    asyncio.sleep замокирован для ускорения теста.
    """
    llm._client = None

    mock_db = MagicMock()
    mock_db.alternative_scenarios.update_one = AsyncMock()
    mock_db.planning_contexts.find_one = AsyncMock(return_value={
        **fake_context,
        "portfolio_name": _CTX["portfolio_name"],
        "planning_horizon": _CTX["planning_horizon"],
    })
    mock_db.planning_contexts.update_one = AsyncMock()
    mock_db.strategic_orientations.find = MagicMock(return_value=_make_cursor(_ORIENTATIONS))
    mock_db.projects.find = MagicMock(return_value=_make_cursor(_PROJECTS))
    mock_db.project_dependencies.find = MagicMock(return_value=_make_cursor(_DEPENDENCIES))
    mock_db.portfolio_constraints.find_one = AsyncMock(return_value=_CONSTRAINTS)
    mock_db.analysis_results.find_one = AsyncMock(return_value=None)
    mock_db.strategic_goals.find = MagicMock(return_value=_make_cursor([]))

    monkeypatch.setattr("app.routers.alternatives.get_db", lambda: mock_db)
    monkeypatch.setattr("app.routers.alternatives.asyncio.sleep", AsyncMock())

    await _run_alternatives_generation(FAKE_CTX_ID)

    calls = mock_db.alternative_scenarios.update_one.call_args_list
    last_set = calls[-1][0][1]["$set"]

    # Лог итогового состояния
    _append_log(
        "Сквозной тест _run_alternatives_generation (end-to-end)",
        [{"role": "system", "content": "(see individual scenario calls above)"},
         {"role": "user", "content": f"portfolio: {_CTX['portfolio_name']}"}],
        {"status": last_set.get("status"), "scenario_count": len(last_set.get("scenarios", []))},
    )

    error_msg = last_set.get("error") or ""
    rate_limit_keywords = ("rate limit", "429", "temporarily rate-limited", "retry shortly")
    if last_set.get("status") == "FAILED" and any(kw in error_msg.lower() for kw in rate_limit_keywords):
        pytest.skip(f"OpenRouter rate limit exceeded: {error_msg}")
    assert last_set["status"] == "COMPLETED", (
        f"Ожидался COMPLETED, получен: {last_set.get('status')}. "
        f"Ошибка: {error_msg}"
    )
    scenarios = last_set.get("scenarios", [])
    assert len(scenarios) >= 1, "Ожидался хотя бы 1 сценарий"
    assert len(scenarios) == 3, f"Ожидалось 3 сценария, получено {len(scenarios)}"
    actual_types = {s.get("type") for s in scenarios}
    assert actual_types == _VALID_SCENARIO_TYPES, (
        f"Типы сценариев не совпадают: {actual_types}"
    )
