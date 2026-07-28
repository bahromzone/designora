"""/api/admin/users qo'riqchilari.

Ilgari bu endpoint main.py ichida inline yozilgan va `is_active` ni
tekshirmasdi — bloklangan admin hali ham butun user bazasini o'qiy olardi.
"""

from app.core.password import hash_password
from app.core.security import create_access_token
from app.models.user import User


def _user(db, email, role, is_active=True):
    item = User(
        email=email,
        name=role,
        role=role,
        password=hash_password("Password123"),
        is_active=is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_admin_users_payload_exposes_created_at(client, db_session):
    admin = _user(db_session, "admin@example.com", "admin")
    _user(db_session, "student@example.com", "user")

    response = client.get("/api/admin/users", headers=_auth(admin.email))

    assert response.status_code == 200
    rows = response.json()["items"]
    assert rows
    assert all("created_at" in row for row in rows)


def test_blocked_admin_cannot_list_users(client, db_session):
    admin = _user(db_session, "blocked@example.com", "admin", is_active=False)

    response = client.get("/api/admin/users", headers=_auth(admin.email))

    assert response.status_code == 403


def test_student_cannot_list_users(client, db_session):
    student = _user(db_session, "student@example.com", "user")

    response = client.get("/api/admin/users", headers=_auth(student.email))

    assert response.status_code == 403


def test_superadmin_can_list_users(client, db_session):
    root = _user(db_session, "root@example.com", "superadmin")

    response = client.get("/api/admin/users", headers=_auth(root.email))

    assert response.status_code == 200
