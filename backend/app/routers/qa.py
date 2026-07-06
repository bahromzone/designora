"""Q&A Router — dars ostidagi savol-javob (BOSQICH 3).

Prefix: /api/qa
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, StringConstraints
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.qa import LessonAnswer, LessonQuestion
from app.models.user import User

router = APIRouter(prefix="/api/qa", tags=["Q&A"])


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _get_lesson(db: Session, lesson_id: int) -> Lesson:
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Dars topilmadi")
    return lesson


def _is_course_staff(db: Session, user: User, course_id: int) -> bool:
    if user.role in {"admin", "superadmin"}:
        return True
    course = db.query(Course).filter(Course.id == course_id).first()
    return bool(course and course.instructor_id == user.id)


def _require_access(db: Session, user: User, course_id: int) -> None:
    """Kurs xodimi yoki yozilgan talaba bo'lishi kerak."""
    if _is_course_staff(db, user, course_id):
        return
    enr = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == course_id)
        .first()
    )
    if not enr:
        raise HTTPException(status_code=403, detail="Avval kursga yozilishingiz kerak")


class QuestionIn(BaseModel):
    body: Annotated[str, StringConstraints(min_length=1, max_length=4000)]


class AnswerIn(BaseModel):
    body: Annotated[str, StringConstraints(min_length=1, max_length=4000)]


def _answer_dict(a: LessonAnswer, name: str | None) -> dict:
    return {
        "id": a.id,
        "user_id": a.user_id,
        "author": name,
        "body": a.body,
        "is_instructor": a.is_instructor,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


@router.get("/lessons/{lesson_id}/questions")
def list_questions(
    lesson_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    lesson = _get_lesson(db, lesson_id)
    _require_access(db, user, lesson.course_id)

    questions = (
        db.query(LessonQuestion)
        .filter(LessonQuestion.lesson_id == lesson_id)
        .order_by(LessonQuestion.created_at.desc())
        .all()
    )
    out = []
    for q in questions:
        asker = db.query(User).filter(User.id == q.user_id).first()
        answers = q.answers.all()
        ans_out = []
        for a in answers:
            responder = db.query(User).filter(User.id == a.user_id).first()
            ans_out.append(_answer_dict(a, responder.name if responder else None))
        out.append(
            {
                "id": q.id,
                "user_id": q.user_id,
                "author": asker.name if asker else None,
                "body": q.body,
                "is_resolved": q.is_resolved,
                "created_at": q.created_at.isoformat() if q.created_at else None,
                "answers": ans_out,
            }
        )
    return out


@router.post("/lessons/{lesson_id}/questions", status_code=201)
def ask_question(
    lesson_id: int,
    data: QuestionIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    lesson = _get_lesson(db, lesson_id)
    _require_access(db, user, lesson.course_id)

    q = LessonQuestion(
        lesson_id=lesson_id,
        course_id=lesson.course_id,
        user_id=user.id,
        body=data.body,
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return JSONResponse(
        status_code=201, content={"message": "Savol yuborildi", "id": q.id}
    )


@router.post("/questions/{question_id}/answers", status_code=201)
def answer_question(
    question_id: int,
    data: AnswerIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    q = db.query(LessonQuestion).filter(LessonQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Savol topilmadi")
    _require_access(db, user, q.course_id)

    is_staff = _is_course_staff(db, user, q.course_id)
    ans = LessonAnswer(
        question_id=q.id,
        user_id=user.id,
        body=data.body,
        is_instructor=is_staff,
    )
    db.add(ans)
    # Instruktor javob bersa savolni hal qilingan deb belgilaymiz
    if is_staff:
        q.is_resolved = True
    db.commit()
    db.refresh(ans)
    return JSONResponse(
        status_code=201, content={"message": "Javob qo'shildi", "id": ans.id}
    )


@router.patch("/questions/{question_id}/resolve")
def resolve_question(
    question_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    q = db.query(LessonQuestion).filter(LessonQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Savol topilmadi")
    if q.user_id != user.id and not _is_course_staff(db, user, q.course_id):
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")
    q.is_resolved = True
    db.commit()
    return {"message": "Savol hal qilingan deb belgilandi", "id": q.id}


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    q = db.query(LessonQuestion).filter(LessonQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Savol topilmadi")
    if q.user_id != user.id and not _is_course_staff(db, user, q.course_id):
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")
    db.delete(q)
    db.commit()
    return {"message": "Savol o'chirildi", "id": question_id}


@router.delete("/answers/{answer_id}")
def delete_answer(
    answer_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    a = db.query(LessonAnswer).filter(LessonAnswer.id == answer_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Javob topilmadi")
    q = db.query(LessonQuestion).filter(LessonQuestion.id == a.question_id).first()
    course_id = q.course_id if q else None
    if a.user_id != user.id and not (
        course_id and _is_course_staff(db, user, course_id)
    ):
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")
    db.delete(a)
    db.commit()
    return {"message": "Javob o'chirildi", "id": answer_id}
