from pydantic import BaseModel, Field
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.models.session import StudySession
from app.schemas.analytics import AnalyticsOverviewResponse
from app.services.analytics_service import analytics_service
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Learning Analytics"])


class LogSessionRequest(BaseModel):
    subject: Optional[str] = "Belajar Mandiri"
    duration_minutes: int = Field(..., ge=1, le=480)
    activity_type: Optional[str] = "study"
    notes: Optional[str] = None


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return analytics_service.get_user_overview(db, current_user.id)


@router.post("/session")
def log_study_session(
    req: LogSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = StudySession(
        user_id=current_user.id,
        subject=req.subject,
        duration_minutes=req.duration_minutes,
        activity_type=req.activity_type or "study",
        notes=req.notes,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {
        "message": "Sesi belajar berhasil dicatat.",
        "session_id": session.id,
        "duration_minutes": session.duration_minutes,
    }
