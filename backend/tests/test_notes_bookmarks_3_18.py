# ruff: noqa: E702
from app.core.security import create_access_token
from app.models.Course import Course
from app.models.lesson import Lesson
from app.models.user import User


def _headers(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_note_search_recent_export_and_bookmark(client, db_session):
    user = User(email="notes@example.com", name="Notes", is_active=True)
    course = Course(title="Notes course", is_active=True)
    db_session.add_all([user, course]); db_session.commit()
    lesson = Lesson(course_id=course.id, title="Typography", video_url="/v.mp4")
    db_session.add(lesson); db_session.commit()
    headers = _headers(user.email)
    created = client.post(f"/api/notes/lessons/{lesson.id}", headers=headers, json={"body": "Contrast hierarchy", "timestamp_seconds": 73})
    assert created.status_code == 201
    assert client.get(f"/api/notes/lessons/{lesson.id}", headers=headers, params={"q": "hierarchy"}).json()[0]["timestamp_seconds"] == 73
    assert client.get("/api/notes/recent", headers=headers).json()["lesson_title"] == "Typography"
    assert "Typography (1:13)" in client.get("/api/notes/export", headers=headers).text
    assert client.put(f"/api/notes/bookmarks/{lesson.id}", headers=headers).json()["bookmarked"] is True
    assert client.get("/api/notes/bookmarks", headers=headers).json()[0]["lesson_id"] == lesson.id
    assert client.put(f"/api/notes/bookmarks/{lesson.id}", headers=headers, params={"bookmarked": False}).json()["bookmarked"] is False
