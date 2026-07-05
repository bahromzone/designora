"""BOSQICH 1 ma'lumotlar modellari (Module, Enrollment, LessonProgress) testlari."""

import pytest
from sqlalchemy.exc import IntegrityError

from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.lesson import Lesson
from app.models.lesson_progress import LessonProgress
from app.models.module import Module
from app.models.user import User


def test_course_new_defaults(db_session):
    course = Course(title="Yangi kurs")
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)

    assert course.level == "boshlang'ich"
    assert course.language == "uz"
    assert course.status == "draft"
    assert course.duration_minutes == 0
    assert course.students_count == 0


def test_module_lesson_hierarchy(db_session):
    course = Course(title="Ierarxiya kursi")
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)

    module = Module(course_id=course.id, title="Modul 1", order=1)
    db_session.add(module)
    db_session.commit()
    db_session.refresh(module)

    lesson = Lesson(course_id=course.id, module_id=module.id, title="Dars", order=1)
    db_session.add(lesson)
    db_session.commit()

    assert module.lessons.count() == 1
    assert module.course.title == "Ierarxiya kursi"
    assert course.modules.count() == 1


def test_enrollment_unique_constraint(db_session):
    user = User(email="e@example.com", name="E")
    course = Course(title="Kurs")
    db_session.add_all([user, course])
    db_session.commit()

    db_session.add(Enrollment(user_id=user.id, course_id=course.id))
    db_session.commit()

    db_session.add(Enrollment(user_id=user.id, course_id=course.id))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_lesson_progress_unique_constraint(db_session):
    user = User(email="lp@example.com", name="LP")
    course = Course(title="Kurs")
    db_session.add_all([user, course])
    db_session.commit()
    lesson = Lesson(course_id=course.id, title="Dars")
    db_session.add(lesson)
    db_session.commit()

    db_session.add(
        LessonProgress(user_id=user.id, lesson_id=lesson.id, course_id=course.id)
    )
    db_session.commit()

    db_session.add(
        LessonProgress(user_id=user.id, lesson_id=lesson.id, course_id=course.id)
    )
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_lesson_new_fields_default(db_session):
    course = Course(title="Kurs")
    db_session.add(course)
    db_session.commit()
    lesson = Lesson(course_id=course.id, title="Dars")
    db_session.add(lesson)
    db_session.commit()
    db_session.refresh(lesson)

    assert lesson.type == "video"
    assert lesson.is_free_preview is False
    assert lesson.order == 0
