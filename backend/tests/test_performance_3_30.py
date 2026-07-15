"""Roadmap 3.30 performance contracts."""

from app.core.security import create_access_token
from app.models.Course import Course
from app.models.lesson import Lesson
from app.models.user import User


def test_public_api_has_shared_cache_and_server_timing(client, db_session):
    response = client.get("/api/courses")
    assert response.status_code == 200
    assert "stale-while-revalidate" in response.headers["cache-control"]
    assert response.headers["server-timing"].startswith("app;dur=")


def test_adaptive_video_source_is_preferred(client, db_session):
    user = User(email="adaptive@example.com", name="Adaptive", role="user")
    course = Course(title="Adaptive kurs", is_active=True)
    db_session.add_all([user, course])
    db_session.commit()
    lesson = Lesson(course_id=course.id, title="HLS", is_free_preview=True, video_sources=[
        {"label": "Auto", "url": "/video/master.m3u8", "type": "application/vnd.apple.mpegurl"},
        {"label": "720p", "url": "/video/720.mp4", "type": "video/mp4"},
    ])
    db_session.add(lesson)
    db_session.commit()
    response = client.post(f"/api/media/lessons/{lesson.id}/sign", headers={"Authorization": f"Bearer {create_access_token(user.email)}"})
    assert response.status_code == 200
    data = response.json()
    assert data["delivery"] == "adaptive"
    assert data["preferred_source"]["delivery"] == "hls"
