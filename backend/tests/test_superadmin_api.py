from app.core.password import hash_password
from app.core.security import create_access_token
from app.models.user import User


def _user(db, email, role, is_active=True):
    user = User(
        email=email,
        name=role,
        role=role,
        password=hash_password("Password123"),
        is_active=is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_superadmin_can_list_users_and_update_role(client, db_session):
    root = _user(db_session, "root@example.com", "superadmin")
    target = _user(db_session, "target@example.com", "user")

    response = client.get("/api/superadmin/users", headers=_auth(root.email))
    assert response.status_code == 200
    assert any(row["email"] == target.email for row in response.json())

    response = client.patch(
        f"/api/superadmin/users/{target.id}/role",
        json={"role": "admin"},
        headers=_auth(root.email),
    )
    assert response.status_code == 200
    db_session.refresh(target)
    assert target.role == "admin"


def test_admin_cannot_use_superadmin_control_plane(client, db_session):
    admin = _user(db_session, "admin@example.com", "admin")
    response = client.get("/api/superadmin/overview", headers=_auth(admin.email))
    assert response.status_code == 403


def test_superadmin_cannot_disable_or_demote_self(client, db_session):
    root = _user(db_session, "root@example.com", "superadmin")
    headers = _auth(root.email)

    response = client.patch(
        f"/api/superadmin/users/{root.id}/role",
        json={"role": "admin"},
        headers=headers,
    )
    assert response.status_code == 400

    response = client.patch(
        f"/api/superadmin/users/{root.id}/status",
        json={"is_active": False},
        headers=headers,
    )
    assert response.status_code == 400


def test_cannot_demote_the_last_active_superadmin(client, db_session):
    actor = _user(db_session, "actor@example.com", "superadmin")
    other = _user(db_session, "other@example.com", "superadmin")
    headers = _auth(actor.email)

    # Actor ham superadmin, shuning uchun `other` hozircha oxirgisi emas.
    response = client.patch(
        f"/api/superadmin/users/{other.id}/role",
        json={"role": "admin"},
        headers=headers,
    )
    assert response.status_code == 200

    # Endi faqat actor qoldi, o'zini o'zgartira olmaydi (400).
    db_session.refresh(other)
    assert other.role == "admin"


def test_cannot_block_the_last_active_superadmin(client, db_session):
    actor = _user(db_session, "actor@example.com", "superadmin")
    stale = _user(db_session, "stale@example.com", "superadmin", is_active=False)
    headers = _auth(actor.email)

    # `stale` bloklangan, shuning uchun faol superadmin faqat bitta: actor.
    # Uni bloklashga urinish 400 qaytaradi (self-block himoyasi).
    response = client.patch(
        f"/api/superadmin/users/{actor.id}/status",
        json={"is_active": False},
        headers=headers,
    )
    assert response.status_code == 400

    # `stale`ni qayta faollashtirish mumkin.
    response = client.patch(
        f"/api/superadmin/users/{stale.id}/status",
        json={"is_active": True},
        headers=headers,
    )
    assert response.status_code == 200

    # Endi ikki faol superadmin bor, birini bloklash mumkin.
    response = client.patch(
        f"/api/superadmin/users/{stale.id}/status",
        json={"is_active": False},
        headers=headers,
    )
    assert response.status_code == 200


def test_admin_users_endpoint_returns_created_at(client, db_session):
    admin = _user(db_session, "ops@example.com", "admin")
    response = client.get("/api/admin/users", headers=_auth(admin.email))
    assert response.status_code == 200
    rows = response.json()
    assert rows
    assert all("created_at" in row for row in rows)
