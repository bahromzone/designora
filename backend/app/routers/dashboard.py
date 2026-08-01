"""Student dashboard aggregate endpoint.

The dashboard is intentionally assembled server-side so the client does not
fan out into one request per course for assignments, notifications, and
learning state.
"""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.Course import Course
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.note import LessonNote
from app.models.notification import Notification
from app.models.user import User
from app.services import gamification_service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _iso(value):
    return value.isoformat() if value else None


def _course_dict(enrollment: Enrollment, course: Course, lessons_count: int) -> dict:
    progress = enrollment.progress_percent or 0
    return {
        "course_id": course.id,
        "title": course.title,
        "subtitle": course.subtitle,
        "category": course.category,
        "thumbnail_url": course.thumbnail_url,
        "level": course.level,
        "progress_percent": progress,
        "is_completed": progress >= 100,
        "enrolled_at": _iso(enrollment.enrolled_at),
        "completed_at": _iso(enrollment.completed_at),
        "lessons_count": lessons_count,
    }


def _submission_dict(submission: AssignmentSubmission | None) -> dict | None:
    if not submission:
        return None
    return {
        "id": submission.id,
        "assignment_id": submission.assignment_id,
        "user_id": submission.user_id,
        "content": submission.content,
        "file_url": submission.file_url,
        "status": submission.status,
        "grade": submission.grade,
        "feedback": submission.feedback,
        "submitted_at": _iso(submission.submitted_at),
        "graded_at": _iso(submission.graded_at),
    }


def _lesson_dict(lesson: Lesson, course: dict) -> dict:
    return {
        "id": lesson.id,
        "title": lesson.title,
        "order": lesson.order or 0,
        "type": lesson.type or "video",
        "duration_seconds": lesson.duration_seconds or 0,
        "is_completed": False,
        "is_locked": False,
        "course": course,
    }


@router.get("")
def student_dashboard(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    enrollments = (
        db.query(Enrollment, Course)
        .join(Course, Enrollment.course_id == Course.id)
        .filter(Enrollment.user_id == user.id)
        .order_by(Enrollment.enrolled_at.desc(), Enrollment.id.desc())
        .all()
    )
    course_ids = [course.id for _, course in enrollments]
    lesson_counts = {}
    if course_ids:
        lesson_counts = dict(
            db.query(Lesson.course_id, func.count(Lesson.id))
            .filter(Lesson.course_id.in_(course_ids))
            .group_by(Lesson.course_id)
            .all()
        )

    courses = [
        _course_dict(enrollment, course, int(lesson_counts.get(course.id, 0)))
        for enrollment, course in enrollments
    ]
    courses_by_id = {course["course_id"]: course for course in courses}
    active_course_ids = [
        course["course_id"] for course in courses if not course["is_completed"]
    ]

    assignments = []
    if active_course_ids:
        rows = (
            db.query(Assignment)
            .filter(Assignment.course_id.in_(active_course_ids))
            .order_by(Assignment.due_date.asc(), Assignment.id.asc())
            .all()
        )
        assignment_ids = [row.id for row in rows]
        submissions = {}
        if assignment_ids:
            submissions = {
                row.assignment_id: row
                for row in db.query(AssignmentSubmission)
                .filter(
                    AssignmentSubmission.user_id == user.id,
                    AssignmentSubmission.assignment_id.in_(assignment_ids),
                )
                .all()
            }
        for assignment in rows:
            assignments.append(
                {
                    "id": assignment.id,
                    "course_id": assignment.course_id,
                    "lesson_id": assignment.lesson_id,
                    "title": assignment.title,
                    "description": assignment.description,
                    "max_score": assignment.max_score,
                    "due_date": _iso(assignment.due_date),
                    "my_submission": _submission_dict(submissions.get(assignment.id)),
                    "course": courses_by_id[assignment.course_id],
                }
            )

    now = datetime.now(UTC)
    due_soon_limit = now + timedelta(days=3)
    open_assignments = [
        item
        for item in assignments
        if item["my_submission"] is None
        or item["my_submission"]["status"] != "graded"
    ]
    overdue = []
    due_soon = []
    for item in open_assignments:
        if not item["due_date"]:
            continue
        due_date = datetime.fromisoformat(item["due_date"])
        if due_date.tzinfo is None:
            due_date = due_date.replace(tzinfo=UTC)
        if due_date < now:
            overdue.append(item)
        elif due_date <= due_soon_limit:
            due_soon.append(item)

    completed_lesson_ids = set()
    if course_ids:
        completed_lesson_ids = {
            row[0]
            for row in db.query(LessonProgress.lesson_id)
            .filter(
                LessonProgress.user_id == user.id,
                LessonProgress.course_id.in_(course_ids),
                LessonProgress.is_completed == True,  # noqa: E712
            )
            .all()
        }
    next_lesson = None
    if active_course_ids:
        lesson_rows = (
            db.query(Lesson)
            .filter(Lesson.course_id.in_(active_course_ids))
            .order_by(Lesson.course_id.asc(), Lesson.order.asc(), Lesson.id.asc())
            .all()
        )
        for lesson in lesson_rows:
            if lesson.id not in completed_lesson_ids:
                next_lesson = _lesson_dict(
                    lesson, courses_by_id[lesson.course_id]
                )
                break

    notifications = [
        {
            "id": row.id,
            "message": row.message,
            "type": row.type,
            "link": row.link,
            "is_read": row.is_read,
            "created_at": _iso(row.created_at),
        }
        for row in (
            db.query(Notification)
            .filter(Notification.user_id == user.id)
            .order_by(Notification.is_read.asc(), Notification.created_at.desc())
            .limit(5)
            .all()
        )
    ]

    recent_note_row = (
        db.query(LessonNote, Lesson)
        .join(Lesson, LessonNote.lesson_id == Lesson.id)
        .filter(LessonNote.user_id == user.id)
        .order_by(LessonNote.updated_at.desc())
        .first()
    )
    recent_note = None
    if recent_note_row:
        note, lesson = recent_note_row
        recent_note = {
            "id": note.id,
            "lesson_id": note.lesson_id,
            "course_id": note.course_id,
            "lesson_title": lesson.title,
            "body": note.body,
            "timestamp_seconds": note.timestamp_seconds or 0,
            "created_at": _iso(note.created_at),
            "updated_at": _iso(note.updated_at),
        }

    points_per_level = gamification_service.POINTS_PER_LEVEL
    points = user.points or 0
    gamification = {
        "points": points,
        "level": user.level or 1,
        "streak_days": user.streak_days or 0,
        "points_to_next_level": points_per_level - (points % points_per_level),
    }
    completed_courses = len(courses) - len(active_course_ids)
    average_progress = (
        round(sum(course["progress_percent"] for course in courses) / len(courses))
        if courses
        else 0
    )
    return {
        "courses": courses,
        "assignments": assignments,
        "notifications": notifications,
        "recent_note": recent_note,
        "gamification": gamification,
        "next_lesson": next_lesson,
        "summary": {
            "active_courses": len(active_course_ids),
            "completed_courses": completed_courses,
            "average_progress": average_progress,
            "open_assignments": len(open_assignments),
            "overdue_assignments": len(overdue),
            "due_soon_assignments": len(due_soon),
            "feedback_count": sum(
                1
                for item in assignments
                if item["my_submission"]
                and item["my_submission"]["status"] == "graded"
            ),
        },
    }
