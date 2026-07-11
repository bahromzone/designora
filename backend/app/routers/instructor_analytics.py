"""Roadmap 3.21 instructor analytics and CSV export."""

import csv
import io
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.analytics_event import AnalyticsEvent
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.order import Order
from app.models.quiz import Quiz, QuizAttempt
from app.models.review import Review
from app.models.user import User
from app.routers.instructor import require_instructor

router = APIRouter(prefix="/api/instructor/analytics", tags=["Instructor Analytics"])


def _course_ids(db: Session, user: User) -> list[int]:
    return [row.id for row in db.query(Course).filter(Course.instructor_id == user.id).all()]


def _scope(db: Session, user: User, course_id: int | None) -> list[int]:
    ids = _course_ids(db, user)
    if course_id is not None:
        if course_id not in ids and user.role not in {"admin", "superadmin"}:
            raise HTTPException(status_code=403, detail="Bu kurs sizga tegishli emas")
        return [course_id]
    return ids


def _pct(part: int, total: int) -> float:
    return round(part / total * 100, 1) if total else 0.0


@router.get("")
def instructor_analytics(
    course_id: int | None = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    ids = _scope(db, user, course_id)
    if not ids:
        return {"funnel": [], "lessons": [], "quizzes": [], "video_dropoff": [], "assignments": {}, "sentiment": {}, "courses": []}

    courses = db.query(Course).filter(Course.id.in_(ids)).all()
    enrollments = db.query(Enrollment).filter(Enrollment.course_id.in_(ids)).all()
    orders = db.query(Order).filter(Order.course_id.in_(ids), Order.status == "paid").all()
    events = db.query(AnalyticsEvent).all()
    views = sum(1 for event in events if event.name in {"course_view", "course_viewed"} and (event.props or {}).get("course_id") in ids)
    funnel = [
        {"step": "views", "count": views, "conversion": 100.0 if views else 0.0},
        {"step": "enrollments", "count": len(enrollments), "conversion": _pct(len(enrollments), views)},
        {"step": "paid", "count": len(orders), "conversion": _pct(len(orders), len(enrollments))},
        {"step": "completed", "count": sum(1 for row in enrollments if (row.progress_percent or 0) >= 100), "conversion": _pct(sum(1 for row in enrollments if (row.progress_percent or 0) >= 100), len(enrollments))},
    ]

    lessons = db.query(Lesson).filter(Lesson.course_id.in_(ids)).all()
    lesson_rows = []
    for lesson in lessons:
        progress = db.query(LessonProgress).filter(LessonProgress.lesson_id == lesson.id).all()
        lesson_rows.append({
            "lesson_id": lesson.id,
            "title": lesson.title,
            "started": len(progress),
            "completed": sum(1 for row in progress if row.is_completed),
            "completion_rate": _pct(sum(1 for row in progress if row.is_completed), len(progress)),
        })

    quizzes = db.query(Quiz).filter(Quiz.course_id.in_(ids)).all()
    quiz_rows = []
    for quiz in quizzes:
        attempts = db.query(QuizAttempt).filter(QuizAttempt.quiz_id == quiz.id).all()
        average = round(sum(row.score or 0 for row in attempts) / len(attempts), 1) if attempts else 0.0
        quiz_rows.append({"quiz_id": quiz.id, "title": quiz.title, "attempts": len(attempts), "average_score": average, "pass_rate": _pct(sum(1 for row in attempts if row.passed), len(attempts)), "difficulty": "hard" if average < 60 else "medium" if average < 80 else "easy"})

    dropoff = []
    for marker in (25, 50, 75, 100):
        names = {f"video_progress_{marker}", f"video_progress_{marker}%"}
        count = sum(1 for event in events if event.name in names and (event.props or {}).get("course_id") in ids)
        dropoff.append({"percent": marker, "viewers": count})

    assignment_ids = [row.id for row in db.query(Assignment).filter(Assignment.course_id.in_(ids)).all()]
    submissions = db.query(AssignmentSubmission).filter(AssignmentSubmission.assignment_id.in_(assignment_ids)).all() if assignment_ids else []
    assignment_metrics = {
        "submitted": len(submissions),
        "graded": sum(1 for row in submissions if row.status == "graded"),
        "returned": sum(1 for row in submissions if row.status == "returned"),
        "average_grade": round(sum(row.grade or 0 for row in submissions if row.grade is not None) / max(1, sum(1 for row in submissions if row.grade is not None)), 1),
    }

    reviews = db.query(Review).filter(Review.course_id.in_(ids)).all()
    buckets = Counter("positive" if row.rating >= 4 else "neutral" if row.rating == 3 else "negative" for row in reviews)
    sentiment = {"positive": buckets["positive"], "neutral": buckets["neutral"], "negative": buckets["negative"], "average_rating": round(sum(row.rating for row in reviews) / len(reviews), 2) if reviews else 0.0}

    return {
        "courses": [{"id": row.id, "title": row.title} for row in courses],
        "funnel": funnel,
        "lessons": sorted(lesson_rows, key=lambda row: row["completion_rate"]),
        "quizzes": sorted(quiz_rows, key=lambda row: row["average_score"]),
        "video_dropoff": dropoff,
        "assignments": assignment_metrics,
        "sentiment": sentiment,
    }


@router.get("/export.csv")
def export_csv(
    course_id: int | None = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    payload = instructor_analytics(course_id, db, user)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["section", "item", "value", "secondary"])
    for row in payload["funnel"]:
        writer.writerow(["funnel", row["step"], row["count"], row["conversion"]])
    for row in payload["lessons"]:
        writer.writerow(["lesson", row["title"], row["completion_rate"], row["completed"]])
    for row in payload["quizzes"]:
        writer.writerow(["quiz", row["title"], row["average_score"], row["pass_rate"]])
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=instructor-analytics.csv"})
