from app.core.security import create_access_token
from app.models.analytics_event import AnalyticsEvent
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.quiz import Quiz, QuizAttempt
from app.models.review import Review
from app.models.user import User


def auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_instructor_analytics_and_csv_are_scoped(client, db_session):
    teacher = User(email="analytics321@example.com", name="Teacher", role="instructor")
    student = User(email="student321@example.com", name="Student")
    db_session.add_all([teacher, student])
    db_session.commit()
    course = Course(title="Analytics 321", instructor_id=teacher.id)
    db_session.add(course)
    db_session.commit()
    lesson = Lesson(course_id=course.id, title="Lesson 321")
    quiz = Quiz(course_id=course.id, title="Quiz 321")
    db_session.add_all([lesson, quiz])
    db_session.commit()
    db_session.add(Enrollment(user_id=student.id, course_id=course.id, progress_percent=100))
    db_session.add(LessonProgress(user_id=student.id, lesson_id=lesson.id, course_id=course.id, is_completed=True))
    db_session.add(QuizAttempt(quiz_id=quiz.id, user_id=student.id, score=90, passed=True))
    db_session.add(Review(user_id=student.id, course_id=course.id, rating=5, comment="Great"))
    db_session.add(AnalyticsEvent(name="course_viewed", props={"course_id": course.id}))
    db_session.commit()

    response = client.get("/api/instructor/analytics", headers=auth(teacher.email))
    assert response.status_code == 200
    data = response.json()
    assert data["lessons"][0]["completion_rate"] == 100.0
    assert data["quizzes"][0]["difficulty"] == "easy"
    assert data["sentiment"]["positive"] == 1

    exported = client.get("/api/instructor/analytics/export.csv", headers=auth(teacher.email))
    assert exported.status_code == 200
    assert "Analytics 321" not in exported.text or "lesson" in exported.text
    assert "text/csv" in exported.headers["content-type"]
