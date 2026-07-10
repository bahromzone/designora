from app.core.security import create_access_token
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.user import User


def _headers(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_catalog_has_four_curated_paths_and_final_projects(client, db_session):
    db_session.add_all(
        [
            Course(title="Graphic basics", category="graphic", level="beginner", is_active=True),
            Course(title="Brand portfolio", category="branding", level="advanced", is_active=True),
        ]
    )
    db_session.commit()
    response = client.get("/api/learning-paths")
    assert response.status_code == 200
    assert len(response.json()) == 4
    graphic = next(item for item in response.json() if item["slug"] == "grafik-dizayn")
    assert graphic["steps"][-1]["final_project"] is True
    assert graphic["steps"][1]["prerequisite_course_id"] == graphic["steps"][0]["course"]["id"]


def test_start_is_idempotent_and_progress_unlocks_next_course(client, db_session):
    student = User(email="path@example.com", name="Path Student", is_active=True)
    first = Course(title="UI basics", category="ui", level="beginner", is_active=True)
    second = Course(title="UX case study", category="ux", level="advanced", is_active=True)
    db_session.add_all([student, first, second])
    db_session.commit()

    first_start = client.post("/api/learning-paths/ui-ux/start", headers=_headers(student.email))
    second_start = client.post("/api/learning-paths/ui-ux/start", headers=_headers(student.email))
    assert first_start.status_code == 200
    assert second_start.status_code == 200
    assert db_session.query(Enrollment).count() == 1
    assert first_start.json()["steps"][1]["locked"] is True

    enrollment = db_session.query(Enrollment).first()
    enrollment.progress_percent = 100
    db_session.commit()
    progress = client.get("/api/learning-paths/ui-ux/progress", headers=_headers(student.email))
    assert progress.status_code == 200
    assert progress.json()["steps"][1]["locked"] is False
    assert progress.json()["progress_percent"] == 50
