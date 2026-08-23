from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.quiz import Quiz
from app.models.user import User
from app.routers.instructor import _owned_course, require_instructor

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])


@router.get("/courses/{course_id}/manage")
def list_course_quizzes_for_instructor(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_instructor),
):
    """Instruktor uchun kursdagi barcha quizlar, shu jumladan draft/inactive."""
    course = _owned_course(db, course_id, user)
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.course_id == course.id)
        .order_by(Quiz.id.asc())
        .all()
    )
    return [
        {
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
        for quiz in quizzes
    ]
