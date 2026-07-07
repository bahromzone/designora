"""Bildirishnoma, referral va forum API testlari (BOSQICH 4)."""

from app.core.security import create_access_token
from app.models.notification import Notification
from app.models.referral import Referral
from app.models.user import User


def _make_user(db, email, role="user"):
    user = User(email=email, name=email.split("@")[0], role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


# ── Notifications ──
def test_notifications_list_and_read(client, db_session):
    user = _make_user(db_session, "n@example.com")
    db_session.add(Notification(user_id=user.id, message="salom", type="info"))
    db_session.commit()
    h = _auth("n@example.com")

    resp = client.get("/api/notifications", headers=h)
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    nid = resp.json()[0]["id"]
    assert client.get("/api/notifications/unread-count", headers=h).json()[
        "unread"
    ] == 1
    client.post(f"/api/notifications/{nid}/read", headers=h)
    assert client.get("/api/notifications/unread-count", headers=h).json()[
        "unread"
    ] == 0


# ── Referrals ──
def test_referral_code_generated_and_applied(client, db_session):
    referrer = _make_user(db_session, "ref@example.com")
    _make_user(db_session, "new@example.com")

    code_resp = client.get("/api/referrals/my-code", headers=_auth("ref@example.com"))
    assert code_resp.status_code == 200
    code = code_resp.json()["code"]
    assert code

    apply_resp = client.post(
        "/api/referrals/apply",
        json={"code": code},
        headers=_auth("new@example.com"),
    )
    assert apply_resp.status_code == 200
    assert db_session.query(Referral).count() == 1

    db_session.expire_all()
    updated = db_session.query(User).filter(User.id == referrer.id).first()
    assert (updated.points or 0) >= 50


def test_referral_cannot_apply_own_code(client, db_session):
    _make_user(db_session, "self@example.com")
    code = client.get(
        "/api/referrals/my-code", headers=_auth("self@example.com")
    ).json()["code"]
    resp = client.post(
        "/api/referrals/apply",
        json={"code": code},
        headers=_auth("self@example.com"),
    )
    assert resp.status_code == 400


# ── Forum ──
def test_forum_thread_and_reply_flow(client, db_session):
    _make_user(db_session, "f@example.com")
    h = _auth("f@example.com")

    create = client.post(
        "/api/forum/threads",
        json={"title": "Salom hammaga", "body": "Birinchi mavzu"},
        headers=h,
    )
    assert create.status_code == 201
    tid = create.json()["id"]

    reply = client.post(
        f"/api/forum/threads/{tid}/posts",
        json={"body": "Javob"},
        headers=h,
    )
    assert reply.status_code == 201

    detail = client.get(f"/api/forum/threads/{tid}")
    assert detail.status_code == 200
    assert len(detail.json()["posts"]) == 1


def test_forum_create_requires_auth(client, db_session):
    resp = client.post("/api/forum/threads", json={"title": "No auth"})
    assert resp.status_code == 401
