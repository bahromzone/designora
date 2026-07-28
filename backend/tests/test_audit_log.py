from app.core.password import hash_password
from app.core.security import create_access_token
from app.models.audit_log import AuditLog
from app.models.user import User


def _user(db, email, role):
    item = User(email=email, name=role, role=role, password=hash_password("Password123"), is_active=True)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_role_change_creates_audit_log(client, db_session):
    actor = _user(db_session, "root@example.com", "superadmin")
    target = _user(db_session, "target@example.com", "user")
    response = client.patch(f"/api/superadmin/users/{target.id}/role", json={"role": "admin"}, headers=_auth(actor.email))
    assert response.status_code == 200
    log = db_session.query(AuditLog).one()
    assert log.actor_id == actor.id
    assert log.action == "user.role_updated"
    assert log.target_id == target.id
    assert '"role": "user"' in log.old_value
    assert '"role": "admin"' in log.new_value


def test_audit_log_is_superadmin_only(client, db_session):
    admin = _user(db_session, "admin@example.com", "admin")
    response = client.get("/api/superadmin/audit", headers=_auth(admin.email))
    assert response.status_code == 403


def test_superadmin_can_read_audit_log(client, db_session):
    actor = _user(db_session, "root@example.com", "superadmin")
    target = _user(db_session, "target@example.com", "user")
    client.patch(f"/api/superadmin/users/{target.id}/status", json={"is_active": False}, headers=_auth(actor.email))
    response = client.get("/api/superadmin/audit", headers=_auth(actor.email))
    assert response.status_code == 200
    assert response.json()[0]["action"] == "user.status_updated"
