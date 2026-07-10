"""Roadmap 3.13: curated, prerequisite-aware learning paths."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.learning_path import UserLearningPath
from app.models.user import User

router = APIRouter(prefix="/api/learning-paths", tags=["Learning paths"])

PATHS = [
    {
        "slug": "grafik-dizayn",
        "title": "Grafik dizayn: boshlang‘ichdan portfoliogacha",
        "description": "Kompozitsiya, tipografika, brending va yakuniy portfolio loyihasi.",
        "goal": "portfolio",
        "keywords": ["graphic", "grafik", "brand", "branding"],
        "accent": "#7c3aed",
    },
    {
        "slug": "fashion-dizayn",
        "title": "Fashion dizayn: asoslardan kolleksiyagacha",
        "description": "Moda asoslari, eskiz, material va yakuniy kolleksiya.",
        "goal": "collection",
        "keywords": ["fashion", "moda", "textile", "tekstil"],
        "accent": "#db2777",
    },
    {
        "slug": "ui-ux",
        "title": "UI/UX: research’dan case study’gacha",
        "description": "Research, information architecture, prototip va portfolio case study.",
        "goal": "case-study",
        "keywords": ["ui", "ux", "product", "interface"],
        "accent": "#2563eb",
    },
    {
        "slug": "freelance-dizayner",
        "title": "Freelance dizayner: skill’dan mijozgacha",
        "description": "Asosiy skill, portfolio, narxlash va mijoz bilan ishlash.",
        "goal": "first-client",
        "keywords": ["freelance", "portfolio", "business", "client"],
        "accent": "#059669",
    },
]


def _template(slug: str) -> dict:
    template = next((item for item in PATHS if item["slug"] == slug), None)
    if not template:
        raise HTTPException(status_code=404, detail="Learning path topilmadi")
    return template


def _user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _path_courses(db: Session, template: dict) -> list[Course]:
    courses = (
        db.query(Course)
        .filter(Course.is_active == True)
        .order_by(Course.level.asc(), Course.id.asc())
        .all()
    )
    matched = []
    for course in courses:
        haystack = " ".join(
            [course.category or "", course.title or "", course.subtitle or ""]
        ).casefold()
        if any(keyword in haystack for keyword in template["keywords"]):
            matched.append(course)
    return (matched or courses)[:6]


def _steps(db: Session, template: dict, user_id: int | None = None) -> list[dict]:
    courses = _path_courses(db, template)
    enrollment_map = {}
    if user_id and courses:
        rows = (
            db.query(Enrollment)
            .filter(
                Enrollment.user_id == user_id,
                Enrollment.course_id.in_([course.id for course in courses]),
            )
            .all()
        )
        enrollment_map = {row.course_id: row for row in rows}

    steps = []
    previous_complete = True
    for index, course in enumerate(courses):
        enrollment = enrollment_map.get(course.id)
        progress = enrollment.progress_percent if enrollment else 0
        complete = bool(enrollment and (enrollment.completed_at or progress >= 100))
        steps.append(
            {
                "position": index + 1,
                "course": {
                    "id": course.id,
                    "title": course.title,
                    "subtitle": course.subtitle,
                    "level": course.level,
                    "duration_minutes": course.duration_minutes or 0,
                    "thumbnail_url": course.thumbnail_url,
                },
                "prerequisite_course_id": courses[index - 1].id if index else None,
                "locked": not previous_complete,
                "enrolled": enrollment is not None,
                "progress_percent": progress,
                "completed": complete,
                "final_project": index == len(courses) - 1,
            }
        )
        previous_complete = previous_complete and complete
    return steps


def _payload(db: Session, template: dict, user_id: int | None = None) -> dict:
    steps = _steps(db, template, user_id)
    complete = sum(1 for step in steps if step["completed"])
    total_minutes = sum(step["course"]["duration_minutes"] for step in steps)
    return {
        **{key: value for key, value in template.items() if key != "keywords"},
        "steps": steps,
        "courses_count": len(steps),
        "duration_minutes": total_minutes,
        "progress_percent": round(complete / len(steps) * 100) if steps else 0,
        "completed_steps": complete,
        "started": user_id is not None
        and db.query(UserLearningPath)
        .filter(
            UserLearningPath.user_id == user_id,
            UserLearningPath.path_slug == template["slug"],
        )
        .first()
        is not None,
    }


@router.get("")
def list_paths(db: Session = Depends(get_db)):
    return [_payload(db, template) for template in PATHS]


@router.get("/{slug}")
def path_detail(slug: str, db: Session = Depends(get_db)):
    return _payload(db, _template(slug))


@router.get("/{slug}/progress")
def path_progress(
    slug: str,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    payload = _payload(db, _template(slug), user.id)
    if payload["steps"] and payload["progress_percent"] == 100:
        record = (
            db.query(UserLearningPath)
            .filter(
                UserLearningPath.user_id == user.id,
                UserLearningPath.path_slug == slug,
            )
            .first()
        )
        if record and not record.completed_at:
            record.completed_at = datetime.now(UTC)
            db.commit()
    return payload


@router.post("/{slug}/start")
def start_path(
    slug: str,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = _template(slug)
    user = _user(db, email)
    record = (
        db.query(UserLearningPath)
        .filter(
            UserLearningPath.user_id == user.id,
            UserLearningPath.path_slug == slug,
        )
        .first()
    )
    if not record:
        record = UserLearningPath(user_id=user.id, path_slug=slug)
        db.add(record)
    courses = _path_courses(db, template)
    first_course = courses[0] if courses else None
    if first_course:
        enrollment = (
            db.query(Enrollment)
            .filter(
                Enrollment.user_id == user.id,
                Enrollment.course_id == first_course.id,
            )
            .first()
        )
        if not enrollment:
            db.add(Enrollment(user_id=user.id, course_id=first_course.id))
    db.commit()
    return _payload(db, template, user.id)
