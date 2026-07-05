"""Ma'lumotlar modellari va bog'lanishlar (relationships) testlari."""

from app.models.Course import Course
from app.models.lesson import Lesson
from app.models.user import User


def test_user_defaults(db_session):
    user = User(email="new@example.com", name="Yangi")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.points == 0
    assert user.level == 1
    assert user.provider == "local"
    assert user.role == "user"
    assert user.is_active is True
    assert user.streak_days == 0


def test_user_email_unique(db_session):
    db_session.add(User(email="dup@example.com", name="A"))
    db_session.commit()

    from sqlalchemy.exc import IntegrityError

    db_session.add(User(email="dup@example.com", name="B"))
    try:
        db_session.commit()
        committed = True
    except IntegrityError:
        db_session.rollback()
        committed = False
    assert committed is False


def test_course_lesson_relationship(db_session):
    course = Course(title="Fashion 101", price=0, category="fashion")
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)

    lesson = Lesson(course_id=course.id, title="Dars 1", video_url="http://v/1")
    db_session.add(lesson)
    db_session.commit()

    lessons = course.lessons.all()
    assert len(lessons) == 1
    assert lessons[0].title == "Dars 1"
    assert lessons[0].course.title == "Fashion 101"


def test_course_defaults(db_session):
    course = Course(title="Bepul kurs")
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)

    assert course.price == 0
    assert course.is_active is True
