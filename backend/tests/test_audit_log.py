from app.core.password import hash_password
from app.core.security import create_access_token
from app.models.audit_log import AdminAuditLog
from app.models.user import User


def _user(db, email, role):
    user = User(email=email, name=role, role=role, password=hash_password("Password123"), is_active=True)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_role_change_creates_audit_log(client, db_session):
    root = _user(db_session, "root@example.com", "superadmin")
    target = _user(db_session, "target@example.com", "user")
    response = client.patch(f"/api/superadmin/users/{target.id}/role", json={"role": "admin"}, headers=_auth(root.email))
    assert response.status_code == 200
    log = db_session.query(AdminAuditLog).one()
    assert log.action == "user.role_changed"
    assert log.old_value == {"role": "user"}
    assert log.new_value == {"role": "admin"}


def test_audit_log_is_superadmin_only(client, db_session):
    admin = _user(db_session, "admin@example.com", "admin")
    response = client.get("/api/superadmin/audit", headers=_auth(admin.email))
    assert response.status_code == 403
