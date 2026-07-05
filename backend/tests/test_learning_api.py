"""O'quv (Learning) API — enrollment va dars progressi testlari (BOSQICH 1)."""

from app.core.security import create_access_token
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.module import Module
from app.models.user import User


def _make_user(db, email="learner@example.com", role="user"):
    user = User(email=email, name=email.split("@")[0], role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth_headers(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def _make_course_with_lessons(db, n_lessons=2, active=True):
    course = Course(title="Test kurs", is_active=active, status="published")
    db.add(course)
    db.commit()
    db.refresh(course)

    module = Module(course_id=course.id, title="Modul 1", order=1)
    db.add(module)
    db.commit()
    db.refresh(module)

    lessons = []
    for i in range(n_lessons):
        lesson = Lesson(
            course_id=course.id,
            module_id=module.id,
            title=f"Dars {i + 1}",
            video_url=f"http://v/{i + 1}",
            order=i,
            is_free_preview=(i == 0),
        )
        db.add(lesson)
        lessons.append(lesson)
    db.commit()
    for lesson in lessons:
        db.refresh(lesson)
    return course, lessons


# ── Enrollment ────────────────────────────────────────────────────────────────
def test_enroll_requires_auth(client, db_session):
    course, _ = _make_course_with_lessons(db_session)
    resp = client.post(f"/api/learning/enroll/{course.id}")
    assert resp.status_code == 401


def test_enroll_success(client, db_session):
    _make_user(db_session)
    course, _ = _make_course_with_lessons(db_session)
    resp = client.post(
        f"/api/learning/enroll/{course.id}",
        headers=_auth_headers("learner@example.com"),
    )
    assert resp.status_code == 201
    assert resp.json()["enrolled"] is True
    assert db_session.query(Enrollment).count() == 1


def test_enroll_twice_is_idempotent(client, db_session):
    _make_user(db_session)
    course, _ = _make_course_with_lessons(db_session)
    h = _auth_headers("learner@example.com")
    client.post(f"/api/learning/enroll/{course.id}", headers=h)
    resp = client.post(f"/api/learning/enroll/{course.id}", headers=h)
    assert resp.status_code == 200
    assert db_session.query(Enrollment).count() == 1


def test_enroll_missing_course_404(client, db_session):
    _make_user(db_session)
    resp = client.post(
        "/api/learning/enroll/999999",
        headers=_auth_headers("learner@example.com"),
    )
    assert resp.status_code == 404


def test_unenroll(client, db_session):
    _make_user(db_session)
    course, _ = _make_course_with_lessons(db_session)
    h = _auth_headers("learner@example.com")
    client.post(f"/api/learning/enroll/{course.id}", headers=h)
    resp = client.delete(f"/api/learning/enroll/{course.id}", headers=h)
    assert resp.status_code == 200
    assert resp.json()["enrolled"] is False
    assert db_session.query(Enrollment).count() == 0


# ── My courses ────────────────────────────────────────────────────────────────
def test_my_courses_lists_enrolled(client, db_session):
    _make_user(db_session)
    course, _ = _make_course_with_lessons(db_session)
    h = _auth_headers("learner@example.com")
    client.post(f"/api/learning/enroll/{course.id}", headers=h)
    resp = client.get("/api/learning/my-courses", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["course_id"] == course.id
    assert data[0]["progress_percent"] == 0


# ── Learn view + lesson completion ────────────────────────────────────────────
def test_learn_view_hides_locked_video_when_not_enrolled(client, db_session):
    _make_user(db_session)
    course, lessons = _make_course_with_lessons(db_session, n_lessons=2)
    h = _auth_headers("learner@example.com")
    resp = client.get(f"/api/learning/courses/{course.id}", headers=h)
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_enrolled"] is False
    all_lessons = [lesson for module in data["modules"] for lesson in module["lessons"]]
    free = next(x for x in all_lessons if x["is_free_preview"])
    locked = next(x for x in all_lessons if not x["is_free_preview"])
    assert free["video_url"] is not None
    assert free["is_locked"] is False
    assert locked["video_url"] is None
    assert locked["is_locked"] is True


def test_complete_lesson_updates_progress(client, db_session):
    _make_user(db_session)
    course, lessons = _make_course_with_lessons(db_session, n_lessons=2)
    h = _auth_headers("learner@example.com")
    client.post(f"/api/learning/enroll/{course.id}", headers=h)

    resp = client.post(f"/api/learning/lessons/{lessons[0].id}/complete", headers=h)
    assert resp.status_code == 200
    assert resp.json()["progress_percent"] == 50

    resp = client.post(f"/api/learning/lessons/{lessons[1].id}/complete", headers=h)
    assert resp.json()["progress_percent"] == 100

    enrollment = (
        db_session.query(Enrollment).filter(Enrollment.course_id == course.id).first()
    )
    assert enrollment.progress_percent == 100
    assert enrollment.completed_at is not None
    assert db_session.query(LessonProgress).filter_by(is_completed=True).count() == 2


def test_complete_lesson_requires_enrollment(client, db_session):
    _make_user(db_session)
    course, lessons = _make_course_with_lessons(db_session)
    h = _auth_headers("learner@example.com")
    resp = client.post(f"/api/learning/lessons/{lessons[0].id}/complete", headers=h)
    assert resp.status_code == 403


def test_uncomplete_lesson_reduces_progress(client, db_session):
    _make_user(db_session)
    course, lessons = _make_course_with_lessons(db_session, n_lessons=2)
    h = _auth_headers("learner@example.com")
    client.post(f"/api/learning/enroll/{course.id}", headers=h)
    client.post(f"/api/learning/lessons/{lessons[0].id}/complete", headers=h)
    client.post(f"/api/learning/lessons/{lessons[1].id}/complete", headers=h)

    resp = client.post(f"/api/learning/lessons/{lessons[0].id}/uncomplete", headers=h)
    assert resp.json()["progress_percent"] == 50
