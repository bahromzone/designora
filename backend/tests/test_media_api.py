"""Media (signed video URL) API testlari (BOSQICH 5)."""

from app.core.security import create_access_token
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.user import User


def _make_user(db, email="media@example.com", role="user"):
    user = User(email=email, name=email.split("@")[0], role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def _course_with_lessons(db):
    course = Course(title="Media kurs", is_active=True, status="published")
    db.add(course)
    db.commit()
    db.refresh(course)
    free = Lesson(
        course_id=course.id,
        title="Bepul dars",
        video_url="/video/free.mp4",
        is_free_preview=True,
    )
    locked = Lesson(
        course_id=course.id,
        title="Yopiq dars",
        video_url="/video/locked.mp4",
        is_free_preview=False,
    )
    db.add(free)
    db.add(locked)
    db.commit()
    db.refresh(free)
    db.refresh(locked)
    return course, free, locked


def test_sign_free_preview_without_enrollment(client, db_session):
    _make_user(db_session)
    _course, free, _locked = _course_with_lessons(db_session)
    resp = client.post(
        f"/api/media/lessons/{free.id}/sign", headers=_auth("media@example.com")
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert "expires" in data
    assert data["url"].startswith("/video/free.mp4?")


def test_sign_locked_requires_enrollment(client, db_session):
    _make_user(db_session)
    _course, _free, locked = _course_with_lessons(db_session)
    resp = client.post(
        f"/api/media/lessons/{locked.id}/sign", headers=_auth("media@example.com")
    )
    assert resp.status_code == 403


def test_sign_locked_after_enrollment(client, db_session):
    user = _make_user(db_session)
    course, _free, locked = _course_with_lessons(db_session)
    db_session.add(Enrollment(user_id=user.id, course_id=course.id))
    db_session.commit()
    resp = client.post(
        f"/api/media/lessons/{locked.id}/sign", headers=_auth("media@example.com")
    )
    assert resp.status_code == 200


def test_sign_requires_auth(client, db_session):
    _course, free, _locked = _course_with_lessons(db_session)
    resp = client.post(f"/api/media/lessons/{free.id}/sign")
    assert resp.status_code == 401


def test_verify_roundtrip(client, db_session):
    _make_user(db_session)
    _course, free, _locked = _course_with_lessons(db_session)
    signed = client.post(
        f"/api/media/lessons/{free.id}/sign", headers=_auth("media@example.com")
    ).json()
    resp = client.get(
        "/api/media/verify",
        params={
            "path": "/video/free.mp4",
            "expires": signed["expires"],
            "token": signed["token"],
        },
    )
    assert resp.status_code == 200
    assert resp.json()["valid"] is True


def test_verify_rejects_bad_token(client, db_session):
    resp = client.get(
        "/api/media/verify",
        params={"path": "/video/free.mp4", "expires": 9999999999, "token": "bad"},
    )
    assert resp.status_code == 200
    assert resp.json()["valid"] is False
