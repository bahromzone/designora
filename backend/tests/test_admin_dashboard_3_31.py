"""Roadmap 3.31 admin operations dashboard tests."""

from app.core.security import create_access_token
from app.models.admin_audit_log import AdminAuditLog
from app.models.assignment import Assignment
from app.models.assignment_submission import AssignmentSubmission
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.forum import ForumReport, ForumThread
from app.models.order import Order
from app.models.user import User


def _headers(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_admin_operations_aggregates_queues_and_health(client, db_session):
    admin = User(email="ops-admin@example.com", name="Ops", role="admin")
    student = User(email="ops-student@example.com", name="Student", role="user")
    course = Course(title="Ops course", is_active=True)
    db_session.add_all([admin, student, course])
    db_session.commit()
    assignment = Assignment(course_id=course.id, user_id=admin.id, title="Review")
    thread = ForumThread(user_id=student.id, title="Report", body="Body")
    db_session.add_all([assignment, thread])
    db_session.commit()
    db_session.add_all([
        Enrollment(user_id=student.id, course_id=course.id),
        AssignmentSubmission(assignment_id=assignment.id, user_id=student.id, status="submitted"),
        ForumReport(reporter_id=student.id, thread_id=thread.id, reason="spam", status="open"),
        Order(user_id=student.id, course_id=course.id, amount=1000, status="failed", failure_reason="declined"),
        AdminAuditLog(actor_id=admin.id, action="course.reviewed", target_type="course", target_id=str(course.id)),
    ])
    db_session.commit()

    response = client.get("/api/admin/operations", headers=_headers(admin.email))
    assert response.status_code == 200
    data = response.json()
    assert data["queues"]["review_count"] == 1
    assert data["queues"]["report_count"] == 1
    assert data["revenue"]["payment_failures"] == 1
    assert data["system"]["database"] == "ok"
    assert data["audit_log"][0]["action"] == "course.reviewed"


def test_admin_operations_rejects_regular_user(client, db_session):
    user = User(email="not-admin@example.com", name="No", role="user")
    db_session.add(user)
    db_session.commit()
    assert client.get("/api/admin/operations", headers=_headers(user.email)).status_code == 403
