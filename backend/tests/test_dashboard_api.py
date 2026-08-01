# fmt: off
# ruff: noqa: I001
from datetime import UTC, datetime, timedelta

from app.core.security import create_access_token
from app.models.Course import Course
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.note import LessonNote
from app.models.notification import Notification
from app.models.user import User


def _headers(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_dashboard_aggregate_returns_student_workspace(client, db_session):
    user = User(
        email="dashboard@example.com",
        name="Dashboard Learner",
        role="user",
        points=140,
        level=2,
        streak_days=4,
    )
    course = Course(
        title="Dashboard course",
        subtitle="Practice",
        category="UI/UX",
        is_active=True,
        status="published",
    )
    db_session.add_all([user, course])
    db_session.commit()
    lesson = Lesson(course_id=course.id, title="First lesson", order=1)
    assignment = Assignment(
        user_id=user.id,
        course_id=course.id,
        title="Submit a wireframe",
        due_date=datetime.now(UTC) + timedelta(days=1),
    )
    db_session.add_all([lesson, assignment])
    db_session.commit()
    db_session.add(
        Enrollment(user_id=user.id, course_id=course.id, progress_percent=0)
    )
    db_session.add(
        AssignmentSubmission(
            assignment_id=assignment.id,
            user_id=user.id,
            status="submitted",
            content="draft",
        )
    )
    db_session.add(
        LessonNote(
            lesson_id=lesson.id,
            course_id=course.id,
            user_id=user.id,
            body="Remember the spacing scale",
            timestamp_seconds=42,
        )
    )
    db_session.add(
        Notification(
            user_id=user.id,
            message="Assignment deadline is near",
            type="warning",
            link="/kurslarim",
        )
    )
    db_session.commit()

    response = client.get("/api/dashboard", headers=_headers(user.email))

    assert response.status_code == 200
    payload = response.json()
    assert [item["course_id"] for item in payload["courses"]] == [course.id]
    assert payload["courses"][0]["lessons_count"] == 1
    assert payload["assignments"][0]["course"]["course_id"] == course.id
    assert payload["assignments"][0]["my_submission"]["status"] == "submitted"
    assert payload["notifications"][0]["message"] == "Assignment deadline is near"
    assert payload["recent_note"]["lesson_title"] == "First lesson"
    assert payload["recent_note"]["timestamp_seconds"] == 42
    assert payload["gamification"]["streak_days"] == 4
    assert payload["summary"]["open_assignments"] == 1
    assert payload["summary"]["due_soon_assignments"] == 1
    assert payload["next_lesson"]["title"] == "First lesson"


def test_dashboard_aggregate_requires_auth(client):
    response = client.get("/api/dashboard")
    assert response.status_code == 401
# fmt: on
