"""GDPR (eksport + hisob o'chirish) API testlari (XAVFSIZLIK)."""

from app.core.password import hash_password
from app.core.security import create_access_token
from app.models.user import User


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_export_returns_profile(client, db_session):
    user = User(email="gdpr@example.com", name="Gdpr", role="user")
    db_session.add(user)
    db_session.commit()
    resp = client.get("/api/privacy/export", headers=_auth("gdpr@example.com"))
    assert resp.status_code == 200
    data = resp.json()
    assert data["profile"]["email"] == "gdpr@example.com"
    assert "enrollments" in data
    assert "certificates" in data
    assert "reviews" in data


def test_delete_requires_confirm(client, db_session):
    user = User(email="del@example.com", name="Del", role="user")
    db_session.add(user)
    db_session.commit()
    resp = client.request(
        "DELETE",
        "/api/privacy/account",
        json={"confirm": False},
        headers=_auth("del@example.com"),
    )
    assert resp.status_code == 400


def test_delete_wrong_password_rejected(client, db_session):
    user = User(
        email="pw@example.com",
        name="Pw",
        role="user",
        password=hash_password("Correct123"),
    )
    db_session.add(user)
    db_session.commit()
    resp = client.request(
        "DELETE",
        "/api/privacy/account",
        json={"confirm": True, "password": "Wrong123"},
        headers=_auth("pw@example.com"),
    )
    assert resp.status_code == 403


def test_delete_success(client, db_session):
    user = User(
        email="bye@example.com",
        name="Bye",
        role="user",
        password=hash_password("Correct123"),
    )
    db_session.add(user)
    db_session.commit()
    resp = client.request(
        "DELETE",
        "/api/privacy/account",
        json={"confirm": True, "password": "Correct123"},
        headers=_auth("bye@example.com"),
    )
    assert resp.status_code == 200
    assert db_session.query(User).filter(User.email == "bye@example.com").first() is None
