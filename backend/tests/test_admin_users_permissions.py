from app.core.password import hash_password
from app.core.security import create_access_token
from app.models.user import User


def _user(db, email, role):
    item = User(email=email, name=role, role=role, password=hash_password("Password123"), is_active=True)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_admin_can_view_users_but_superadmin_can_manage(client, db_session):
    admin = _user(db_session, "admin@example.com", "admin")
    target = _user(db_session, "target@example.com", "user")
    response = client.get("/api/admin/users", headers=_auth(admin.email))
    assert response.status_code == 200
    assert any(row["email"] == target.email for row in response.json())

    root = _user(db_session, "root@example.com", "superadmin")
    response = client.patch(
        f"/api/superadmin/users/{target.id}/role",
        json={"role": "instructor"},
        headers=_auth(root.email),
    )
    assert response.status_code == 200
    db_session.refresh(target)
    assert target.role == "instructor"
