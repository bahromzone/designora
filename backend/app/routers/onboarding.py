"""Persistent onboarding profile and personalized recommendations."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.Course import Course
from app.models.user import User
from app.services import recommendation_service

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])
_GOALS = {"career", "freelance", "portfolio", "hobby"}
_LEVELS = {"beginner", "intermediate", "advanced"}
_LANGUAGES = {"uz", "ru", "en"}


class OnboardingIn(BaseModel):
    goal: str
    interests: list[str] = Field(min_length=1, max_length=3)
    level: str
    weekly_hours: int = Field(ge=1, le=40)
    preferred_language: str = "uz"
    reminder_time: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    completed: bool = False

    @field_validator("goal")
    @classmethod
    def valid_goal(cls, value):
        if value not in _GOALS:
            raise ValueError("Noto‘g‘ri maqsad")
        return value

    @field_validator("level")
    @classmethod
    def valid_level(cls, value):
        if value not in _LEVELS:
            raise ValueError("Noto‘g‘ri daraja")
        return value

    @field_validator("preferred_language")
    @classmethod
    def valid_language(cls, value):
        if value not in _LANGUAGES:
            raise ValueError("Noto‘g‘ri til")
        return value


def _user(db, email):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _profile(user):
    return {
        "goal": user.learning_goal,
        "interests": user.learning_interests or [],
        "level": user.experience_level,
        "weekly_hours": user.weekly_learning_hours,
        "preferred_language": user.preferred_language or "uz",
        "reminder_time": user.reminder_time,
        "completed": bool(user.onboarding_completed),
    }


@router.get("")
def get_onboarding(email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    return _profile(_user(db, email))


@router.put("")
def save_onboarding(data: OnboardingIn, email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    user.learning_goal = data.goal
    user.learning_interests = list(dict.fromkeys(data.interests))
    user.experience_level = data.level
    user.weekly_learning_hours = data.weekly_hours
    user.preferred_language = data.preferred_language
    user.reminder_time = data.reminder_time
    user.onboarding_completed = data.completed
    db.commit()
    return _profile(user)


@router.get("/recommendations")
def onboarding_recommendations(limit: int = 6, email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    courses = db.query(Course).filter(Course.is_active.is_(True)).all()
    payload = [{"id": c.id, "title": c.title, "category": c.category, "level": c.level, "language": c.language, "rating_avg": c.rating_avg or 0, "students_count": c.students_count or 0} for c in courses]
    return recommendation_service.personalized(payload, interests=user.learning_interests or [], level=user.experience_level, language=user.preferred_language, limit=min(max(limit, 1), 20))
