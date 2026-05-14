import asyncio
import json
import re

from openai import AsyncOpenAI

from .config import settings

_client: AsyncOpenAI | None = None


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
        raise ValueError("LLM вернул пустой ответ (content=None) — возможно, rate limit или content filter")
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if match:
        text = match.group(1).strip()
    return json.loads(text)


async def chat_json(messages: list[dict], model: str | None = None, max_retries: int = 3) -> dict:
    """
    Отправляет запрос к LLM и возвращает ответ как dict.
    При невалидном JSON автоматически повторяет запрос (до max_retries раз).
    """
    last_error: Exception = RuntimeError("Нет попыток")
    for attempt in range(max_retries):
        resp = await get_client().chat.completions.create(
            model=model or settings.openrouter_model,
            messages=messages,
            timeout=120,
        )
        try:
            return _extract_json(resp.choices[0].message.content)
        except (json.JSONDecodeError, ValueError) as e:
            last_error = e
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)  # 1s, 2s между попытками
    raise last_error
