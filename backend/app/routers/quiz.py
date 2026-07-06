"""Quiz Router — test/imtihon dvijkasi (BOSQICH 3).

Prefix: /api/quiz

- Instruktor: quiz + savollar CRUD, natijalarni ko'rish
- Talaba: quizni yechish, avtomatik baholash, urinishlar tarixi
"""

from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, StringConstraints
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.enrollment import Enrollment
from app.models.quiz import Quiz, QuizAttempt, QuizQuestion
from app.models.user import User
from app.routers.instructor import _is_admin, _owned_course, require_instructor
from app.services.gamification_service import award_badge
from app.services.quiz_service import grade_submission

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])


def _now():
    return datetime.now(UTC)


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _require_enrolled(db: Session, user: User, course_id: int) -> None:
    if _is_admin(user):
        return
    enr = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == course_id)
        .first()
    )
    if not enr:
        raise HTTPException(status_code=403, detail="Avval kursga yozilishingiz kerak")


def _get_quiz(db: Session, quiz_id: int) -> Quiz:
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz topilmadi")
    return quiz


def _owned_quiz(db: Session, quiz_id: int, user: User) -> Quiz:
    quiz = _get_quiz(db, quiz_id)
    _owned_course(db, quiz.course_id, user)
    return quiz


# ── SCHEMAS ──
class QuizIn(BaseModel):
    title: Annotated[str, StringConstraints(min_length=2, max_length=200)]
    description: str | None = None
    lesson_id: int | None = None
    passing_score: int | None = 70
    max_attempts: int | None = None
    time_limit_minutes: int | None = None


class QuizPatch(BaseModel):
    title: Annotated[str, StringConstraints(min_length=2, max_length=200)] | None = None
    description: str | None = None
    lesson_id: int | None = None
    passing_score: int | None = None
    max_attempts: int | None = None
    time_limit_minutes: int | None = None
    is_active: bool | None = None


class QuestionIn(BaseModel):
    text: Annotated[str, StringConstraints(min_length=1)]
    type: str = "single"  # single | multiple | boolean
    options: list[dict] | None = None
    correct_answers: list[str] | None = None
    points: int | None = 1
    order: int | None = 0
    explanation: str | None = None


class QuestionPatch(BaseModel):
    text: str | None = None
    type: str | None = None
    options: list[dict] | None = None
    correct_answers: list[str] | None = None
    points: int | None = None
    order: int | None = None
    explanation: str | None = None


class SubmitIn(BaseModel):
    # {"<question_id>": ["a", "c"], ...}
    answers: dict[str, Any]


# ── SERIALIZERS ──
def _quiz_admin_dict(quiz: Quiz) -> dict:
    return {
        "id": quiz.id,
        "course_id": quiz.course_id,
        "lesson_id": quiz.lesson_id,
        "title": quiz.title,
        "description": quiz.description,
        "passing_score": quiz.passing_score,
        "max_attempts": quiz.max_attempts,
        "time_limit_minutes": quiz.time_limit_minutes,
        "is_active": quiz.is_active,
        "questions_count": quiz.questions.count(),
    }


def _question_admin_dict(q: QuizQuestion) -> dict:
    return {
        "id": q.id,
        "text": q.text,
        "type": q.type,
        "options": q.options or [],
        "correct_answers": q.correct_answers or [],
        "points": q.points,
        "order": q.order,
        "explanation": q.explanation,
    }


def _question_public_dict(q: QuizQuestion) -> dict:
    # to'g'ri javoblarsiz (talaba yechishi uchun)
    return {
        "id": q.id,
        "text": q.text,
        "type": q.type,
        "options": q.options or [],
        "points": q.points,
        "order": q.order,
    }


# ==========================================================
# INSTRUKTOR — QUIZ CRUD
# ==========================================================
@router.post("/courses/{course_id}/quizzes", status_code=201)
def create_quiz(
    course_id: int,
    data: QuizIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    _owned_course(db, course_id, user)
    quiz = Quiz(
        course_id=course_id,
        lesson_id=data.lesson_id,
        title=data.title,
        description=data.description,
        passing_score=data.passing_score if data.passing_score is not None else 70,
        max_attempts=data.max_attempts,
        time_limit_minutes=data.time_limit_minutes,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return JSONResponse(
        status_code=201, content={"message": "Quiz yaratildi", "id": quiz.id}
    )


@router.patch("/quizzes/{quiz_id}")
def update_quiz(
    quiz_id: int,
    data: QuizPatch,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    quiz = _owned_quiz(db, quiz_id, user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(quiz, field, value)
    db.commit()
    return {"message": "Quiz yangilandi", "id": quiz.id}


@router.delete("/quizzes/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    quiz = _owned_quiz(db, quiz_id, user)
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz o'chirildi", "id": quiz_id}


@router.get("/quizzes/{quiz_id}/manage")
def get_quiz_manage(
    quiz_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    """Instruktor uchun to'liq quiz (to'g'ri javoblar bilan)."""
    quiz = _owned_quiz(db, quiz_id, user)
    data = _quiz_admin_dict(quiz)
    data["questions"] = [
        _question_admin_dict(q)
        for q in quiz.questions.order_by(QuizQuestion.order.asc()).all()
    ]
    return data


# ==========================================================
# INSTRUKTOR — SAVOLLAR
# ==========================================================
@router.post("/quizzes/{quiz_id}/questions", status_code=201)
def add_question(
    quiz_id: int,
    data: QuestionIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    quiz = _owned_quiz(db, quiz_id, user)
    q = QuizQuestion(
        quiz_id=quiz.id,
        text=data.text,
        type=data.type or "single",
        options=data.options or [],
        correct_answers=data.correct_answers or [],
        points=data.points if data.points is not None else 1,
        order=data.order or 0,
        explanation=data.explanation,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return JSONResponse(
        status_code=201, content={"message": "Savol qo'shildi", "id": q.id}
    )


@router.patch("/questions/{question_id}")
def update_question(
    question_id: int,
    data: QuestionPatch,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    q = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Savol topilmadi")
    _owned_quiz(db, q.quiz_id, user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(q, field, value)
    db.commit()
    return {"message": "Savol yangilandi", "id": q.id}


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    q = db.query(QuizQuestion).filter(QuizQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Savol topilmadi")
    _owned_quiz(db, q.quiz_id, user)
    db.delete(q)
    db.commit()
    return {"message": "Savol o'chirildi", "id": question_id}


@router.get("/quizzes/{quiz_id}/results")
def quiz_results(
    quiz_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    """Instruktor — quiz bo'yicha barcha urinishlar."""
    quiz = _owned_quiz(db, quiz_id, user)
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.quiz_id == quiz.id)
        .order_by(QuizAttempt.submitted_at.desc())
        .all()
    )
    return [
        {
            "attempt_id": a.id,
            "user_id": a.user_id,
            "attempt_number": a.attempt_number,
            "score": a.score,
            "passed": a.passed,
            "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
        }
        for a in attempts
    ]


# ==========================================================
# TALABA — QUIZNI YECHISH
# ==========================================================
@router.get("/courses/{course_id}/quizzes")
def list_course_quizzes(
    course_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    _require_enrolled(db, user, course_id)
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.course_id == course_id, Quiz.is_active == True)  # noqa: E712
        .order_by(Quiz.id.asc())
        .all()
    )
    out = []
    for quiz in quizzes:
        best = (
            db.query(QuizAttempt)
            .filter(QuizAttempt.quiz_id == quiz.id, QuizAttempt.user_id == user.id)
            .order_by(QuizAttempt.score.desc())
            .first()
        )
        out.append(
            {
                "id": quiz.id,
                "title": quiz.title,
                "description": quiz.description,
                "lesson_id": quiz.lesson_id,
                "passing_score": quiz.passing_score,
                "max_attempts": quiz.max_attempts,
                "questions_count": quiz.questions.count(),
                "best_score": best.score if best else None,
                "passed": bool(best.passed) if best else False,
            }
        )
    return out


@router.get("/quizzes/{quiz_id}")
def get_quiz_to_take(
    quiz_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Talaba uchun quiz (to'g'ri javoblarsiz)."""
    user = _get_user(db, email)
    quiz = _get_quiz(db, quiz_id)
    _require_enrolled(db, user, quiz.course_id)

    used = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.quiz_id == quiz.id, QuizAttempt.user_id == user.id)
        .count()
    )
    attempts_left = None
    if quiz.max_attempts is not None:
        attempts_left = max(0, quiz.max_attempts - used)

    return {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "passing_score": quiz.passing_score,
        "time_limit_minutes": quiz.time_limit_minutes,
        "max_attempts": quiz.max_attempts,
        "attempts_used": used,
        "attempts_left": attempts_left,
        "questions": [
            _question_public_dict(q)
            for q in quiz.questions.order_by(QuizQuestion.order.asc()).all()
        ],
    }


@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    data: SubmitIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    quiz = _get_quiz(db, quiz_id)
    _require_enrolled(db, user, quiz.course_id)

    used = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.quiz_id == quiz.id, QuizAttempt.user_id == user.id)
        .count()
    )
    if quiz.max_attempts is not None and used >= quiz.max_attempts:
        raise HTTPException(status_code=403, detail="Urinishlar soni tugadi")

    questions = [
        {
            "id": q.id,
            "correct_answers": q.correct_answers or [],
            "points": q.points or 1,
            "explanation": q.explanation,
        }
        for q in quiz.questions.all()
    ]
    if not questions:
        raise HTTPException(status_code=400, detail="Quizda savollar yo'q")

    result = grade_submission(questions, data.answers)
    passed = result["score"] >= (quiz.passing_score or 0)

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=user.id,
        attempt_number=used + 1,
        score=result["score"],
        earned_points=result["earned_points"],
        total_points=result["total_points"],
        passed=passed,
        answers=data.answers,
        submitted_at=_now(),
    )
    db.add(attempt)
    db.flush()

    # Gamifikatsiya
    if passed:
        award_badge(db, user, "quiz_passed")
        if result["score"] >= 100:
            award_badge(db, user, "quiz_perfect")

    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "score": attempt.score,
        "earned_points": attempt.earned_points,
        "total_points": attempt.total_points,
        "passed": attempt.passed,
        "passing_score": quiz.passing_score,
        "per_question": result["per_question"],
    }


@router.get("/quizzes/{quiz_id}/my-attempts")
def my_attempts(
    quiz_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    quiz = _get_quiz(db, quiz_id)
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.quiz_id == quiz.id, QuizAttempt.user_id == user.id)
        .order_by(QuizAttempt.attempt_number.asc())
        .all()
    )
    return [
        {
            "attempt_id": a.id,
            "attempt_number": a.attempt_number,
            "score": a.score,
            "passed": a.passed,
            "submitted_at": a.submitted_at.isoformat() if a.submitted_at else None,
        }
        for a in attempts
    ]
