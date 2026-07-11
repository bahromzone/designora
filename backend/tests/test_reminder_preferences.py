from app.core.security import create_access_token
from app.models.notification import Notification
from app.models.reminder_preference import PushSubscription, ReminderPreference
from app.models.user import User


def headers(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_preferences_defaults_update_and_unsubscribe(client, db_session):
    user = User(email="reminder@example.com", name="Reminder", is_active=True)
    db_session.add(user)
    db_session.commit()
    auth = headers(user.email)

    initial = client.get("/api/notifications/preferences", headers=auth)
    assert initial.status_code == 200
    assert initial.json()["frequency"] == "instant"
    assert initial.json()["deadline_reminders"] is True

    updated = client.patch("/api/notifications/preferences", headers=auth, json={"frequency": "daily", "quiet_start": "21:30", "quiet_end": "07:15", "marketing_enabled": False})
    assert updated.status_code == 200
    assert updated.json()["frequency"] == "daily"

    subscribed = client.post("/api/notifications/push-subscriptions", headers=auth, json={"endpoint": "https://push.example/subscription-1", "p256dh": "key", "auth": "secret"})
    assert subscribed.status_code == 201
    assert db_session.query(PushSubscription).count() == 1

    removed = client.delete("/api/notifications/push-subscriptions", headers=auth, params={"endpoint": "https://push.example/subscription-1"})
    assert removed.status_code == 200
    assert removed.json()["removed"] == 1


def test_test_reminder_respects_channels(client, db_session):
    user = User(email="channels@example.com", name="Channels", is_active=True)
    db_session.add(user)
    db_session.commit()
    db_session.add(ReminderPreference(user_id=user.id, timezone="UTC", quiet_start="00:00", quiet_end="00:00", in_app_enabled=True, email_enabled=False))
    db_session.commit()
    response = client.post("/api/notifications/preferences/test", headers=headers(user.email))
    assert response.status_code == 200
    assert response.json()["channels"] == ["in_app"]
    assert db_session.query(Notification).filter(Notification.user_id == user.id).count() == 1
