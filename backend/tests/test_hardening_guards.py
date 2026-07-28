from app.core.password import hash_password
from app.core.security import create_access_token
from app.models.instructor_application import InstructorApplication
from app.models.moderation_report import ModerationReport
from app.models.user import User


def _user(db, email, role="user", is_active=True):
    user = User(email=email, name=role, role=role, password=hash_password("Password123"), is_active=is_active)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_blocked_user_cannot_apply_as_instructor(client, db_session):
    user = _user(db_session, "blocked@example.com", is_active=False)
    response = client.post("/api/instructor/apply", json={"name": "Blocked User", "bio": "A sufficiently long biography."}, headers=_auth(user.email))
    assert response.status_code == 403
    assert db_session.query(InstructorApplication).count() == 0


def test_moderation_report_validates_payload(client, db_session):
    user = _user(db_session, "reporter@example.com")
    response = client.post("/api/moderation/reports", json={"content_type": "forum", "content_id": 0, "reason": "bad"}, headers=_auth(user.email))
    assert response.status_code == 422
    assert db_session.query(ModerationReport).count() == 0


def test_blank_coupon_is_rejected(client, db_session):
    admin = _user(db_session, "admin@example.com", role="admin")
    response = client.post("/api/admin/coupons", json={"code": "   ", "type": "percent", "value": 10}, headers=_auth(admin.email))
    assert response.status_code == 400
