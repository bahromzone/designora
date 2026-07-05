"""Instruktor kurs mundarijasi API (/api/instructor) testlari (BOSQICH 1)."""

from app.core.security import create_access_token
from app.models.Course import Course
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.user import User


def _make_user(db, email, role="user"):
    user = User(email=email, name=email.split("@")[0], role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_create_course_requires_instructor_role(client, db_session):
    _make_user(db_session, "user@example.com", role="user")
    resp = client.post(
        "/api/instructor/courses",
        json={"title": "Yangi kurs"},
        headers=_auth("user@example.com"),
    )
    assert resp.status_code == 403


def test_instructor_creates_draft_course(client, db_session):
    _make_user(db_session, "teacher@example.com", role="instructor")
    resp = client.post(
        "/api/instructor/courses",
        json={"title": "Moda asoslari", "category": "Fashion"},
        headers=_auth("teacher@example.com"),
    )
    assert resp.status_code == 201
    body = resp.json()
    course = db_session.query(Course).filter_by(id=body["id"]).first()
    assert course.status == "draft"
    assert course.is_active is False
    assert course.slug == "moda-asoslari"
    assert course.category == "fashion"


def test_slug_is_unique(client, db_session):
    _make_user(db_session, "teacher@example.com", role="instructor")
    h = _auth("teacher@example.com")
    client.post("/api/instructor/courses", json={"title": "Bir xil"}, headers=h)
    resp = client.post("/api/instructor/courses", json={"title": "Bir xil"}, headers=h)
    assert resp.json()["slug"] == "bir-xil-2"


def test_module_and_lesson_flow_and_publish(client, db_session):
    _make_user(db_session, "teacher@example.com", role="instructor")
    h = _auth("teacher@example.com")

    course_id = client.post(
        "/api/instructor/courses", json={"title": "To'liq kurs"}, headers=h
    ).json()["id"]

    # Chop etish darslarsiz rad etiladi
    resp = client.post(f"/api/instructor/courses/{course_id}/publish", headers=h)
    assert resp.status_code == 400

    module_id = client.post(
        f"/api/instructor/courses/{course_id}/modules",
        json={"title": "Kirish", "order": 1},
        headers=h,
    ).json()["id"]

    lesson_resp = client.post(
        f"/api/instructor/courses/{course_id}/lessons",
        json={
            "title": "Birinchi dars",
            "module_id": module_id,
            "video_url": "http://v/1",
            "is_free_preview": True,
        },
        headers=h,
    )
    assert lesson_resp.status_code == 201

    assert db_session.query(Module).count() == 1
    assert db_session.query(Lesson).count() == 1

    # Endi chop etish ishlaydi
    resp = client.post(f"/api/instructor/courses/{course_id}/publish", headers=h)
    assert resp.status_code == 200
    course = db_session.query(Course).filter_by(id=course_id).first()
    assert course.status == "published"
    assert course.is_active is True


def test_instructor_cannot_edit_others_course(client, db_session):
    owner = _make_user(db_session, "owner@example.com", role="instructor")
    _make_user(db_session, "other@example.com", role="instructor")
    course = Course(title="Egalik kursi", instructor_id=owner.id)
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)

    resp = client.patch(
        f"/api/instructor/courses/{course.id}",
        json={"title": "O'zgartirilgan sarlavha"},
        headers=_auth("other@example.com"),
    )
    assert resp.status_code == 403


def test_admin_can_edit_any_course(client, db_session):
    owner = _make_user(db_session, "owner@example.com", role="instructor")
    _make_user(db_session, "admin@example.com", role="admin")
    course = Course(title="Egalik kursi", instructor_id=owner.id)
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)

    resp = client.patch(
        f"/api/instructor/courses/{course.id}",
        json={"title": "Admin tahriri"},
        headers=_auth("admin@example.com"),
    )
    assert resp.status_code == 200
