"""Roadmap 3.33: audited support console without impersonation."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.admin_audit_log import AdminAuditLog
from app.models.analytics_event import AnalyticsEvent
from app.models.certificate import Certificate
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.notification import Notification
from app.models.order import Order
from app.models.user import User
from app.services import certificate_service

router = APIRouter(prefix="/api/support", tags=["Support"])
_SUPPORT_ROLES = {"admin", "superadmin"}


def _operator(email: str = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    if user.role not in _SUPPORT_ROLES:
        raise HTTPException(status_code=403, detail="Support ruxsati kerak")
    return user


def _iso(value):
    return value.isoformat() if value else None


def _audit(db, operator, action, target_id, details=None):
    db.add(AdminAuditLog(actor_id=operator.id, action=action, target_type="user", target_id=str(target_id), details=details or {}))


@router.get("/users/search")
def search_users(q: str = Query(min_length=2, max_length=100), db: Session = Depends(get_db), operator: User = Depends(_operator)):
    pattern = f"%{q.strip()}%"
    rows = db.query(User).filter((User.email.ilike(pattern)) | (User.name.ilike(pattern))).order_by(User.id.desc()).limit(20).all()
    return [{"id": row.id, "name": row.name, "email": row.email, "role": row.role, "is_active": row.is_active, "created_at": _iso(row.created_at)} for row in rows]


@router.get("/users/{user_id}")
def user_workspace(user_id: int, db: Session = Depends(get_db), operator: User = Depends(_operator)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    enrollments = db.query(Enrollment).filter(Enrollment.user_id == user.id).order_by(Enrollment.enrolled_at.desc()).all()
    orders = db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).limit(25).all()
    certificates = db.query(Certificate).filter(Certificate.user_id == user.id).order_by(Certificate.issued_at.desc()).all()
    notifications = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(20).all()
    events = db.query(AnalyticsEvent).filter(AnalyticsEvent.user_id == user.id).order_by(AnalyticsEvent.created_at.desc()).limit(50).all()
    course_ids = {row.course_id for row in enrollments if row.course_id} | {row.course_id for row in orders if row.course_id}
    courses = {row.id: row.title for row in db.query(Course).filter(Course.id.in_(course_ids)).all()} if course_ids else {}
    timeline = [{"type": "event", "label": row.name, "at": _iso(row.created_at), "meta": row.props or {}, "path": row.path} for row in events]
    timeline += [{"type": "enrollment", "label": f"Enrollment: {courses.get(row.course_id, row.course_id)}", "at": _iso(row.enrolled_at), "meta": {"progress": row.progress_percent or 0}} for row in enrollments]
    timeline += [{"type": "payment", "label": f"Payment {row.status}", "at": _iso(row.created_at), "meta": {"order_id": row.id, "amount": row.amount or 0, "provider": row.provider}} for row in orders]
    timeline.sort(key=lambda item: item["at"] or "", reverse=True)
    _audit(db, operator, "support.user_viewed", user.id)
    db.commit()
    return {
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "is_active": user.is_active, "created_at": _iso(user.created_at), "last_login": _iso(user.last_login_date)},
        "enrollments": [{"id": row.id, "course_id": row.course_id, "course_title": courses.get(row.course_id), "progress": row.progress_percent or 0, "completed_at": _iso(row.completed_at), "enrolled_at": _iso(row.enrolled_at)} for row in enrollments],
        "orders": [{"id": row.id, "course_id": row.course_id, "course_title": courses.get(row.course_id), "amount": row.amount or 0, "status": row.status, "provider": row.provider, "failure_reason": row.failure_reason, "refund_status": row.refund_status, "created_at": _iso(row.created_at)} for row in orders],
        "certificates": [{"id": row.id, "course_id": row.course_id, "title": row.title, "serial": row.serial, "verification_code": row.verification_code, "pdf_url": row.pdf_url, "issued_at": _iso(row.issued_at)} for row in certificates],
        "notifications": [{"id": row.id, "message": row.message, "type": row.type, "link": row.link, "is_read": row.is_read, "created_at": _iso(row.created_at)} for row in notifications],
        "timeline": timeline[:100],
        "safe_view": {"enabled": True, "mode": "read_only", "impersonation": False, "notice": "Bu foydalanuvchining support snapshot’i. Uning sessiyasiga kirmaysiz."},
    }


@router.post("/users/{user_id}/certificates/{certificate_id}/regenerate")
def regenerate_certificate(user_id: int, certificate_id: int, db: Session = Depends(get_db), operator: User = Depends(_operator)):
    cert = db.query(Certificate).filter(Certificate.id == certificate_id, Certificate.user_id == user_id).first()
    if not cert:
        raise HTTPException(status_code=404, detail="Sertifikat topilmadi")
    user = db.query(User).filter(User.id == user_id).first()
    course = db.query(Course).filter(Course.id == cert.course_id).first()
    verify_url = f"{settings.FRONTEND_URL.rstrip('/')}/verify/{cert.verification_code}"
    try:
        cert.pdf_url = certificate_service.generate_certificate_pdf(verification_code=cert.verification_code, serial=cert.serial, student_name=(user.name or user.email), course_title=(course.title if course else cert.title), issued_at=cert.issued_at or datetime.now(UTC), grade=cert.grade or "Bitirildi", verify_url=verify_url)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    _audit(db, operator, "support.certificate_regenerated", user_id, {"certificate_id": cert.id})
    db.commit()
    return {"id": cert.id, "pdf_url": cert.pdf_url, "verification_code": cert.verification_code}


@router.post("/users/{user_id}/notifications/{notification_id}/resend", status_code=201)
def resend_notification(user_id: int, notification_id: int, db: Session = Depends(get_db), operator: User = Depends(_operator)):
    source = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Bildirishnoma topilmadi")
    copy = Notification(user_id=user_id, message=source.message, type=source.type, link=source.link, is_read=False)
    db.add(copy)
    db.flush()
    _audit(db, operator, "support.notification_resent", user_id, {"source_notification_id": source.id, "new_notification_id": copy.id})
    db.commit()
    return {"id": copy.id, "message": "Bildirishnoma qayta yuborildi"}
