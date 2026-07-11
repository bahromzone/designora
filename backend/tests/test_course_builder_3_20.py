"""Roadmap 3.20 course builder integration tests."""

from app.core.security import create_access_token
from app.models.Course import Course
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.user import User


def _user(db, email, role="instructor"):
    row = User(email=email, name=email.split("@")[0], role=role)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_builder_supports_draft_tree_autosave_and_versions(client, db_session):
    instructor = _user(db_session, "builder@example.com")
    course = Course(title="Draft", instructor_id=instructor.id, status="draft", is_active=False)
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)

    response = client.patch(
        f"/api/instructor/builder/courses/{course.id}/autosave",
        json={"title": "Updated draft", "description": "A" * 30, "learning_outcomes": ["Build a case study"]},
        headers=_auth(instructor.email),
    )
    assert response.status_code == 200
    tree = client.get(f"/api/instructor/builder/courses/{course.id}", headers=_auth(instructor.email))
    assert tree.status_code == 200
    assert tree.json()["course"]["title"] == "Updated draft"
    versions = client.get(f"/api/instructor/builder/courses/{course.id}/versions", headers=_auth(instructor.email))
    assert len(versions.json()) == 1


def test_builder_bulk_upload_reorder_and_processing(client, db_session):
    instructor = _user(db_session, "bulk@example.com")
    course = Course(title="Bulk course", instructor_id=instructor.id)
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)
    module = Module(course_id=course.id, title="First", order=0)
    db_session.add(module)
    db_session.commit()
    db_session.refresh(module)

    response = client.post(
        f"/api/instructor/builder/courses/{course.id}/bulk-lessons",
        json={"lessons": [{"title": "Video one", "module_id": module.id, "video_url": "https://cdn/video.mp4"}, {"title": "Text one", "module_id": module.id, "type": "text", "content": "Lesson"}]},
        headers=_auth(instructor.email),
    )
    assert response.status_code == 201
    lesson_ids = response.json()["ids"]
    assert db_session.query(Lesson).count() == 2

    reordered = client.post(
        f"/api/instructor/builder/courses/{course.id}/reorder",
        json={"modules": [{"id": module.id, "order": 2}], "lessons": [{"id": lesson_ids[0], "order": 1, "module_id": module.id}]},
        headers=_auth(instructor.email),
    )
    assert reordered.status_code == 200
    status = client.patch(
        f"/api/instructor/builder/lessons/{lesson_ids[0]}/processing",
        json={"status": "ready"},
        headers=_auth(instructor.email),
    )
    assert status.json()["status"] == "ready"


def test_builder_rejects_other_instructor(client, db_session):
    owner = _user(db_session, "owner-builder@example.com")
    other = _user(db_session, "other-builder@example.com")
    course = Course(title="Private draft", instructor_id=owner.id)
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)
    response = client.get(f"/api/instructor/builder/courses/{course.id}", headers=_auth(other.email))
    assert response.status_code == 403
