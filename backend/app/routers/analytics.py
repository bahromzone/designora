"""Analytics API for instructor/admin dashboards and event tracking."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, StringConstraints
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_optional
from app.models.analytics_event import AnalyticsEvent
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.order import Order
from app.models.qa import LessonQuestion
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


def _iso(value) -> str | None:
    return value.isoformat() if value else None


def _content_alerts(course: Course, enrollments: list[Enrollment], dropout_rate: float) -> list[dict]:
    alerts = []
    lesson_count = course.lessons.count()
    if lesson_count == 0:
        alerts.append({"code": "no_lessons", "severity": "high", "message": "Kursda hali dars yo'q"})
    if not course.description:
        alerts.append({"code": "no_description", "severity": "medium", "message": "Kurs tavsifi to'ldirilmagan"})
    if not course.thumbnail_url:
        alerts.append({"code": "no_thumbnail", "severity": "low", "message": "Kurs muqovasi qo'yilmagan"})
    if course.status == "draft":
        alerts.append({"code": "draft", "severity": "medium", "message": "Kurs qoralama holatida"})
    if (course.rating_count or 0) >= 3 and (course.rating_avg or 0) < 3.5:
        alerts.append({"code": "low_rating", "severity": "high", "message": "Kurs reytingi 3.5 dan past"})
    if len(enrollments) >= 5 and dropout_rate >= 30:
        alerts.append({"code": "dropout", "severity": "high", "message": "Tark etish xavfi 30% dan yuqori"})
    return alerts


@router.get("/instructor")
def instructor_dashboard(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Roadmap 3.19: instructor's operational home, queues and course health."""
    user = _require_instructor(db, email)
    courses = db.query(Course).filter(Course.instructor_id == user.id).order_by(Course.id.desc()).all()
    course_ids = [course.id for course in courses]

    if not course_ids:
        return {
            "courses_count": 0,
            "active_students": 0,
            "pending_submissions": 0,
            "unanswered_questions": 0,
            "content_alerts_count": 0,
            "revenue": analytics_service.revenue_summary([]),
            "completion_rate": 0,
            "average_progress": 0,
            "top_courses": [],
            "per_course": [],
            "queues": {"submissions": [], "questions": [], "content_alerts": []},
        }

    all_orders = db.query(Order).filter(Order.course_id.in_(course_ids)).all()
    all_enrollments = db.query(Enrollment).filter(Enrollment.course_id.in_(course_ids)).all()
    order_payload = [
        {"amount": row.amount, "discount_amount": row.discount_amount, "status": row.status}
        for row in all_orders
    ]
    progress_values = [row.progress_percent or 0 for row in all_enrollments]
    active_students = sum(1 for row in all_enrollments if row.completed_at is None)
    dropout_cutoff = datetime.now(UTC) - timedelta(days=14)

    per_course = []
    all_alerts = []
    for course in courses:
        course_orders = [row for row in all_orders if row.course_id == course.id]
        course_enrollments = [row for row in all_enrollments if row.course_id == course.id]
        at_risk = [
            row
            for row in course_enrollments
            if row.completed_at is None
            and (row.progress_percent or 0) < 20
            and row.enrolled_at
            and row.enrolled_at <= dropout_cutoff
        ]
        dropout_rate = round((len(at_risk) / len(course_enrollments)) * 100, 1) if course_enrollments else 0
        revenue = analytics_service.revenue_summary(
            [
                {"amount": row.amount, "discount_amount": row.discount_amount, "status": row.status}
                for row in course_orders
            ]
        )
        alerts = _content_alerts(course, course_enrollments, dropout_rate)
        for alert in alerts:
            all_alerts.append(
                {
                    **alert,
                    "course_id": course.id,
                    "course_title": course.title,
                    "edit_url": f"/instructor/courses/{course.id}/edit",
                }
            )
        per_course.append(
            {
                "course_id": course.id,
                "title": course.title,
                "status": course.status,
                "students_count": len(course_enrollments),
                "active_students": sum(1 for row in course_enrollments if row.completed_at is None),
                "net_revenue": revenue["net_revenue"],
                "paid_orders": revenue["paid_orders"],
                "completion_rate": analytics_service.completion_rate(
                    [row.progress_percent or 0 for row in course_enrollments]
                ),
                "dropout_rate": dropout_rate,
                "rating_avg": course.rating_avg or 0,
                "alerts_count": len(alerts),
            }
        )

    submissions = (
        db.query(AssignmentSubmission, Assignment, User)
        .join(Assignment, Assignment.id == AssignmentSubmission.assignment_id)
        .join(User, User.id == AssignmentSubmission.user_id)
        .filter(
            Assignment.course_id.in_(course_ids),
            AssignmentSubmission.status == "submitted",
        )
        .order_by(AssignmentSubmission.submitted_at.asc())
        .limit(10)
        .all()
    )
    submission_queue = [
        {
            "submission_id": submission.id,
            "assignment_id": assignment.id,
            "assignment_title": assignment.title or f"Topshiriq #{assignment.id}",
            "course_id": assignment.course_id,
            "course_title": next((c.title for c in courses if c.id == assignment.course_id), ""),
            "student_id": student.id,
            "student_name": student.name or student.email,
            "submitted_at": _iso(submission.submitted_at),
            "review_url": f"/instructor/assignments/{assignment.id}/review",
        }
        for submission, assignment, student in submissions
    ]

    questions = (
        db.query(LessonQuestion)
        .filter(
            LessonQuestion.course_id.in_(course_ids),
            LessonQuestion.is_resolved.is_(False),
        )
        .order_by(LessonQuestion.created_at.asc())
        .all()
    )
    unanswered = [question for question in questions if question.answers.count() == 0]
    question_queue = []
    for question in unanswered[:10]:
        student = db.query(User).filter(User.id == question.user_id).first()
        lesson = db.query(Lesson).filter(Lesson.id == question.lesson_id).first()
        course = next((item for item in courses if item.id == question.course_id), None)
        question_queue.append(
            {
                "question_id": question.id,
                "body": question.body,
                "student_name": (student.name or student.email) if student else "Talaba",
                "course_id": question.course_id,
                "course_title": course.title if course else "",
                "lesson_id": question.lesson_id,
                "lesson_title": lesson.title if lesson else "",
                "created_at": _iso(question.created_at),
                "answer_url": f"/learn/{question.course_id}?lesson={question.lesson_id}&question={question.id}",
            }
        )

    return {
        "courses_count": len(courses),
        "active_students": active_students,
        "pending_submissions": len(submission_queue),
        "unanswered_questions": len(unanswered),
        "content_alerts_count": len(all_alerts),
        "revenue": analytics_service.revenue_summary(order_payload),
        "completion_rate": analytics_service.completion_rate(progress_values),
        "average_progress": analytics_service.average_progress(progress_values),
        "top_courses": analytics_service.top_n(per_course, "net_revenue", 5),
        "per_course": per_course,
        "queues": {
            "submissions": submission_queue,
            "questions": question_queue,
            "content_alerts": all_alerts,
        },
    }


@router.get("/admin")
def admin_dashboard(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_admin(db, email)
    orders = [
        {"amount": row.amount, "discount_amount": row.discount_amount, "status": row.status}
        for row in db.query(Order).all()
    ]
    revenue = analytics_service.revenue_summary(orders)
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active.is_(True)).count()
    total_courses = db.query(Course).count()
    published_courses = db.query(Course).filter(Course.is_active.is_(True)).count()
    total_enrollments = db.query(Enrollment).count()
    since = datetime.now(UTC) - timedelta(days=30)
    new_users_30d = db.query(User).filter(User.created_at >= since).count()
    views = db.query(AnalyticsEvent).filter(AnalyticsEvent.name == "course_view").count()
    funnel_counts = {"course_view": views, "enroll": total_enrollments, "paid": revenue["paid_orders"]}
    top_courses = [
        {"course_id": course.id, "title": course.title, "students_count": course.students_count or 0}
        for course in db.query(Course).order_by(Course.students_count.desc()).limit(5).all()
    ]
    events = [{"name": event.name} for event in db.query(AnalyticsEvent).all()]
    return {
        "revenue": revenue,
        "users": {"total": total_users, "active": active_users, "new_30d": new_users_30d},
        "courses": {"total": total_courses, "published": published_courses},
        "enrollments": total_enrollments,
        "funnel": analytics_service.funnel(funnel_counts),
        "top_courses": top_courses,
        "events": analytics_service.group_events_by_name(events),
    }


class TrackIn(BaseModel):
    name: Annotated[str, StringConstraints(min_length=1, max_length=100)]
    props: dict | None = None
    session_id: str | None = None
    path: str | None = None


@router.post("/track", status_code=201)
def track_event(data: TrackIn, request: Request, db: Session = Depends(get_db)):
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
    _require_admin(db, email)
    events = [{"name": event.name} for event in db.query(AnalyticsEvent).all()]
    return analytics_service.group_events_by_name(events)
