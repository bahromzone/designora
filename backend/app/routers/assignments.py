"""Assignments Router — amaliy topshiriqlar + baholash (BOSQICH 3).

Prefix: /api/assignments

- Instruktor: topshiriq yaratish, javoblarni ko'rish va baholash
- Talaba: topshiriqni ko'rish, javob yuborish
"""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, StringConstraints
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
    enr = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == course_id)
        .first()
    )
    if not enr:
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


class GradeIn(BaseModel):
    grade: int
    feedback: str | None = None


def _assignment_dict(a: Assignment) -> dict:
    return {
        "id": a.id,
        "course_id": a.course_id,
        "lesson_id": a.lesson_id,
        "title": a.title,
        "description": a.description,
        "max_score": a.max_score,
        "due_date": a.due_date.isoformat() if a.due_date else None,
    }


def _submission_dict(s: AssignmentSubmission) -> dict:
    return {
        "id": s.id,
        "assignment_id": s.assignment_id,
        "user_id": s.user_id,
        "content": s.content,
        "file_url": s.file_url,
        "status": s.status,
        "grade": s.grade,
        "feedback": s.feedback,
        "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
        "graded_at": s.graded_at.isoformat() if s.graded_at else None,
    }


# ==========================================================
# INSTRUKTOR
# ==========================================================
@router.post("/courses/{course_id}", status_code=201)
def create_assignment(
    course_id: int,
    data: AssignmentIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    _owned_course(db, course_id, user)
    a = Assignment(
        user_id=user.id,  # yaratuvchi (instruktor)
        course_id=course_id,
        lesson_id=data.lesson_id,
        title=data.title,
        description=data.description,
        max_score=data.max_score if data.max_score is not None else 100,
        due_date=data.due_date,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return JSONResponse(
        status_code=201, content={"message": "Topshiriq yaratildi", "id": a.id}
    )


@router.get("/{assignment_id}/submissions")
def list_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    a = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Topshiriq topilmadi")
    if a.course_id:
        _owned_course(db, a.course_id, user)
    subs = (
        db.query(AssignmentSubmission)
        .filter(AssignmentSubmission.assignment_id == assignment_id)
        .order_by(AssignmentSubmission.submitted_at.desc())
        .all()
    )
    return [_submission_dict(s) for s in subs]


@router.post("/submissions/{submission_id}/grade")
def grade_submission(
    submission_id: int,
    data: GradeIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    sub = (
        db.query(AssignmentSubmission)
        .filter(AssignmentSubmission.id == submission_id)
        .first()
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Javob topilmadi")
    assignment = db.query(Assignment).filter(Assignment.id == sub.assignment_id).first()
    if assignment and assignment.course_id:
        _owned_course(db, assignment.course_id, user)

    max_score = (assignment.max_score if assignment else 100) or 100
    if data.grade < 0 or data.grade > max_score:
        raise HTTPException(
            status_code=400, detail=f"Baho 0–{max_score} oralig'ida bo'lishi kerak"
        )

    first_time = sub.status != "graded"
    sub.grade = data.grade
    sub.feedback = data.feedback
    sub.status = "graded"
    sub.graded_by = user.id
    sub.graded_at = _now()
    db.flush()

    # Talabaga birinchi baholashda ball beramiz
    if first_time:
        student = db.query(User).filter(User.id == sub.user_id).first()
        if student:
            award_points(db, student, 20)

    db.commit()
    return {"message": "Baholandi", "id": sub.id, "grade": sub.grade}


# ==========================================================
# TALABA
# ==========================================================
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
    out = []
    for a in items:
        mine = (
            db.query(AssignmentSubmission)
            .filter(
                AssignmentSubmission.assignment_id == a.id,
                AssignmentSubmission.user_id == user.id,
            )
            .first()
        )
        d = _assignment_dict(a)
        d["my_submission"] = _submission_dict(mine) if mine else None
        out.append(d)
    return out


@router.post("/{assignment_id}/submit")
def submit_assignment(
    assignment_id: int,
    data: SubmissionIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    a = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Topshiriq topilmadi")
    _require_enrolled(db, user, a.course_id)

    if not (data.content or data.file_url):
        raise HTTPException(status_code=400, detail="Matn yoki fayl talab etiladi")

    sub = (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.assignment_id == a.id,
            AssignmentSubmission.user_id == user.id,
        )
        .first()
    )
    if sub and sub.status == "graded":
        raise HTTPException(
            status_code=409, detail="Baholangan javobni o'zgartirib bo'lmaydi"
        )

    if not sub:
        sub = AssignmentSubmission(assignment_id=a.id, user_id=user.id)
        db.add(sub)

    sub.content = data.content
    sub.file_url = data.file_url
    sub.status = "submitted"
    sub.submitted_at = _now()
    db.commit()
    db.refresh(sub)
    return {"message": "Javob yuborildi", "id": sub.id, "status": sub.status}


@router.get("/{assignment_id}/my-submission")
def my_submission(
    assignment_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    sub = (
        db.query(AssignmentSubmission)
        .filter(
            AssignmentSubmission.assignment_id == assignment_id,
            AssignmentSubmission.user_id == user.id,
        )
        .first()
    )
    if not sub:
        raise HTTPException(status_code=404, detail="Javob topilmadi")
    return _submission_dict(sub)
