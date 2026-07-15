"""Roadmap 3.31: admin operations overview and audit trail."""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.admin_audit_log import AdminAuditLog
from app.models.assignment_submission import AssignmentSubmission
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.forum import ForumReport
from app.models.order import Order
from app.models.user import User
from app.services import cache

router = APIRouter(prefix="/api/admin/operations", tags=["Admin Operations"])
_ADMIN_ROLES = {"admin", "superadmin"}
_FAILURE_STATUSES = {"failed", "cancelled", "canceled", "error"}


def _admin(email: str = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    if user.role not in _ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Faqat admin uchun")
    return user


def _iso(value):
    return value.isoformat() if value else None


def _system_health(db: Session) -> dict:
    database = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        database = "error"
    return {
        "status": "healthy" if database == "ok" else "degraded",
        "database": database,
        "cache": cache.backend_name(),
        "checked_at": datetime.now(UTC).isoformat(),
    }


@router.get("")
def operations_dashboard(db: Session = Depends(get_db), admin: User = Depends(_admin)):
    now = datetime.now(UTC)
    since_30d = now - timedelta(days=30)
    active_cutoff = now - timedelta(days=14)

    users_total = db.query(User).count()
    new_users = db.query(User).filter(User.created_at >= since_30d).count()
    active_learners = db.query(User).filter(User.is_active.is_(True), User.last_login_date >= active_cutoff).count()
    enrollments_total = db.query(Enrollment).count()
    enrollments_30d = db.query(Enrollment).filter(Enrollment.enrolled_at >= since_30d).count()
    completed = db.query(Enrollment).filter(Enrollment.completed_at.is_not(None)).count()
    completion_rate = round((completed / enrollments_total) * 100, 1) if enrollments_total else 0

    paid_orders = db.query(Order).filter(Order.status == "paid").all()
    revenue = sum(max(0, (order.amount or 0) - (order.discount_amount or 0)) for order in paid_orders)
    failed_query = db.query(Order).filter(func.lower(Order.status).in_(_FAILURE_STATUSES))
    failed_orders = failed_query.order_by(Order.updated_at.desc()).limit(8).all()

    review_query = db.query(AssignmentSubmission).filter(AssignmentSubmission.status == "submitted")
    review_rows = review_query.order_by(AssignmentSubmission.submitted_at.asc()).limit(8).all()
    report_query = db.query(ForumReport).filter(ForumReport.status == "open")
    report_rows = report_query.order_by(ForumReport.created_at.asc()).limit(8).all()

    audits = db.query(AdminAuditLog).order_by(AdminAuditLog.created_at.desc()).limit(12).all()
    return {
        "generated_at": now.isoformat(),
        "users": {"total": users_total, "new_30d": new_users, "active_learners": active_learners},
        "learning": {"enrollments": enrollments_total, "enrollments_30d": enrollments_30d, "completed": completed, "completion_rate": completion_rate},
        "revenue": {"net": revenue, "paid_orders": len(paid_orders), "payment_failures": failed_query.count()},
        "courses": {"total": db.query(Course).count(), "published": db.query(Course).filter(Course.is_active.is_(True)).count()},
        "queues": {
            "review_count": review_query.count(),
            "reviews": [{"id": row.id, "assignment_id": row.assignment_id, "student_id": row.user_id, "submitted_at": _iso(row.submitted_at), "url": f"/instruktor/review/{row.assignment_id}"} for row in review_rows],
            "report_count": report_query.count(),
            "reports": [{"id": row.id, "reason": row.reason, "details": row.details, "thread_id": row.thread_id, "post_id": row.post_id, "created_at": _iso(row.created_at), "url": f"/forum/{row.thread_id}" if row.thread_id else "/forum"} for row in report_rows],
            "payment_failures": [{"id": row.id, "amount": row.amount or 0, "provider": row.provider, "reason": row.failure_reason, "status": row.status, "created_at": _iso(row.created_at)} for row in failed_orders],
        },
        "system": _system_health(db),
        "audit_log": [{"id": row.id, "actor_id": row.actor_id, "action": row.action, "target_type": row.target_type, "target_id": row.target_id, "details": row.details or {}, "created_at": _iso(row.created_at)} for row in audits],
    }


@router.post("/audit", status_code=201)
def record_audit(action: str, target_type: str | None = None, target_id: str | None = None, db: Session = Depends(get_db), admin: User = Depends(_admin)):
    if not action.strip() or len(action) > 100:
        raise HTTPException(status_code=422, detail="Action 1-100 belgi bo‘lishi kerak")
    row = AdminAuditLog(actor_id=admin.id, action=action.strip(), target_type=target_type, target_id=target_id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id, "created_at": _iso(row.created_at)}
