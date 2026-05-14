import json

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException

from .. import llm
from ..database import get_db
from ..dependencies import get_context_for_user
from ..models.goals import GoalsSubmitRequest

router = APIRouter(prefix="/contexts", tags=["Goals"])

_SYSTEM_PROMPT = """\
Ты — эксперт по стратегическому планированию. Сформируй ровно 3 стратегических цели по методике SMART для портфеля проектов.

Верни ТОЛЬКО валидный JSON без пояснений, точно по схеме:
{"ai_suggestions":[{"specific":"<1 предложение>","kpi_name":"<название KPI>","kpi_target_value":0.0,"kpi_unit":"<единица>","achievable":"<1-2 предложения>","timebound":"YYYY-MM-DD","priority":"Высокий|Средний|Низкий","orientation_ids":[],"project_names":["<точное название>"],"orientation_explanation":"<1 предложение>","context":"AI_SUGGESTED","ai_explanation":"<1 предложение>","project_coverage":{"degree":"Сильное|Умеренное|Слабое","explanation":"<1 предложение>"},"realism_check":{"degree":"Высокая|Средняя|Низкая","score":75,"issues":[]}}]}

Правила:
- Ровно 3 цели, охватывающих разные аспекты стратегии
- project_names: точные названия проектов из входных данных
- timebound: "YYYY-MM-DD", в пределах горизонта планирования
- Все тексты на русском языке; каждое текстовое поле — не более 2 предложений
- orientation_ids: всегда пустой массив []
"""


def _build_suggestions_message(ctx: dict, orientations: list, projects: list, analysis: dict | None) -> str:
    lines = [
        f"Портфель: {ctx.get('portfolio_name', '')}",
        f"Горизонт: {ctx.get('planning_horizon', '')}",
        "",
        "Стратегические ориентиры:",
        json.dumps(
            [{"vision": o.get("vision", ""), "priority": o.get("priority", "")} for o in orientations],
            ensure_ascii=False,
        ),
        "",
        "Проекты:",
        json.dumps(
            [{"name": p.get("name", ""), "status": p.get("status", ""),
              "start_date": str(p.get("start_date", "")), "end_date": str(p.get("end_date", ""))}
             for p in projects],
            ensure_ascii=False,
        ),
    ]

    if analysis and analysis.get("status") == "COMPLETED":
        risks = [r.get("text", str(r))[:120] for r in analysis.get("risks", [])[:3]]
        recs = [r.get("text", r.get("title", str(r)))[:120] for r in analysis.get("recommendations", [])[:3]]
        lines += [
            "",
            f"Ключевые риски: {'; '.join(risks) or 'нет'}",
            f"Рекомендации: {'; '.join(recs) or 'нет'}",
        ]
    else:
        lines.append("Результаты анализа: нет")

    lines.append("")
    lines.append("Сформируй 3–5 SMART-целей для этого портфеля.")
    return "\n".join(lines)


def _doc_to_dict(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "specific": doc["specific"],
        "kpi_name": doc["kpi_name"],
        "kpi_target_value": doc["kpi_target_value"],
        "kpi_unit": doc["kpi_unit"],
        "achievable": doc["achievable"],
        "timebound": str(doc["timebound"]),
        "priority": doc["priority"],
        "orientation_ids": doc.get("orientation_ids", []),
        "project_names": doc.get("project_names", []),
        "orientation_explanation": doc.get("orientation_explanation"),
        "context": doc.get("context", "USER_CREATED"),
        "ai_explanation": doc.get("ai_explanation"),
        "project_coverage": doc.get("project_coverage"),
        "realism_check": doc.get("realism_check"),
    }


@router.get("/{contextId}/goals")
async def get_goals(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    docs = await db.strategic_goals.find(
        {"contextId": str(ctx["_id"]), "context": "USER_CREATED"}
    ).to_list(length=200)
    return {"goals": [_doc_to_dict(d) for d in docs]}


@router.post("/{contextId}/goals")
async def submit_goals(body: GoalsSubmitRequest, ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    context_id = str(ctx["_id"])

    await db.strategic_goals.delete_many({"contextId": context_id, "context": "USER_CREATED"})

    docs = [g.model_dump(mode="json") | {"contextId": context_id, "context": "USER_CREATED"} for g in body.goals]
    inserted = []
    if docs:
        result = await db.strategic_goals.insert_many(docs)
        inserted = await db.strategic_goals.find({"_id": {"$in": result.inserted_ids}}).to_list(length=200)

    await db.planning_contexts.update_one(
        {"_id": ctx["_id"]},
        {"$set": {"planning_stages_status.$[el].status": "COMPLETED"}},
        array_filters=[{"el.stage_name": "Цели"}],
    )
    return {"goals": [_doc_to_dict(d) for d in inserted]}


@router.get("/{contextId}/goals/suggestions")
async def get_goal_suggestions(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    context_id = str(ctx["_id"])

    orientations = await db.strategic_orientations.find({"contextId": context_id}).to_list(50)
    projects = await db.projects.find({"contextId": context_id}).to_list(100)
    analysis = await db.analysis_results.find_one({"contextId": context_id})

    user_msg = _build_suggestions_message(ctx, orientations, projects, analysis)
    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": user_msg},
    ]

    try:
        result = await llm.chat_json(messages)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ошибка LLM: {e}")

    suggestions = result.get("ai_suggestions", [])
    for s in suggestions:
        s.setdefault("orientation_ids", [])
        s.setdefault("project_names", [])
        s["context"] = "AI_SUGGESTED"

    return {"ai_suggestions": suggestions}
