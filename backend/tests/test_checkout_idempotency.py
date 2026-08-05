"""Checkout qayta yuborilganda duplicate order chiqmasligi uchun testlar."""

from app.core.security import create_access_token
from app.models.Course import Course
from app.models.order import Order
from app.models.user import User


def test_safe_checkout_reuses_idempotency_key(client, db_session):
    user = User(email="checkout@example.com", name="buyer", role="user")
    course = Course(
        title="Idempotent course",
        price=100000,
        is_active=True,
        status="published",
    )
    db_session.add_all([user, course])
    db_session.commit()
    headers = {"Authorization": f"Bearer {create_access_token(user.email)}"}
    body = {
        "course_id": course.id,
        "provider": "click",
        "idempotency_key": "checkout-test-key-001",
    }

    first = client.post("/api/payments/checkout-safe", json=body, headers=headers)
    second = client.post("/api/payments/checkout-safe", json=body, headers=headers)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["order_id"] == second.json()["order_id"]
    assert second.json()["reused"] is True
    assert db_session.query(Order).count() == 1


def test_safe_checkout_rejects_key_reuse_for_another_course(client, db_session):
    user = User(email="checkout2@example.com", name="buyer", role="user")
    first_course = Course(
        title="First", price=100000, is_active=True, status="published"
    )
    second_course = Course(
        title="Second", price=100000, is_active=True, status="published"
    )
    db_session.add_all([user, first_course, second_course])
    db_session.commit()
    headers = {"Authorization": f"Bearer {create_access_token(user.email)}"}
    key = "checkout-test-key-002"

    first = client.post(
        "/api/payments/checkout-safe",
        json={
            "course_id": first_course.id,
            "provider": "click",
            "idempotency_key": key,
        },
        headers=headers,
    )
    second = client.post(
        "/api/payments/checkout-safe",
        json={
            "course_id": second_course.id,
            "provider": "click",
            "idempotency_key": key,
        },
        headers=headers,
    )

    assert first.status_code == 200
    assert second.status_code == 409
