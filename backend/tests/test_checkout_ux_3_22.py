from app.core.security import create_access_token
from app.models.coupon import Coupon
from app.models.Course import Course
from app.models.order import Order
from app.models.user import User
from app.routers.payments import _grant_access


def headers(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def setup(db):
    user = User(email="checkout322@example.com", name="Buyer")
    course = Course(title="Checkout UX", price=100000, is_active=True, status="published")
    db.add_all([user, course, Coupon(code="UX20", type="percent", value=20, is_active=True)])
    db.commit()
    return user, course


def test_quote_safe_checkout_deduplicates_and_retries(client, db_session):
    user, course = setup(db_session)
    quote = client.get(f"/api/payments/quote/{course.id}?coupon_code=UX20")
    assert quote.json()["total"] == 80000
    body = {"course_id": course.id, "provider": "payme", "coupon_code": "UX20"}
    first = client.post("/api/payments/checkout-safe", json=body, headers=headers(user.email))
    second = client.post("/api/payments/checkout-safe", json=body, headers=headers(user.email))
    assert first.status_code == 200
    assert second.json()["reused"] is True
    assert first.json()["order_id"] == second.json()["order_id"]
    order = db_session.query(Order).filter_by(id=first.json()["order_id"]).first()
    order.status = "failed"
    order.failure_reason = "provider declined"
    db_session.commit()
    retried = client.post(f"/api/payments/orders/{order.id}/retry", headers=headers(user.email))
    assert retried.json()["status"] == "pending"


def test_paid_order_has_receipt_and_refund_status(client, db_session):
    user, course = setup(db_session)
    order = Order(user_id=user.id, course_id=course.id, original_amount=100000, amount=80000, discount_amount=20000, provider="payme")
    db_session.add(order)
    db_session.flush()
    _grant_access(db_session, order)
    db_session.commit()
    response = client.get(f"/api/payments/orders/{order.id}/receipt", headers=headers(user.email))
    assert response.status_code == 200
    assert response.json()["receipt_number"].startswith("DSN-")
    assert response.json()["refund_status"] == "none"
