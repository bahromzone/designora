from app.core.security import create_access_token
from app.models.moderation import ContentReport, ModerationAction
from app.models.user import User


def headers(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_report_action_suspend_and_appeal_flow(client, db_session):
    admin = User(email="mod@example.com", name="Mod", role="admin")
    reporter = User(email="reporter@example.com", name="Reporter", role="user")
    target = User(email="target@example.com", name="Target", role="user")
    db_session.add_all([admin, reporter, target]); db_session.commit()
    created = client.post("/api/moderation/reports", headers=headers(reporter.email), json={"content_type": "review", "content_id": 7, "reported_user_id": target.id, "reason": "Spam review"})
    assert created.status_code == 201
    report_id = created.json()["id"]
    queue = client.get("/api/moderation/queue", headers=headers(admin.email))
    assert queue.status_code == 200 and queue.json()["total"] == 1
    action = client.post(f"/api/moderation/reports/{report_id}/action", headers=headers(admin.email), json={"action": "suspend", "reason": "Repeated spam", "internal_note": "Second incident"})
    assert action.status_code == 201
    db_session.refresh(target); assert target.is_active is False
    appeal = client.post(f"/api/moderation/actions/{action.json()['action_id']}/appeal", headers=headers(target.email), json={"statement": "I believe this action should be reviewed."})
    assert appeal.status_code == 201
    decision = client.post(f"/api/moderation/appeals/{appeal.json()['id']}/decision", headers=headers(admin.email), json={"status": "approved", "decision_note": "Evidence supports restoration"})
    assert decision.status_code == 200
    db_session.refresh(target); assert target.is_active is True


def test_regular_user_cannot_open_moderation_queue(client, db_session):
    user = User(email="regular-mod@example.com", name="Regular", role="user")
    db_session.add(user); db_session.commit()
    assert client.get("/api/moderation/queue", headers=headers(user.email)).status_code == 403
