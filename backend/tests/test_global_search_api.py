from app.models.blog import BlogPost
from app.models.Course import Course
from app.models.forum import ForumThread
from app.models.lesson import Lesson
from app.models.user import User


def test_global_search_groups_content_and_supports_typo(client, db_session):
    instructor = User(
        email="mentor-search@example.com",
        name="Dilnoza Karimova",
        role="instructor",
        is_active=True,
        bio="Brand identity mentori",
    )
    db_session.add(instructor)
    db_session.flush()

    course = Course(
        title="Grafik dizayn asoslari",
        subtitle="Kompozitsiya va tipografika",
        description="Vizual aloqa asoslari",
        category="grafik dizayn",
        status="published",
        is_active=True,
        instructor_id=instructor.id,
    )
    db_session.add(course)
    db_session.flush()
    db_session.add(
        Lesson(
            course_id=course.id,
            title="Tipografika iyerarxiyasi",
            description="Shrift o'lchami va ritm",
            type="video",
        )
    )
    db_session.add(
        BlogPost(
            slug="brend-tizimi",
            title="Kuchli brend tizimi",
            excerpt="Brend strategiyasi va vizual identitet",
            body="Brand design haqida maqola",
            is_published=True,
        )
    )
    db_session.add(
        ForumThread(
            user_id=instructor.id,
            title="Logotip feedback kerak",
            body="Logo kompozitsiyasi bo'yicha fikr bering",
            category="branding",
        )
    )
    db_session.commit()

    exact = client.get("/api/discovery/global-search?q=tipografika")
    assert exact.status_code == 200
    payload = exact.json()
    assert payload["total"] >= 2
    assert payload["groups"]["course"][0]["type"] == "course"
    assert payload["groups"]["lesson"][0]["type"] == "lesson"

    typo = client.get("/api/discovery/global-search?q=tipografka&types=lesson")
    assert typo.status_code == 200
    assert typo.json()["groups"]["lesson"][0]["title"] == "Tipografika iyerarxiyasi"


def test_global_search_requires_two_characters(client):
    response = client.get("/api/discovery/global-search?q=d")
    assert response.status_code == 422
