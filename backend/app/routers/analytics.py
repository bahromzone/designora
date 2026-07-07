"""Analytics Router — instruktor/admin dashboard + event tracking (ANALITIKA).

Prefix: /api/analytics

- Instruktor: o'z kurslari bo'yicha daromad, talabalar, tugatish darajasi.
- Admin: platforma KPI'lari, konversiya voronkasi, top kurslar, hodisalar.
- Ommaviy: `POST /track` — frontend'dan xatti-harakat hodisasini yozadi.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, StringConstraints
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_optional
from app.models.analytics_event import AnalyticsEvent
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.user import User
from app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

_ADMIN_ROLES = {"admin", "superadmin"}
_INSTRUCTOR_ROLES = {"instructor", "admin", "superadmin"}


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _require_instructor(db: Session, email: str) -> User:
    user = _get_user(db, email)
    if user.role not in _INSTRUCTOR_ROLES:
        raise HTTPException(status_code=403, detail="Faqat instruktor yoki admin uchun")
    return user


def _require_admin(db: Session, email: str) -> User:
    user = _get_user(db, email)
    if user.role not in _ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Faqat admin uchun")
    return user


# ==========================================================
# INSTRUKTOR DASHBOARD
# ==========================================================
@router.get("/instructor")
def instructor_dashboard(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _require_instructor(db, email)

    courses = db.query(Course).filter(Course.instructor_id == user.id).all()
    course_ids = [c.id for c in courses]

    orders = []
    progresses = []
    if course_ids:
        orders = [
            {
                "amount": o.amount,
                "discount_amount": o.discount_amount,
                "status": o.status,
            }
            for o in db.query(Order).filter(Order.course_id.in_(course_ids)).all()
        ]
        progresses = [
            e.progress_percent
            for e in db.query(Enrollment)
            .filter(Enrollment.course_id.in_(course_ids))
            .all()
        ]

    per_course = []
    for c in courses:
        c_orders = [
            {
                "amount": o.amount,
                "discount_amount": o.discount_amount,
                "status": o.status,
            }
            for o in db.query(Order).filter(Order.course_id == c.id).all()
        ]
        c_progress = [
            e.progress_percent
            for e in db.query(Enrollment).filter(Enrollment.course_id == c.id).all()
        ]
        rev = analytics_service.revenue_summary(c_orders)
        per_course.append(
            {
                "course_id": c.id,
                "title": c.title,
                "students_count": c.students_count or 0,
                "net_revenue": rev["net_revenue"],
                "paid_orders": rev["paid_orders"],
                "completion_rate": analytics_service.completion_rate(c_progress),
                "rating_avg": c.rating_avg or 0,
            }
        )

    return {
        "courses_count": len(courses),
        "revenue": analytics_service.revenue_summary(orders),
        "completion_rate": analytics_service.completion_rate(progresses),
        "average_progress": analytics_service.average_progress(progresses),
        "top_courses": analytics_service.top_n(per_course, "net_revenue", 5),
        "per_course": per_course,
    }


# ==========================================================
# ADMIN DASHBOARD
# ==========================================================
@router.get("/admin")
def admin_dashboard(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(db, email)

    orders = [
        {"amount": o.amount, "discount_amount": o.discount_amount, "status": o.status}
        for o in db.query(Order).all()
    ]
    revenue = analytics_service.revenue_summary(orders)

    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()  # noqa: E712
    total_courses = db.query(Course).count()
    published_courses = (
        db.query(Course).filter(Course.is_active == True).count()  # noqa: E712
    )
    total_enrollments = db.query(Enrollment).count()

    # 30 kunlik yangi foydalanuvchilar
    since = datetime.now(UTC) - timedelta(days=30)
    new_users_30d = db.query(User).filter(User.created_at >= since).count()

    # Konversiya voronkasi: ko'rish → yozilish → to'lov
    views = (
        db.query(AnalyticsEvent).filter(AnalyticsEvent.name == "course_view").count()
    )
    paid_orders = revenue["paid_orders"]
    funnel_counts = {
        "course_view": views,
        "enroll": total_enrollments,
        "paid": paid_orders,
    }

    # Top kurslar (talabalar bo'yicha)
    top_courses = [
        {"course_id": c.id, "title": c.title, "students_count": c.students_count or 0}
        for c in db.query(Course).order_by(Course.students_count.desc()).limit(5).all()
    ]

    # Hodisalar taqsimoti
    events = [{"name": e.name} for e in db.query(AnalyticsEvent).all()]

    return {
        "revenue": revenue,
        "users": {
            "total": total_users,
            "active": active_users,
            "new_30d": new_users_30d,
        },
        "courses": {"total": total_courses, "published": published_courses},
        "enrollments": total_enrollments,
        "funnel": analytics_service.funnel(funnel_counts),
        "top_courses": top_courses,
        "events": analytics_service.group_events_by_name(events),
    }


# ==========================================================
# EVENT TRACKING
# ==========================================================
class TrackIn(BaseModel):
    name: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    props: dict | None = None
    session_id: str | None = None
    path: str | None = None


@router.post("/track", status_code=201)
def track_event(
    data: TrackIn,
    request: Request,
    db: Session = Depends(get_db),
):
    """Xatti-harakat hodisasini yozadi (ochiq — login shart emas).

    Login qilingan bo'lsa user_id biriktiriladi.
    """
    email = get_current_user_optional(request)
    user_id = None
    if email:
        user = db.query(User).filter(User.email == email).first()
        user_id = user.id if user else None

    event = AnalyticsEvent(
        user_id=user_id,
        name=data.name,
        props=data.props,
        session_id=data.session_id,
        path=data.path,
    )
    db.add(event)
    db.commit()
    return {"message": "qabul qilindi", "id": event.id}


@router.get("/events/summary")
def events_summary(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Hodisalar nom bo'yicha taqsimoti (admin)."""
    _require_admin(db, email)
    events = [{"name": e.name} for e in db.query(AnalyticsEvent).all()]
    return analytics_service.group_events_by_name(events)
