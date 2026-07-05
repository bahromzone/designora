"""Public kurslar JSON API (/api/courses) testlari."""

from app.models.Course import Course


def _seed_course(db, **kwargs):
    defaults = {
        "title": "Test kurs",
        "price": 100000,
        "description": "Tavsif",
        "is_active": True,
        "category": "fashion",
        "thumbnail_url": "http://img/1.png",
    }
    defaults.update(kwargs)
    course = Course(**defaults)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def test_list_courses_empty(client):
    resp = client.get("/api/courses")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_courses_returns_active(client, db_session):
    _seed_course(db_session, title="Faol kurs", is_active=True)
    _seed_course(db_session, title="Nofaol kurs", is_active=False)

    resp = client.get("/api/courses")
    assert resp.status_code == 200
    data = resp.json()
    titles = [c["title"] for c in data]
    assert "Faol kurs" in titles
    assert "Nofaol kurs" not in titles


def test_course_dict_shape(client, db_session):
    _seed_course(db_session, title="Shakl kursi")
    data = client.get("/api/courses").json()
    course = data[0]
    for key in ("id", "title", "price", "description", "category", "thumbnail_url"):
        assert key in course


def test_get_single_course(client, db_session):
    course = _seed_course(db_session, title="Yakka kurs")
    resp = client.get(f"/api/courses/{course.id}")
    assert resp.status_code == 200
    assert resp.json()["title"] == "Yakka kurs"


def test_get_missing_course_404(client):
    resp = client.get("/api/courses/999999")
    assert resp.status_code == 404


def test_get_inactive_course_404(client, db_session):
    course = _seed_course(db_session, is_active=False)
    resp = client.get(f"/api/courses/{course.id}")
    assert resp.status_code == 404
