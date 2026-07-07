"""Refresh-token rotatsiyasi API testlari (XAVFSIZLIK)."""

from app.core.security import create_access_token
from app.models.refresh_token import RefreshToken
from app.models.user import User


def _make_user(db, email="tok@example.com"):
    user = User(email=email, name="tok", role="user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_issue_and_refresh_rotates(client, db_session):
    _make_user(db_session)
    h = _auth("tok@example.com")

    issued = client.post("/api/auth/issue-refresh", headers=h)
    assert issued.status_code == 200
    cookie = issued.cookies.get("refresh_token")
    assert cookie

    # refresh cookie bilan yangi access + rotatsiya
    client.cookies.set("refresh_token", cookie)
    refreshed = client.post("/api/auth/refresh")
    assert refreshed.status_code == 200
    assert refreshed.json()["access_token"]
    # eski token bekor qilingan, yangisi bor
    assert db_session.query(RefreshToken).count() == 2


def test_refresh_without_cookie_401(client, db_session):
    client.cookies.clear()
    resp = client.post("/api/auth/refresh")
    assert resp.status_code == 401


def test_reuse_detection_revokes_all(client, db_session):
    _make_user(db_session)
    h = _auth("tok@example.com")
    issued = client.post("/api/auth/issue-refresh", headers=h)
    old_cookie = issued.cookies.get("refresh_token")

    client.cookies.set("refresh_token", old_cookie)
    client.post("/api/auth/refresh")  # eski endi bekor qilindi

    # eski (bekor qilingan) cookie bilan qayta urinish
    client.cookies.set("refresh_token", old_cookie)
    reuse = client.post("/api/auth/refresh")
    assert reuse.status_code == 401

    # barcha tokenlar bekor qilingan bo'lishi kerak
    active = [t for t in db_session.query(RefreshToken).all() if t.is_active]
    assert active == []


def test_logout_all_revokes(client, db_session):
    _make_user(db_session)
    h = _auth("tok@example.com")
    client.post("/api/auth/issue-refresh", headers=h)
    resp = client.post("/api/auth/logout-all", headers=h)
    assert resp.status_code == 200
    active = [t for t in db_session.query(RefreshToken).all() if t.is_active]
    assert active == []
