"""Assignments Router: practical work, submissions and structured reviews."""

import json
from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, StringConstraints
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.enrollment import Enrollment
from app.models.user import User
from app.routers.instructor import _is_admin, _owned_course, require_instructor
from app.services.gamification_service import award_points

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])
_REVIEW_PREFIX = "structured-review:"


def _now():
    return datetime.now(UTC)


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _require_enrolled(db: Session, user: User, course_id: int | None) -> None:
    if _is_admin(user) or course_id is None:
        return
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == course_id)
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="Avval kursga yozilishingiz kerak")


class AssignmentIn(BaseModel):
    title: Annotated[str, StringConstraints(min_length=2, max_length=200)]
    description: str | None = None
    lesson_id: int | None = None
    max_score: int | None = 100
    due_date: datetime | None = None


class SubmissionIn(BaseModel):
    content: str | None = None
    file_url: str | None = None


class ImageAnnotationIn(BaseModel):
    x: float = Field(ge=0, le=100)
    y: float = Field(ge=0, le=100)
    note: str = Field(min_length=1, max_length=500)
    color: str = Field(default="#ef4444", max_length=20)


class VideoFeedbackIn(BaseModel):
    seconds: int = Field(ge=0, le=86400)
    note: str = Field(min_length=1, max_length=1000)


class GradeIn(BaseModel):
    grade: int
    feedback: str | None = Field(default=None, max_length=5000)
    decision: Literal["accepted", "rework"] = "accepted"
    annotations: list[ImageAnnotationIn] = Field(default_factory=list, max_length=100)
    video_feedback: list[VideoFeedbackIn] = Field(default_factory=list, max_length=100)


def _assignment_dict(assignment: Assignment) -> dict:
    return {
        "id": assignment.id,
        "course_id": assignment.course_id,
        "lesson_id": assignment.lesson_id,
        "title": assignment.title,
        "description": assignment.description,
        "max_score": assignment.max_score,
        "due_date": assignment.due_date.isoformat() if assignment.due_date else None,
    }


def _review_payload(value: str | None) -> tuple[str | None, dict | None]:
    if not value or not value.startswith(_REVIEW_PREFIX):
        return value, None
    try:
        review = json.loads(value[len(_REVIEW_PREFIX) :])
    except (TypeError, json.JSONDecodeError):
        return value, None
    return review.get("feedback"), review


def _submission_dict(submission: AssignmentSubmission) -> dict:
    feedback, review = _review_payload(submission.feedback)
    return {
        "id": submission.id,
        "assignment_id": submission.assignment_id,
        "user_id": submission.user_id,
        "content": submission.content,
        "file_url": submission.file_url,
        "status": submission.status,
        "grade": submission.grade,
        "feedback": feedback,
        "review": review,
        "submitted_at": (
            submission.submitted_at.isoformat() if submission.submitted_at else None
        ),
        "graded_at": submission.graded_at.isoformat() if submission.graded_at else None,
    }


@router.post("/courses/{course_id}", status_code=201)
def create_assignment(
    course_id: int,
    data: AssignmentIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    _owned_course(db, course_id, user)
    assignment = Assignment(
        user_id=user.id,
        course_id=course_id,
        lesson_id=data.lesson_id,
        title=data.title,
        description=data.description,
        max_score=data.max_score if data.max_score is not None else 100,
        due_date=data.due_date,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return JSONResponse(
        status_code=201,
        content={"message": "Topshiriq yaratildi", "id": assignment.id},
    )


@router.get("/{assignment_id}/submissions")
def list_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Topshiriq topilmadi")
    if assignment.course_id:
        _owned_course(db, assignment.course_id, user)
    submissions = (
        db.query(AssignmentSubmission)
        .filter(AssignmentSubmission.assignment_id == assignment_id)
        .order_by(AssignmentSubmission.submitted_at.desc())
        .all()
    )
    return [_submission_dict(submission) for submission in submissions]


@router.post("/submissions/{submission_id}/grade")
def grade_submission(
    submission_id: int,
    data: GradeIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    submission = (
        db.query(AssignmentSubmission)
        .filter(AssignmentSubmission.id == submission_id)
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Javob topilmadi")
    assignment = (
        db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
    )
    if assignment and assignment.course_id:
        _owned_course(db, assignment.course_id, user)

    max_score = (assignment.max_score if assignment else 100) or 100
    if data.grade < 0 or data.grade > max_score:
        raise HTTPException(
            status_code=400,
            detail=f"Baho 0–{max_score} oralig'ida bo'lishi kerak",
        )

    first_time = submission.status != "graded"
    review = {
        "version": 1,
        "feedback": data.feedback,
        "decision": data.decision,
        "annotations": [item.model_dump() for item in data.annotations],
        "video_feedback": [item.model_dump() for item in data.video_feedback],
    }
    submission.grade = data.grade
    submission.feedback = _REVIEW_PREFIX + json.dumps(review, ensure_ascii=False)
    submission.status = "graded"
    submission.graded_by = user.id
    submission.graded_at = _now()
    db.flush()

    if first_time:
        student = db.query(User).filter(User.id == submission.user_id).first()
        if student:
            award_points(db, student, 20)

    db.commit()
    return {
        "message": "Baholandi",
        "id": submission.id,
        "grade": submission.grade,
        "review": review,
    }


@router.get("/courses/{course_id}")
def list_course_assignments(
    course_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    _require_enrolled(db, user, course_id)
    items = (
        db.query(Assignment)
        .filter(Assignment.course_id == course_id)
        .order_by(Assignment.id.asc())
        .all()
    )
    output = []
    for assignment in items:
        mine = (
            db.query(AssignmentSubmission)
            .filter(
                AssignmentSubmission.assignment_id == assignment.id,
                AssignmentSubmission.user_id == user.id,
            )
            .first()
        )
        row = _assignment_dict(assignment)
        row["my_submission"] = _submission_dict(mine) if mine else None
        output.append(row)
    return output


@router.post("/{assignment_id}/submit")
def submit_assignment(
    assignment_id: int,
    data: SubmissionIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Topshiriq topilmadi")
    _require_enrolled(db, user, assignment.course_id)
    if not (data.content or data.file_url):
        raise HTTPException(status_code=400, detail="Matn yoki fayl talab etiladi")

    submission = (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.assignment_id == assignment.id,
            AssignmentSubmission.user_id == user.id,
        )
        .first()
    )
    if submission and submission.status == "graded":
        raise HTTPException(
            status_code=409,
            detail="Baholangan javobni o'zgartirib bo'lmaydi",
        )
    if not submission:
        submission = AssignmentSubmission(
            assignment_id=assignment.id,
            user_id=user.id,
        )
        db.add(submission)

    submission.content = data.content
    submission.file_url = data.file_url
    submission.status = "submitted"
    submission.submitted_at = _now()
    db.commit()
    db.refresh(submission)
    return {
        "message": "Javob yuborildi",
        "id": submission.id,
        "status": submission.status,
    }


@router.get("/{assignment_id}/my-submission")
def my_submission(
    assignment_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    submission = (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.user_id == user.id,
        )
        .first()
    )
    if not submission:
        raise HTTPException(status_code=404, detail="Javob topilmadi")
    return _submission_dict(submission)
