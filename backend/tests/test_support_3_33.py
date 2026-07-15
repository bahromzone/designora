from app.core.security import create_access_token
from app.models.analytics_event import AnalyticsEvent
from app.models.certificate import Certificate
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.notification import Notification
from app.models.order import Order
from app.models.user import User


def headers(email): return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_support_workspace_and_notification_resend(client, db_session):
    admin = User(email="support@example.com", name="Support", role="admin")
    user = User(email="learner@example.com", name="Learner", role="user")
    course = Course(title="Support course", is_active=True)
    db_session.add_all([admin, user, course]); db_session.commit()
    enrollment = Enrollment(user_id=user.id, course_id=course.id, progress_percent=40)
    order = Order(user_id=user.id, course_id=course.id, amount=12000, status="paid")
    notice = Notification(user_id=user.id, message="Feedback tayyor", type="review", link="/kurslarim")
    event = AnalyticsEvent(user_id=user.id, name="lesson_started", props={"course_id": course.id})
    db_session.add_all([enrollment, order, notice, event]); db_session.commit()
    search = client.get("/api/support/users/search?q=learner", headers=headers(admin.email))
    assert search.status_code == 200 and search.json()[0]["id"] == user.id
    workspace = client.get(f"/api/support/users/{user.id}", headers=headers(admin.email))
    assert workspace.status_code == 200
    assert workspace.json()["safe_view"]["impersonation"] is False
    assert workspace.json()["timeline"][0]["type"] in {"event", "enrollment", "payment"}
    resent = client.post(f"/api/support/users/{user.id}/notifications/{notice.id}/resend", headers=headers(admin.email))
    assert resent.status_code == 201
    assert db_session.query(Notification).filter(Notification.user_id == user.id).count() == 2


def test_support_rejects_regular_user(client, db_session):
    user = User(email="no-support@example.com", name="No", role="user")
    db_session.add(user); db_session.commit()
    assert client.get("/api/support/users/search?q=no", headers=headers(user.email)).status_code == 403
