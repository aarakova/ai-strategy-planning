import asyncio
import json
import logging
import re

import openai
from openai import AsyncOpenAI

from .config import settings

_client: AsyncOpenAI | None = None
_log = logging.getLogger(__name__)


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
        )
    return _client


def _extract_json(text: str | None) -> dict:
    """Извлекает JSON из ответа, в т.ч. если он обёрнут в ```json ... ``` блок."""
    if text is None:
        raise ValueError("LLM вернул content=None (rate limit или content filter)")
    text = text.strip()
    if not text:
        raise ValueError("LLM вернул пустую строку (rate limit или content filter)")
    # Попытка 1: блок с закрывающими бэктиками
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if match:
        return json.loads(match.group(1).strip())
    # Попытка 2: блок без закрывающих бэктиков (обрезанный ответ)
    match = re.search(r"```(?:json)?\s*([\s\S]+)", text)
    if match:
        return json.loads(match.group(1).strip())
    return json.loads(text)


# Задержки между попытками: 5s, 15s, 30s
_RETRY_DELAYS = [5, 15, 30]


async def chat_json(messages: list[dict], model: str | None = None, max_retries: int = 3) -> dict:
    """
    Отправляет запрос к LLM и возвращает ответ как dict.
    При невалидном JSON или пустом ответе повторяет запрос (до max_retries раз).
    """
    last_error: Exception = RuntimeError("Нет попыток")
    for attempt in range(max_retries):
        try:
            resp = await get_client().chat.completions.create(
                model=model or settings.openrouter_model,
                messages=messages,
                max_tokens=8192,
                timeout=120,
            )
        except openai.RateLimitError as e:
            err_str = str(e).lower()
            # Daily/permanent limits cannot be resolved by retrying
            if "per-day" in err_str or "credits" in err_str or "per_day" in err_str:
                raise
            last_error = e
            _log.warning("Rate limit (попытка %d/%d): %s", attempt + 1, max_retries, e)
            if attempt < max_retries - 1:
                delay = _RETRY_DELAYS[min(attempt, len(_RETRY_DELAYS) - 1)]
                _log.info("Ожидание %d с перед следующей попыткой...", delay)
                await asyncio.sleep(delay)
            continue
        raw = resp.choices[0].message.content if resp.choices else None
        try:
            return _extract_json(raw)
        except (json.JSONDecodeError, ValueError) as e:
            last_error = e
            _log.warning(
                "Попытка %d/%d: не удалось разобрать ответ LLM. "
                "Ошибка: %s. Первые 200 символов ответа: %r",
                attempt + 1, max_retries, e,
                (raw or "")[:200],
            )
            if attempt < max_retries - 1:
                delay = _RETRY_DELAYS[min(attempt, len(_RETRY_DELAYS) - 1)]
                _log.info("Ожидание %d с перед следующей попыткой...", delay)
                await asyncio.sleep(delay)
    raise last_error
