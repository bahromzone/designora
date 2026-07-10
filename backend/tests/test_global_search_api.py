from app.models.blog import BlogPost
from app.models.Course import Course
from app.models.forum import ForumThread
from app.models.lesson import Lesson
from app.models.user import User


def test_global_search_groups_public_content(client, db_session):
    instructor = User(email="mentor@search.uz", name="Aziza Karimova", role="instructor", is_active=True, bio="Brand mentor")
    db_session.add(instructor)
    db_session.flush()
    course = Course(title="Brending asoslari", subtitle="Vizual identitet", is_active=True, status="published", instructor_id=instructor.id)
    db_session.add(course)
    db_session.flush()
    db_session.add(Lesson(course_id=course.id, title="Logo tizimi", description="Brend belgilarini qurish"))
    db_session.add(BlogPost(slug="brand-strategy", title="Brend strategiyasi", body="Pozitsiyalash", is_published=True))
    db_session.add(ForumThread(user_id=instructor.id, title="Logo feedback", body="Logotip bo‘yicha fikr", category="branding"))
    db_session.commit()

    response = client.get("/api/discovery/global", params={"q": "brend"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] >= 3
    assert payload["groups"]["course"][0]["title"] == "Brending asoslari"
    assert payload["groups"]["blog"][0]["title"] == "Brend strategiyasi"
    assert payload["groups"]["instructor"][0]["title"] == "Aziza Karimova"


def test_global_search_supports_type_filter_and_typo(client, db_session):
    db_session.add(Course(title="Tipografika", is_active=True, status="published"))
    db_session.commit()
    response = client.get("/api/discovery/global", params={"q": "tipografka", "types": "course"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["groups"]["course"][0]["title"] == "Tipografika"
    assert payload["groups"]["lesson"] == []


def test_global_search_hides_drafts(client, db_session):
    db_session.add(Course(title="Maxfiy kurs", is_active=False, status="draft"))
    db_session.commit()
    response = client.get("/api/discovery/global", params={"q": "maxfiy"})
    assert response.status_code == 200
    assert response.json()["total"] == 0
