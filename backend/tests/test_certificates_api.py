from app.core.security import create_access_token
from app.models.certificate import Certificate
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.quiz import Quiz
from app.models.user import User


def _user(db, email="learner@example.com"):
    user = User(email=email, name="Learner", role="user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _headers(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def _course(db, title="Certificate Course"):
    course = Course(title=title, is_active=True, status="published")
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def _enrollment(db, user, course, progress=100):
    row = Enrollment(user_id=user.id, course_id=course.id, progress_percent=progress)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def test_issue_certificate_for_completed_course(client, db_session):
    user = _user(db_session)
    course = _course(db_session)
    _enrollment(db_session, user, course)
    response = client.post(
        f"/api/certificates/courses/{course.id}/issue", headers=_headers(user.email)
    )
    assert response.status_code == 201
    body = response.json()
    assert body["course_id"] == course.id
    assert body["serial"]
    assert body["verification_code"]
    assert db_session.query(Certificate).count() == 1


def test_issue_certificate_requires_100_percent(client, db_session):
    user = _user(db_session)
    course = _course(db_session)
    _enrollment(db_session, user, course, progress=99)
    response = client.post(
        f"/api/certificates/courses/{course.id}/issue", headers=_headers(user.email)
    )
    assert response.status_code == 400
    assert "100%" in response.json()["detail"]


def test_issue_certificate_requires_active_quiz_pass(client, db_session):
    user = _user(db_session)
    course = _course(db_session)
    _enrollment(db_session, user, course)
    db_session.add(
        Quiz(course_id=course.id, title="Final test", is_active=True, passing_score=70)
    )
    db_session.commit()
    response = client.post(
        f"/api/certificates/courses/{course.id}/issue", headers=_headers(user.email)
    )
    assert response.status_code == 400
    assert "testlaridan" in response.json()["detail"]


def test_issue_certificate_is_idempotent(client, db_session):
    user = _user(db_session)
    course = _course(db_session)
    _enrollment(db_session, user, course)
    headers = _headers(user.email)
    first = client.post(f"/api/certificates/courses/{course.id}/issue", headers=headers)
    second = client.post(
        f"/api/certificates/courses/{course.id}/issue", headers=headers
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert second.json()["id"] == first.json()["id"]
    assert db_session.query(Certificate).count() == 1


def test_my_certificates_returns_issued_certificate(client, db_session):
    user = _user(db_session)
    course = _course(db_session)
    _enrollment(db_session, user, course)
    headers = _headers(user.email)
    client.post(f"/api/certificates/courses/{course.id}/issue", headers=headers)
    response = client.get("/api/certificates/my", headers=headers)
    assert response.status_code == 200
    assert response.json()[0]["course_id"] == course.id
