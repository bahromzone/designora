"""Sharhlar API testlari (BOSQICH 4)."""

from app.core.security import create_access_token
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.review import Review
from app.models.user import User


def _make_user(db, email="rev@example.com"):
    user = User(email=email, name=email.split("@")[0], role="user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def _make_course(db):
    course = Course(title="Sharh kursi", is_active=True, status="published")
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def _enroll(db, user, course):
    db.add(Enrollment(user_id=user.id, course_id=course.id))
    db.commit()


def test_review_requires_enrollment(client, db_session):
    _make_user(db_session)
    course = _make_course(db_session)
    resp = client.post(
        f"/api/reviews/courses/{course.id}",
        json={"rating": 5, "comment": "zo'r"},
        headers=_auth("rev@example.com"),
    )
    assert resp.status_code == 403


def test_review_create_updates_course_rating(client, db_session):
    user = _make_user(db_session)
    course = _make_course(db_session)
    _enroll(db_session, user, course)
    resp = client.post(
        f"/api/reviews/courses/{course.id}",
        json={"rating": 4, "comment": "yaxshi"},
        headers=_auth("rev@example.com"),
    )
    assert resp.status_code == 201
    assert resp.json()["created"] is True
    db_session.expire_all()
    refreshed = db_session.query(Course).filter(Course.id == course.id).first()
    assert refreshed.rating_avg == 4.0
    assert refreshed.rating_count == 1


def test_review_second_submit_updates_not_duplicates(client, db_session):
    user = _make_user(db_session)
    course = _make_course(db_session)
    _enroll(db_session, user, course)
    h = _auth("rev@example.com")
    client.post(f"/api/reviews/courses/{course.id}", json={"rating": 5}, headers=h)
    resp = client.post(
        f"/api/reviews/courses/{course.id}", json={"rating": 2}, headers=h
    )
    assert resp.status_code == 201
    assert resp.json()["created"] is False
    assert db_session.query(Review).count() == 1
    db_session.expire_all()
    refreshed = db_session.query(Course).filter(Course.id == course.id).first()
    assert refreshed.rating_avg == 2.0


def test_review_summary(client, db_session):
    user = _make_user(db_session)
    course = _make_course(db_session)
    _enroll(db_session, user, course)
    client.post(
        f"/api/reviews/courses/{course.id}",
        json={"rating": 5},
        headers=_auth("rev@example.com"),
    )
    resp = client.get(f"/api/reviews/courses/{course.id}/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["rating_count"] == 1
    assert data["rating_avg"] == 5.0
    assert data["distribution"]["5"] == 1


def test_review_rating_out_of_range_rejected(client, db_session):
    user = _make_user(db_session)
    course = _make_course(db_session)
    _enroll(db_session, user, course)
    resp = client.post(
        f"/api/reviews/courses/{course.id}",
        json={"rating": 9},
        headers=_auth("rev@example.com"),
    )
    assert resp.status_code == 422
