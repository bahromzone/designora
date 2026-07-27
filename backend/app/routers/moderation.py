from datetime import UTC, datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.moderation_report import ModerationReport
from app.models.user import User

router = APIRouter(prefix="/api", tags=["Moderation"])
class ReportIn(BaseModel):
    content_type: str
    content_id: int
    reason: str
class ReviewIn(BaseModel):
    status: str

def current_user(email: str = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user: raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user

def admin(user: User = Depends(current_user)) -> User:
    if not user.is_active or user.role not in {"admin", "superadmin"}: raise HTTPException(status_code=403, detail="Faqat adminlar uchun")
    return user

@router.post("/moderation/reports", status_code=201)
def report(data: ReportIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    row = ModerationReport(reporter_id=user.id, content_type=data.content_type, content_id=data.content_id, reason=data.reason)
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, "status": row.status}

@router.get("/admin/moderation")
def queue(status: str = "open", db: Session = Depends(get_db), _: User = Depends(admin)):
    rows = db.query(ModerationReport).filter(ModerationReport.status == status).order_by(ModerationReport.created_at.asc()).all()
    return [{"id": row.id, "reporter_id": row.reporter_id, "content_type": row.content_type, "content_id": row.content_id, "reason": row.reason, "status": row.status, "created_at": row.created_at.isoformat() if row.created_at else None} for row in rows]

@router.patch("/admin/moderation/{report_id}")
def review(report_id: int, data: ReviewIn, db: Session = Depends(get_db), reviewer: User = Depends(admin)):
    if data.status not in {"resolved", "dismissed"}: raise HTTPException(status_code=400, detail="Status resolved yoki dismissed bo'lishi kerak")
    row = db.query(ModerationReport).filter(ModerationReport.id == report_id).first()
    if not row: raise HTTPException(status_code=404, detail="Report topilmadi")
    row.status = data.status; row.reviewed_by_id = reviewer.id; db.commit()
    return {"id": row.id, "status": row.status}
