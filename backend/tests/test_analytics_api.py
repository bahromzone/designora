"""Analitika API testlari (ANALITIKA)."""

from app.core.security import create_access_token
from app.models.analytics_event import AnalyticsEvent
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.user import User


def _make_user(db, email, role="user"):
    user = User(email=email, name=email.split("@")[0], role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_track_event_public(client, db_session):
    resp = client.post(
        "/api/analytics/track",
        json={"name": "course_view", "props": {"course_id": 1}},
    )
    assert resp.status_code == 201
    assert db_session.query(AnalyticsEvent).count() == 1


def test_instructor_dashboard_scoped_to_own_courses(client, db_session):
    instr = _make_user(db_session, "instr@example.com", role="instructor")
    course = Course(
        title="Instr kurs",
        is_active=True,
        status="published",
        instructor_id=instr.id,
        students_count=3,
    )
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)

    db_session.add(
        Order(user_id=instr.id, course_id=course.id, amount=100000, status="paid")
    )
    db_session.add(
        Enrollment(user_id=instr.id, course_id=course.id, progress_percent=100)
    )
    db_session.commit()

    resp = client.get("/api/analytics/instructor", headers=_auth("instr@example.com"))
    assert resp.status_code == 200
    data = resp.json()
    assert data["courses_count"] == 1
    assert data["revenue"]["net_revenue"] == 100000
    assert data["completion_rate"] == 100.0


def test_instructor_dashboard_forbidden_for_user(client, db_session):
    _make_user(db_session, "plain@example.com", role="user")
    resp = client.get("/api/analytics/instructor", headers=_auth("plain@example.com"))
    assert resp.status_code == 403


def test_admin_dashboard_kpis(client, db_session):
    _make_user(db_session, "admin@example.com", role="admin")
    _make_user(db_session, "u1@example.com")
    course = Course(title="K", is_active=True, status="published", students_count=2)
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)
    db_session.add(Order(user_id=1, course_id=course.id, amount=200000, status="paid"))
    db_session.add(AnalyticsEvent(name="course_view"))
    db_session.commit()

    resp = client.get("/api/analytics/admin", headers=_auth("admin@example.com"))
    assert resp.status_code == 200
    data = resp.json()
    assert data["revenue"]["net_revenue"] == 200000
    assert data["users"]["total"] >= 2
    assert data["courses"]["published"] == 1
    assert any(step["step"] == "course_view" for step in data["funnel"])


def test_admin_dashboard_forbidden_for_instructor(client, db_session):
    _make_user(db_session, "instr2@example.com", role="instructor")
    resp = client.get("/api/analytics/admin", headers=_auth("instr2@example.com"))
    assert resp.status_code == 403
