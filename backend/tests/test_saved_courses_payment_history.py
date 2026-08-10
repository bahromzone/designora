from app.core.security import create_access_token
from app.models.Course import Course
from app.models.order import Order
from app.models.saved_course import SavedCourse
from app.models.user import User


def _user(db, email="saved@example.com"):
    user = User(email=email, name="Saved User", role="user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _course(db, title="Saved Course"):
    course = Course(title=title, is_active=True, status="published", price=100000)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def _headers(user):
    return {"Authorization": f"Bearer {create_access_token(user.email)}"}


def test_saved_course_lifecycle(client, db_session):
    user = _user(db_session)
    course = _course(db_session)
    headers = _headers(user)

    created = client.post(f"/api/saved-courses/{course.id}", headers=headers)
    assert created.status_code == 201
    assert created.json()["course_id"] == course.id
    assert client.post(f"/api/saved-courses/{course.id}", headers=headers).status_code == 201
    assert len(client.get("/api/saved-courses", headers=headers).json()) == 1

    removed = client.delete(f"/api/saved-courses/{course.id}", headers=headers)
    assert removed.status_code == 204
    assert client.get("/api/saved-courses", headers=headers).json() == []
    assert db_session.query(SavedCourse).count() == 0


def test_saved_course_is_private(client, db_session):
    owner = _user(db_session, "owner@example.com")
    other = _user(db_session, "other@example.com")
    course = _course(db_session)
    client.post(f"/api/saved-courses/{course.id}", headers=_headers(owner))

    assert client.get("/api/saved-courses", headers=_headers(other)).json() == []
    assert client.delete(f"/api/saved-courses/{course.id}", headers=_headers(other)).status_code == 404


def test_payment_history_is_user_scoped(client, db_session):
    owner = _user(db_session, "buyer@example.com")
    other = _user(db_session, "other-buyer@example.com")
    course = _course(db_session)
    db_session.add(Order(user_id=owner.id, course_id=course.id, amount=100000, status="paid", provider="click"))
    db_session.commit()

    response = client.get("/api/payments/history", headers=_headers(owner))
    assert response.status_code == 200
    assert response.json()[0]["course_title"] == course.title
    assert client.get("/api/payments/history", headers=_headers(other)).json() == []
