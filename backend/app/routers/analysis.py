from fastapi import APIRouter, Depends

from ..database import get_db
from ..dependencies import get_context_for_user

router = APIRouter(prefix="/contexts", tags=["Analysis"])


@router.get("/{contextId}/analysis")
async def get_analysis(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    doc = await db.analysis_results.find_one({"contextId": str(ctx["_id"])})
    if not doc:
        return {"status": "NOT_STARTED"}
    doc.pop("_id", None)
    return doc
