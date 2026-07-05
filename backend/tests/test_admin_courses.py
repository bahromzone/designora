"""Admin kurslar CRUD API (/api/admin/courses) testlari."""

from app.core.security import create_access_token
from app.models.Course import Course
from app.models.user import User


def _make_user(db, email, role="user"):
    user = User(email=email, name=email.split("@")[0], role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth_headers(email):
    token = create_access_token(email)
    return {"Authorization": f"Bearer {token}"}


def test_create_course_requires_auth(client):
    resp = client.post("/api/admin/courses", json={"title": "Yangi kurs"})
    assert resp.status_code == 401


def test_non_admin_forbidden(client, db_session):
    _make_user(db_session, "user@example.com", role="user")
    resp = client.post(
        "/api/admin/courses",
        json={"title": "Yangi kurs"},
        headers=_auth_headers("user@example.com"),
    )
    assert resp.status_code == 403


def test_admin_can_create_course(client, db_session):
    _make_user(db_session, "admin@example.com", role="admin")
    resp = client.post(
        "/api/admin/courses",
        json={"title": "Admin kursi", "category": "Fashion", "price": 50000},
        headers=_auth_headers("admin@example.com"),
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Admin kursi"
    # kategoriya kichik harflarga o'giriladi
    course = db_session.query(Course).filter_by(id=body["id"]).first()
    assert course.category == "fashion"


def test_admin_list_courses(client, db_session):
    _make_user(db_session, "admin@example.com", role="admin")
    db_session.add(Course(title="Mavjud kurs", is_active=False))
    db_session.commit()

    resp = client.get("/api/admin/courses", headers=_auth_headers("admin@example.com"))
    assert resp.status_code == 200
    titles = [c["title"] for c in resp.json()]
    # admin ro'yxati nofaol kurslarni ham ko'rsatadi
    assert "Mavjud kurs" in titles


def test_create_course_short_title_rejected(client, db_session):
    _make_user(db_session, "admin@example.com", role="admin")
    resp = client.post(
        "/api/admin/courses",
        json={"title": "ab"},
        headers=_auth_headers("admin@example.com"),
    )
    assert resp.status_code == 422
