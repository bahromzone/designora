"""Roadmap 3.19 instructor home integration tests."""

from datetime import datetime, timedelta

from app.core.security import create_access_token
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.qa import LessonQuestion
from app.models.user import User


def _user(db, email, role="user"):
    row = User(email=email, name=email.split("@")[0], role=role)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_instructor_home_returns_operational_queues_and_health(client, db_session):
    instructor = _user(db_session, "teacher319@example.com", "instructor")
    student = _user(db_session, "student319@example.com")
    course = Course(title="3.19 kurs", instructor_id=instructor.id, status="published", is_active=True, description="Amaliy kurs", thumbnail_url="https://example.com/cover.jpg")
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)
    lesson = Lesson(course_id=course.id, title="Kirish", order=1)
    assignment = Assignment(user_id=student.id, course_id=course.id, title="Portfolio brief")
    enrollment = Enrollment(user_id=student.id, course_id=course.id, progress_percent=10, enrolled_at=datetime.utcnow() - timedelta(days=20))
    db_session.add_all([lesson, assignment, enrollment])
    db_session.commit()
    db_session.refresh(lesson)
    db_session.refresh(assignment)
    db_session.add(AssignmentSubmission(assignment_id=assignment.id, user_id=student.id, status="submitted", content="Tayyor ish"))
    db_session.add(LessonQuestion(lesson_id=lesson.id, course_id=course.id, user_id=student.id, body="Briefni qanday topshiraman?"))
    db_session.commit()
    response = client.get("/api/analytics/instructor", headers=_auth(instructor.email))
    assert response.status_code == 200
    payload = response.json()
    assert payload["active_students"] == 1
    assert payload["pending_submissions"] == 1
    assert payload["unanswered_questions"] == 1
    assert payload["queues"]["submissions"][0]["assignment_title"] == "Portfolio brief"
    assert payload["queues"]["questions"][0]["lesson_title"] == "Kirish"
    assert payload["per_course"][0]["dropout_rate"] == 100.0


def test_instructor_home_is_scoped_to_owned_courses(client, db_session):
    owner = _user(db_session, "owner319@example.com", "instructor")
    other = _user(db_session, "other319@example.com", "instructor")
    db_session.add_all([Course(title="Owner course", instructor_id=owner.id), Course(title="Other course", instructor_id=other.id)])
    db_session.commit()
    response = client.get("/api/analytics/instructor", headers=_auth(owner.email))
    assert response.status_code == 200
    assert response.json()["courses_count"] == 1
    assert response.json()["per_course"][0]["title"] == "Owner course"
