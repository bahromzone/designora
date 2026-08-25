from datetime import UTC, datetime, timedelta

from app.core.security import create_access_token
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.quiz import Quiz, QuizAttempt, QuizQuestion
from app.models.user import User


def _user(db, email="learner_cooldown@example.com"):
    user = User(email=email, name="Learner Cooldown", role="user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _headers(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def _setup_quiz(db, user):
    course = Course(title="Cooldown Course", is_active=True, status="published")
    db.add(course)
    db.commit()
    db.refresh(course)

    enr = Enrollment(user_id=user.id, course_id=course.id, progress_percent=50)
    db.add(enr)

    quiz = Quiz(
        course_id=course.id,
        title="Cooldown Quiz",
        is_active=True,
        passing_score=80,
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    q1 = QuizQuestion(
        quiz_id=quiz.id,
        text="Savol 1",
        type="single",
        options=[{"id": "a", "text": "A"}, {"id": "b", "text": "B"}],
        correct_answers=["a"],
        points=1,
    )
    db.add(q1)
    db.commit()
    db.refresh(q1)
    return course, quiz, q1


def test_failed_quiz_blocks_immediate_retake(client, db_session):
    user = _user(db_session)
    course, quiz, q1 = _setup_quiz(db_session, user)
    h = _headers(user.email)

    resp = client.post(
        f"/api/quiz/quizzes/{quiz.id}/submit",
        json={"answers": {str(q1.id): ["b"]}},
        headers=h,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["passed"] is False
    assert data["can_take"] is False
    assert data["retry_after_seconds"] > 0

    resp2 = client.get(f"/api/quiz/quizzes/{quiz.id}", headers=h)
    assert resp2.status_code == 429
    assert "daqiqa kuting" in resp2.json()["detail"]

    resp3 = client.post(
        f"/api/quiz/quizzes/{quiz.id}/submit",
        json={"answers": {str(q1.id): ["a"]}},
        headers=h,
    )
    assert resp3.status_code == 429


def test_passed_quiz_allows_retake_without_cooldown(client, db_session):
    user = _user(db_session, email="winner@example.com")
    course, quiz, q1 = _setup_quiz(db_session, user)
    h = _headers(user.email)

    resp = client.post(
        f"/api/quiz/quizzes/{quiz.id}/submit",
        json={"answers": {str(q1.id): ["a"]}},
        headers=h,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["passed"] is True
    assert data["can_take"] is True

    resp2 = client.get(f"/api/quiz/quizzes/{quiz.id}", headers=h)
    assert resp2.status_code == 200
