"""Roadmap 3.32: report queue, sanctions, appeals and audit trail."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.admin_audit_log import AdminAuditLog
from app.models.moderation import ContentReport, ModerationAction, ModerationAppeal
from app.models.user import User

router = APIRouter(prefix="/api/moderation", tags=["Moderation"])
_MODERATOR_ROLES = {"admin", "superadmin"}
_CONTENT_TYPES = {"forum_thread", "forum_post", "review"}
_ACTIONS = {"dismiss", "hide", "restore", "suspend", "ban"}


def _user(email: str = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _moderator(user: User = Depends(_user)) -> User:
    if user.role not in _MODERATOR_ROLES:
        raise HTTPException(status_code=403, detail="Moderator ruxsati kerak")
    return user


def _iso(value):
    return value.isoformat() if value else None


class ReportIn(BaseModel):
    content_type: str
    content_id: int = Field(gt=0)
    reported_user_id: int | None = None
    reason: str = Field(min_length=3, max_length=100)
    details: str | None = Field(default=None, max_length=2000)


class ActionIn(BaseModel):
    action: str
    reason: str = Field(min_length=3, max_length=200)
    internal_note: str | None = Field(default=None, max_length=2000)


class AppealIn(BaseModel):
    statement: str = Field(min_length=10, max_length=3000)


class AppealDecisionIn(BaseModel):
    status: str
    decision_note: str = Field(min_length=3, max_length=2000)


@router.post("/reports", status_code=201)
def create_report(data: ReportIn, db: Session = Depends(get_db), reporter: User = Depends(_user)):
    if data.content_type not in _CONTENT_TYPES:
        raise HTTPException(status_code=422, detail="Qo‘llanmaydigan content type")
    duplicate = db.query(ContentReport).filter(ContentReport.reporter_id == reporter.id, ContentReport.content_type == data.content_type, ContentReport.content_id == data.content_id, ContentReport.status == "open").first()
    if duplicate:
        return {"id": duplicate.id, "status": duplicate.status, "duplicate": True}
    row = ContentReport(reporter_id=reporter.id, **data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "status": row.status, "duplicate": False}


@router.get("/queue")
def queue(status: str = Query("open"), content_type: str | None = None, db: Session = Depends(get_db), moderator: User = Depends(_moderator)):
    query = db.query(ContentReport).filter(ContentReport.status == status)
    if content_type:
        query = query.filter(ContentReport.content_type == content_type)
    rows = query.order_by(ContentReport.created_at.asc()).limit(100).all()
    return {"total": query.count(), "results": [{"id": row.id, "content_type": row.content_type, "content_id": row.content_id, "reported_user_id": row.reported_user_id, "reason": row.reason, "details": row.details, "priority": row.priority, "status": row.status, "created_at": _iso(row.created_at)} for row in rows]}


@router.post("/reports/{report_id}/action", status_code=201)
def moderate(report_id: int, data: ActionIn, db: Session = Depends(get_db), moderator: User = Depends(_moderator)):
    if data.action not in _ACTIONS:
        raise HTTPException(status_code=422, detail="Noto‘g‘ri moderation action")
    report = db.query(ContentReport).filter(ContentReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report topilmadi")
    target = db.query(User).filter(User.id == report.reported_user_id).first() if report.reported_user_id else None
    if target and target.role == "superadmin" and moderator.role != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin ustida amal bajarib bo‘lmaydi")
    if target and data.action in {"suspend", "ban"}:
        target.is_active = False
    if target and data.action == "restore":
        target.is_active = True
    now = datetime.now(UTC)
    report.status = "dismissed" if data.action == "dismiss" else "resolved"
    report.moderator_id = moderator.id
    report.resolution = data.reason
    report.resolved_at = now
    action = ModerationAction(report_id=report.id, moderator_id=moderator.id, target_user_id=report.reported_user_id, action=data.action, reason=data.reason, internal_note=data.internal_note)
    db.add(action)
    db.flush()
    db.add(AdminAuditLog(actor_id=moderator.id, action=f"moderation.{data.action}", target_type=report.content_type, target_id=str(report.content_id), details={"report_id": report.id, "action_id": action.id, "reason": data.reason}))
    db.commit()
    return {"action_id": action.id, "report_status": report.status}


@router.post("/actions/{action_id}/appeal", status_code=201)
def appeal(action_id: int, data: AppealIn, db: Session = Depends(get_db), user: User = Depends(_user)):
    action = db.query(ModerationAction).filter(ModerationAction.id == action_id).first()
    if not action or action.target_user_id != user.id:
        raise HTTPException(status_code=404, detail="Moderation action topilmadi")
    existing = db.query(ModerationAppeal).filter(ModerationAppeal.action_id == action.id, ModerationAppeal.status == "pending").first()
    if existing:
        return {"id": existing.id, "status": existing.status, "duplicate": True}
    row = ModerationAppeal(action_id=action.id, user_id=user.id, statement=data.statement)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "status": row.status, "duplicate": False}


@router.get("/appeals")
def appeals(db: Session = Depends(get_db), moderator: User = Depends(_moderator)):
    rows = db.query(ModerationAppeal).filter(ModerationAppeal.status == "pending").order_by(ModerationAppeal.created_at.asc()).all()
    return [{"id": row.id, "action_id": row.action_id, "user_id": row.user_id, "statement": row.statement, "status": row.status, "created_at": _iso(row.created_at)} for row in rows]


@router.post("/appeals/{appeal_id}/decision")
def decide_appeal(appeal_id: int, data: AppealDecisionIn, db: Session = Depends(get_db), moderator: User = Depends(_moderator)):
    if data.status not in {"approved", "rejected"}:
        raise HTTPException(status_code=422, detail="Status approved yoki rejected bo‘lishi kerak")
    appeal_row = db.query(ModerationAppeal).filter(ModerationAppeal.id == appeal_id).first()
    if not appeal_row:
        raise HTTPException(status_code=404, detail="Appeal topilmadi")
    appeal_row.status = data.status
    appeal_row.reviewer_id = moderator.id
    appeal_row.decision_note = data.decision_note
    appeal_row.resolved_at = datetime.now(UTC)
    if data.status == "approved":
        action = db.query(ModerationAction).filter(ModerationAction.id == appeal_row.action_id).first()
        target = db.query(User).filter(User.id == action.target_user_id).first() if action else None
        if target:
            target.is_active = True
    db.add(AdminAuditLog(actor_id=moderator.id, action=f"appeal.{data.status}", target_type="moderation_appeal", target_id=str(appeal_row.id), details={"decision_note": data.decision_note}))
    db.commit()
    return {"id": appeal_row.id, "status": appeal_row.status}
