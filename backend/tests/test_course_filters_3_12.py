from app.models.Course import Course
from app.models.user import User


def _course(db, **values):
    defaults = {"title": "Course", "is_active": True, "status": "published"}
    defaults.update(values)
    course = Course(**defaults)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def test_roadmap_filters_duration_instructor_and_sort(client, db_session):
    mentor = User(email="filter-mentor@example.com", name="Filter Mentor", role="instructor", is_active=True)
    other = User(email="other-mentor@example.com", name="Other Mentor", role="instructor", is_active=True)
    db_session.add_all([mentor, other])
    db_session.commit()
    _course(db_session, title="Short", instructor_id=mentor.id, duration_minutes=90, price=200, rating_avg=4.8)
    _course(db_session, title="Long", instructor_id=mentor.id, duration_minutes=600, price=100, rating_avg=3.0)
    _course(db_session, title="Other", instructor_id=other.id, duration_minutes=120, price=300, rating_avg=5.0)

    response = client.get("/api/discovery/search", params={"instructor_id": mentor.id, "min_duration": 60, "max_duration": 180})
    assert response.status_code == 200
    assert [item["title"] for item in response.json()["results"]] == ["Short"]

    sorted_response = client.get("/api/discovery/search", params={"sort": "duration_asc"})
    assert [item["title"] for item in sorted_response.json()["results"]] == ["Short", "Other", "Long"]


def test_filter_metadata_and_certificate_flag(client, db_session):
    mentor = User(email="metadata@example.com", name="Metadata Mentor", role="instructor", is_active=True)
    db_session.add(mentor)
    db_session.commit()
    _course(db_session, title="Metadata", instructor_id=mentor.id, category="uiux", level="advanced", language="uz", duration_minutes=240, price=450)

    metadata = client.get("/api/discovery/filters")
    assert metadata.status_code == 200
    payload = metadata.json()
    assert payload["categories"][0] == {"category": "uiux", "count": 1}
    assert payload["instructors"][0]["name"] == "Metadata Mentor"
    assert payload["duration_max"] == 240
    assert payload["price_max"] == 450

    certified = client.get("/api/discovery/search", params={"certificate": True})
    assert certified.status_code == 200
    assert certified.json()["results"][0]["certificate_available"] is True
