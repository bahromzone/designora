from datetime import UTC, datetime, timedelta

from app.core.security import create_access_token
from app.models.access_code import CourseAccessCode
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.user import User


def _user(db, email, role="user"):
    user = User(email=email, name=email.split("@")[0], role=role, is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _course(db, title="Paid course"):
    course = Course(
        title=title, is_active=True, status="published", price=590000
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def _headers(user):
    return {"Authorization": f"Bearer {create_access_token(user.email)}"}


def _issue(client, admin, course, buyer):
    return client.post(
        "/api/admin/course-access-codes",
        headers=_headers(admin),
        json={
            "course_id": course.id,
            "user_email": buyer.email,
            "expires_in_days": 7,
        },
    )


def test_admin_issues_user_bound_code_and_buyer_redeems_it(client, db_session):
    admin = _user(db_session, "admin@example.com", "admin")
    buyer = _user(db_session, "buyer@example.com")
    course = _course(db_session)

    issued = _issue(client, admin, course, buyer)
    assert issued.status_code == 201
    code = issued.json()["code"]
    assert len(code.replace("-", "")) == 12

    stored = db_session.query(CourseAccessCode).one()
    assert code.replace("-", "") not in stored.code_hash
    assert stored.code_hint == code[-4:]

    redeemed = client.post(
        "/api/course-access-codes/redeem",
        headers=_headers(buyer),
        json={"course_id": course.id, "code": code.lower()},
    )
    assert redeemed.status_code == 200
    assert (
        db_session.query(Enrollment)
        .filter_by(user_id=buyer.id, course_id=course.id)
        .count()
        == 1
    )
    order = db_session.query(Order).one()
    assert order.provider == "admin_code"
    assert order.status == "paid"
    assert order.amount == course.price
    db_session.refresh(stored)
    assert stored.used_at is not None
    assert stored.order_id == order.id

    repeated = client.post(
        "/api/course-access-codes/redeem",
        headers=_headers(buyer),
        json={"course_id": course.id, "code": code},
    )
    assert repeated.status_code == 400


def test_code_cannot_be_shared_or_used_for_another_course(client, db_session):
    admin = _user(db_session, "admin2@example.com", "superadmin")
    buyer = _user(db_session, "owner@example.com")
    stranger = _user(db_session, "stranger@example.com")
    course = _course(db_session)
    other_course = _course(db_session, "Other course")
    code = _issue(client, admin, course, buyer).json()["code"]

    shared = client.post(
        "/api/course-access-codes/redeem",
        headers=_headers(stranger),
        json={"course_id": course.id, "code": code},
    )
    assert shared.status_code == 400

    wrong_course = client.post(
        "/api/course-access-codes/redeem",
        headers=_headers(buyer),
        json={"course_id": other_course.id, "code": code},
    )
    assert wrong_course.status_code == 400
    assert db_session.query(Enrollment).count() == 0


def test_expired_code_and_non_admin_generation_are_rejected(client, db_session):
    admin = _user(db_session, "admin3@example.com", "admin")
    buyer = _user(db_session, "expired@example.com")
    course = _course(db_session)

    forbidden = _issue(client, buyer, course, buyer)
    assert forbidden.status_code == 403

    issued = _issue(client, admin, course, buyer)
    stored = db_session.query(CourseAccessCode).one()
    stored.expires_at = datetime.now(UTC) - timedelta(minutes=1)
    db_session.commit()

    response = client.post(
        "/api/course-access-codes/redeem",
        headers=_headers(buyer),
        json={"course_id": course.id, "code": issued.json()["code"]},
    )
    assert response.status_code == 400
    assert db_session.query(Enrollment).count() == 0
