from fastapi import APIRouter, Depends, HTTPException, status

from ..database import get_db
from ..dependencies import get_context_for_user
from ..models.analysis import AnalysisResponse

router = APIRouter(prefix="/contexts", tags=["Analysis"])


@router.get("/{contextId}/analysis", response_model=AnalysisResponse)
async def get_analysis(ctx: dict = Depends(get_context_for_user)):
    db = get_db()
    doc = await db.analysis_results.find_one({"contextId": str(ctx["_id"])})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Анализ ещё не сформирован")
    return AnalysisResponse(
        status=doc.get("status", "PENDING"),
        dependency_graph=doc.get("dependency_graph"),
        analysis_risks=doc.get("analysis_risks", []),
        timeline_analysis=doc.get("timeline_analysis"),
        resource_analysis=doc.get("resource_analysis", []),
        deviation_analysis=doc.get("deviation_analysis", []),
        ai_explanation=doc.get("ai_explanation"),
        ai_recommendations=doc.get("ai_recommendations", []),
    )
