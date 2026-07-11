from app.core.security import create_access_token
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.user import User


def _headers(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_manifest_sources_subtitles_and_resume_roundtrip(client, db_session):
    user = User(email="viewer@example.com", name="Viewer", is_active=True)
    course = Course(title="Video course", is_active=True, status="published")
    db_session.add_all([user, course])
    db_session.commit()
    lesson = Lesson(
        course_id=course.id,
        title="Adaptive lesson",
        video_url="/video/master.m3u8",
        video_sources=[
            {"label": "Auto", "url": "/video/master.m3u8", "type": "application/x-mpegURL"},
            {"label": "720p", "url": "/video/720.mp4", "type": "video/mp4"},
        ],
        subtitles=[{"label": "O‘zbekcha", "src": "/subs/uz.vtt", "srclang": "uz"}],
    )
    db_session.add(lesson)
    db_session.commit()
    db_session.add(Enrollment(user_id=user.id, course_id=course.id))
    db_session.commit()

    saved = client.put(
        f"/api/media/lessons/{lesson.id}/progress",
        headers=_headers(user.email),
        json={"position_seconds": 73, "duration_seconds": 600},
    )
    assert saved.status_code == 200
    manifest = client.post(
        f"/api/media/lessons/{lesson.id}/sign", headers=_headers(user.email)
    )
    assert manifest.status_code == 200
    payload = manifest.json()
    assert [item["label"] for item in payload["sources"]] == ["Auto", "720p"]
    assert payload["subtitles"][0]["srclang"] == "uz"
    assert payload["resume_seconds"] == 73
    assert db_session.query(LessonProgress).count() == 1


def test_video_progress_requires_enrollment(client, db_session):
    user = User(email="locked-viewer@example.com", name="Viewer", is_active=True)
    course = Course(title="Locked course", is_active=True, status="published")
    db_session.add_all([user, course])
    db_session.commit()
    lesson = Lesson(course_id=course.id, title="Locked", video_url="/locked.mp4")
    db_session.add(lesson)
    db_session.commit()
    response = client.put(
        f"/api/media/lessons/{lesson.id}/progress",
        headers=_headers(user.email),
        json={"position_seconds": 10, "duration_seconds": 100},
    )
    assert response.status_code == 403
