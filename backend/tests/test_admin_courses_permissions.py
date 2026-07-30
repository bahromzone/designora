from app.core.security import create_access_token
from app.models.Course import Course
from app.models.user import User


def test_superadmin_can_manage_admin_courses(client, db_session):
    user = User(
        email="root@example.com", name="Root", role="superadmin", is_active=True
    )
    db_session.add(user)
    db_session.commit()
    response = client.post(
        "/api/admin/courses",
        json={"title": "Superadmin kursi", "price": 0},
        headers={"Authorization": f"Bearer {create_access_token(user.email)}"},
    )
    assert response.status_code == 201
    assert db_session.query(Course).filter_by(title="Superadmin kursi").count() == 1
