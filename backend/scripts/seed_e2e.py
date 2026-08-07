"""Create the deterministic local dataset used by browser E2E tests.

The script is intentionally safe to rerun. It creates one stable student and
one free plus one paid published course, then prints the values consumed by the
GitHub Actions workflow.
"""

from app.core.database import SessionLocal
from app.core.password import hash_password
from app.models.Course import Course
from app.models.lesson import Lesson
from app.models.module import Module
from app.models.user import User

E2E_EMAIL = "e2e.student@designora.test"
E2E_PASSWORD = "DesignoraE2E2026!"

COURSE_SPECS = (
    {
        "slug": "e2e-free-course",
        "title": "E2E Free Design Foundations",
        "price": 0,
        "category": "design",
    },
    {
        "slug": "e2e-paid-course",
        "title": "E2E Paid Design Foundations",
        "price": 100000,
        "category": "design",
    },
)


def _ensure_course(db, spec: dict) -> Course:
    course = db.query(Course).filter(Course.slug == spec["slug"]).one_or_none()
    if course is None:
        course = Course(slug=spec["slug"])
        db.add(course)
        db.flush()

    course.title = spec["title"]
    course.subtitle = "Deterministic browser test course"
    course.description = "Course fixture for the Designora browser journey."
    course.price = spec["price"]
    course.category = spec["category"]
    course.level = "beginner"
    course.language = "uz"
    course.duration_minutes = 10
    course.rating_avg = 5.0
    course.rating_count = 1
    course.students_count = 0
    course.status = "published"
    course.is_active = True
    course.learning_outcomes = ["Complete the deterministic E2E journey"]
    course.requirements = []
    db.flush()

    module = (
        db.query(Module)
        .filter(Module.course_id == course.id, Module.title == "E2E Module")
        .one_or_none()
    )
    if module is None:
        module = Module(course_id=course.id, title="E2E Module", order=0)
        db.add(module)
        db.flush()

    lesson = (
        db.query(Lesson)
        .filter(Lesson.course_id == course.id, Lesson.title == "E2E Lesson")
        .one_or_none()
    )
    if lesson is None:
        db.add(
            Lesson(
                course_id=course.id,
                module_id=module.id,
                title="E2E Lesson",
                order=0,
                duration_seconds=60,
                is_free_preview=True,
                type="video",
                video_url="",
                description="Deterministic lesson fixture.",
            )
        )
    else:
        lesson.module_id = module.id
        lesson.order = 0
        lesson.is_free_preview = True
        lesson.type = "video"
        lesson.video_url = ""

    db.flush()
    return course


def seed() -> None:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == E2E_EMAIL).one_or_none()
        if user is None:
            user = User(email=E2E_EMAIL)
            db.add(user)

        user.name = "E2E Student"
        user.password = hash_password(E2E_PASSWORD)
        user.role = "user"
        user.is_active = True
        db.flush()

        courses = [_ensure_course(db, spec) for spec in COURSE_SPECS]
        db.commit()

        print(f"E2E_EMAIL={E2E_EMAIL}")
        print(f"E2E_PASSWORD={E2E_PASSWORD}")
        print(f"E2E_COURSE_ID={courses[0].id}")
        print(f"E2E_PAID_COURSE_ID={courses[1].id}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
