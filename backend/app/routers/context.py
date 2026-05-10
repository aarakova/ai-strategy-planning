from fastapi import APIRouter, BackgroundTasks, Depends, status

from ..database import get_db
from ..dependencies import get_context_for_user
from ..models.context import ContextSubmitRequest

router = APIRouter(prefix="/contexts", tags=["Context"])


async def _run_analysis(context_id: str) -> None:
    """Background task: mark analysis in progress; replace with GigaChat call."""
    db = get_db()
    await db.analysis_results.update_one(
        {"contextId": context_id},
        {"$set": {"status": "IN_PROGRESS", "contextId": context_id}},
        upsert=True,
    )
    # TODO: call GigaChat API, compute analysis, update document with status=COMPLETED


@router.post("/{contextId}/context", status_code=status.HTTP_202_ACCEPTED)
async def submit_context(
    body: ContextSubmitRequest,
    background_tasks: BackgroundTasks,
    ctx: dict = Depends(get_context_for_user),
):
    db = get_db()
    context_id = str(ctx["_id"])

    await db.strategic_orientations.delete_many({"contextId": context_id})
    await db.projects.delete_many({"contextId": context_id})
    await db.project_dependencies.delete_many({"contextId": context_id})
    await db.portfolio_constraints.delete_many({"contextId": context_id})

    orientations = [o.model_dump(mode="json") | {"contextId": context_id} for o in body.orientations]
    if orientations:
        await db.strategic_orientations.insert_many(orientations)

    projects = [p.model_dump(mode="json") | {"contextId": context_id} for p in body.projects]
    if projects:
        await db.projects.insert_many(projects)

    dependencies = [d.model_dump(mode="json") | {"contextId": context_id} for d in body.dependencies]
    if dependencies:
        await db.project_dependencies.insert_many(dependencies)

    await db.portfolio_constraints.insert_one(
        body.portfolio_constraints.model_dump(mode="json") | {"contextId": context_id}
    )

    await db.planning_contexts.update_one(
        {"_id": ctx["_id"]},
        {"$set": {"planning_stages_status.$[el].status": "COMPLETED"}},
        array_filters=[{"el.stage_name": "Контекст"}],
    )

    background_tasks.add_task(_run_analysis, context_id)
    return {"detail": "Контекст принят, анализ запущен"}
