"""Profile, statistics and progress endpoints."""

from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, StringConstraints, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.password import hash_password, verify_password
from app.core.security import get_current_user
from app.models.assignment import Assignment
from app.models.certificate import Certificate
from app.models.Course import Course
from app.models.progress import Progress
from app.models.user import User

router = APIRouter(prefix="/api/profile", tags=["Profile"])


def _user(db, email):
    row = db.query(User).filter(User.email == email).first()
    if not row:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return row


class ProfileUpdateRequest(BaseModel):
    name: Annotated[str, StringConstraints(min_length=2, max_length=100)]
    bio: str | None = None
    phone: str | None = None
    location: str | None = None
    website: str | None = None


class ChangePasswordRequest(BaseModel):
    current_password: Annotated[str, StringConstraints(min_length=8, max_length=128)]
    new_password: Annotated[str, StringConstraints(min_length=8, max_length=128)]

    @field_validator("new_password")
    @classmethod
    def strong(cls, value):
        if not any(c.isupper() for c in value) or not any(c.isdigit() for c in value):
            raise ValueError("Kamida 1 katta harf va 1 raqam kerak")
        return value


class ProgressUpdateRequest(BaseModel):
    percent: int
    minutes_spent: int = 0


@router.get("/me")
def get_profile(email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    return {"id": user.id, "name": user.name or "", "email": user.email, "role": user.role or "user", "provider": user.provider or "local", "is_active": user.is_active, "created_at": user.created_at, "bio": user.bio, "phone": user.phone, "location": user.location, "website": user.website, "avatar_url": user.avatar_url, "onboarding_completed": bool(user.onboarding_completed)}


@router.patch("/update")
def update_profile(data: ProfileUpdateRequest, email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    user.name = data.name
    for field in ("bio", "phone", "location", "website"):
        if getattr(data, field) is not None:
            setattr(user, field, getattr(data, field))
    db.commit()
    return {"message": "Profil muvaffaqiyatli yangilandi", "name": user.name}


@router.post("/change-password")
def change_password(data: ChangePasswordRequest, email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    if user.provider != "local" or not user.password:
        raise HTTPException(status_code=400, detail="Bu akkaunt uchun parolni o‘zgartirib bo‘lmaydi")
    if not verify_password(data.current_password, user.password):
        raise HTTPException(status_code=400, detail="Joriy parol noto‘g‘ri")
    user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "Parol muvaffaqiyatli o‘zgartirildi"}


@router.get("/stats")
def get_stats(email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _user(db, email)
    rows = db.query(Progress, Course).join(Course, Progress.course_id == Course.id).filter(Progress.user_id == user.id).all()
    total_minutes = db.query(func.sum(Progress.minutes_spent)).filter(Progress.user_id == user.id).scalar() or 0
    courses = [{"id": c.id, "title": c.title, "category": c.category or "general", "progress": p.percent, "is_completed": p.percent >= 100, "hours_spent": round((p.minutes_spent or 0) / 60, 1), "thumbnail_url": c.thumbnail_url, "last_activity": p.last_activity.isoformat() if p.last_activity else None} for p, c in rows]
    courses.sort(key=lambda item: item["last_activity"] or "", reverse=True)
    today = datetime.now(UTC).date()
    activity = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        start = datetime(day.year, day.month, day.day, tzinfo=UTC)
        minutes = db.query(func.sum(Progress.minutes_spent)).filter(Progress.user_id == user.id, Progress.last_activity >= start, Progress.last_activity < start + timedelta(days=1)).scalar() or 0
        activity.append({"date": day.isoformat(), "minutes": minutes})
    return {"courses_enrolled": len(rows), "courses_completed": sum(1 for p, _ in rows if p.percent >= 100), "hours_learned": round(total_minutes / 60, 1), "certificates": db.query(Certificate).filter(Certificate.user_id == user.id).count(), "pending_assignments": db.query(Assignment).filter(Assignment.user_id == user.id, Assignment.is_completed.is_(False)).count(), "points": user.points or 0, "streak_days": user.streak_days or 0, "level": user.level or 1, "courses": courses, "activity": activity}


@router.patch("/progress/{course_id}")
def update_progress(course_id: int, data: ProgressUpdateRequest, email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    """Legacy progress update. Certificate issuance is intentionally delegated to /api/certificates."""
    user = _user(db, email)
    course = db.query(Course).filter(Course.id == course_id, Course.is_active.is_(True)).first()
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")
    progress = db.query(Progress).filter(Progress.user_id == user.id, Progress.course_id == course_id).first()
    if not progress:
        progress = Progress(user_id=user.id, course_id=course_id, percent=0, minutes_spent=0)
        db.add(progress)
    progress.percent = min(max(data.percent, 0), 100)
    progress.minutes_spent = (progress.minutes_spent or 0) + max(data.minutes_spent, 0)
    progress.last_activity = datetime.now(UTC)
    user.points = (user.points or 0) + max(data.minutes_spent, 0)
    db.commit()
    return {"message": "Progress yangilandi", "percent": progress.percent, "points": user.points, "certificate_eligible": progress.percent >= 100, "certificate_issued": False}
