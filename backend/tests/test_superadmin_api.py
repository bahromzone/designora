from app.core.password import hash_password
from app.core.security import create_access_token
from app.models.user import User


def _user(db, email, role):
    user = User(
        email=email,
        name=role,
        role=role,
        password=hash_password("Password123"),
        is_active=True,
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
