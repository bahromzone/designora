"""
Profile Router — foydalanuvchi profil va statistika
"""

from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
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


def _get_user_or_unauthorized(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


# ==================================================
# Schemas
# ==================================================
class ProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    # ✅ BUG FIX: provider va created_at User modelida bo'lmasligi mumkin → Optional
    provider: str | None = "local"
    is_active: bool = True
    created_at: datetime | None = None
    bio: str | None = None
    phone: str | None = None
    location: str | None = None
    website: str | None = None
    avatar_url: str | None = None

    class Config:
        from_attributes = True


class ProfileUpdateRequest(BaseModel):
    name: Annotated[str, StringConstraints(min_length=2, max_length=100)]
    bio: Annotated[str, StringConstraints(max_length=500)] | None = None
    phone: Annotated[str, StringConstraints(max_length=20)] | None = None
    location: Annotated[str, StringConstraints(max_length=100)] | None = None
    website: Annotated[str, StringConstraints(max_length=200)] | None = None


class ChangePasswordRequest(BaseModel):
    current_password: Annotated[str, StringConstraints(min_length=8, max_length=128)]
    new_password: Annotated[str, StringConstraints(min_length=8, max_length=128)]

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Kamida 1 ta katta harf kerak")
        if not any(c.isdigit() for c in v):
            raise ValueError("Kamida 1 ta raqam kerak")
        return v


class ProgressUpdateRequest(BaseModel):
    percent: int
    minutes_spent: int | None = 0


# ==================================================
# GET /api/profile/me
# ==================================================
@router.get("/me", response_model=ProfileResponse)
def get_profile(email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _get_user_or_unauthorized(db, email)

    return ProfileResponse(
        id=user.id,
        name=user.name or "",
        email=user.email,
        role=getattr(user, "role", "user") or "user",
        # ✅ BUG FIX: getattr + default — None bo'lsa default ishlatiladi
        provider=getattr(user, "provider", None) or "local",
        is_active=getattr(user, "is_active", True) or True,
        created_at=getattr(user, "created_at", None),
        bio=getattr(user, "bio", None),
        phone=getattr(user, "phone", None),
        location=getattr(user, "location", None),
        website=getattr(user, "website", None),
        avatar_url=getattr(user, "avatar_url", None),
    )


# ==================================================
# PATCH /api/profile/update
# ==================================================
@router.patch("/update")
def update_profile(
    data: ProfileUpdateRequest,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user_or_unauthorized(db, email)

    user.name = data.name
    for field in ["bio", "phone", "location", "website"]:
        if hasattr(user, field) and getattr(data, field) is not None:
            setattr(user, field, getattr(data, field))

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Ma'lumotlarni saqlashda xatolik")

    return JSONResponse(
        {"message": "Profil muvaffaqiyatli yangilandi", "name": user.name}
    )


# ==================================================
# POST /api/profile/change-password
# ==================================================
@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user_or_unauthorized(db, email)

    if user.provider != "local":
        raise HTTPException(
            status_code=400,
            detail=f"Siz {user.provider} orqali kirganingiz uchun parolni bu yerda o'zgartira olmaysiz",
        )

    if not user.password:
        raise HTTPException(status_code=400, detail="Parol o'rnatilmagan")

    if not verify_password(data.current_password, user.password):
        raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri")

    if verify_password(data.new_password, user.password):
        raise HTTPException(
            status_code=400, detail="Yangi parol joriy paroldan farq qilishi kerak"
        )

    user.password = hash_password(data.new_password)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Parolni saqlashda xatolik")

    return JSONResponse({"message": "Parol muvaffaqiyatli o'zgartirildi"})


# ==================================================
# GET /api/profile/stats
# ==================================================
@router.get("/stats")
def get_stats(email: str = Depends(get_current_user), db: Session = Depends(get_db)):
    user = _get_user_or_unauthorized(db, email)

    try:
        progress_rows = (
            db.query(Progress, Course)
            .join(Course, Progress.course_id == Course.id)
            .filter(Progress.user_id == user.id)
            .all()
        )
    except Exception:
        db.rollback()
        progress_rows = []

    courses_enrolled = len(progress_rows)
    courses_completed = sum(1 for p, _ in progress_rows if p.percent >= 100)

    # ✅ BUG #12 FIX: hours_spent → minutes_spent (ustun nomi o'zgartirildi)
    total_minutes = (
        db.query(func.sum(Progress.minutes_spent))
        .filter(Progress.user_id == user.id)
        .scalar()
        or 0
    )
    hours_learned = round(total_minutes / 60, 1)

    certificates_count = (
        db.query(Certificate).filter(Certificate.user_id == user.id).count()
    )

    pending_assignments = (
        db.query(Assignment)
        .filter(Assignment.user_id == user.id, Assignment.is_completed == False)
        .count()
    )

    courses_list = []
    for prog, course in progress_rows:
        courses_list.append(
            {
                "id": course.id,
                "title": course.title,
                "category": course.category or "general",
                "progress": prog.percent,
                "is_completed": prog.percent >= 100,
                # ✅ BUG #12 FIX: hours_spent → minutes_spent
                "hours_spent": round(
                    (getattr(prog, "minutes_spent", None) or 0) / 60, 1
                ),
                "thumbnail_url": getattr(course, "thumbnail_url", None),
                "last_activity": (
                    prog.last_activity.isoformat() if prog.last_activity else None
                ),
            }
        )
    courses_list.sort(key=lambda x: x["last_activity"] or "", reverse=True)

    today = datetime.now(UTC).date()
    activity = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day, tzinfo=UTC)
        day_end = day_start + timedelta(days=1)

        # ✅ BUG #12 FIX: hours_spent → minutes_spent
        day_minutes = (
            db.query(func.sum(Progress.minutes_spent))
            .filter(
                Progress.user_id == user.id,
                Progress.last_activity >= day_start,
                Progress.last_activity < day_end,
            )
            .scalar()
            or 0
        )
        activity.append({"date": day.isoformat(), "minutes": day_minutes})

    return {
        "courses_enrolled": courses_enrolled,
        "courses_completed": courses_completed,
        "hours_learned": hours_learned,
        "certificates": certificates_count,
        "pending_assignments": pending_assignments,
        "points": user.points or 0,
        "streak_days": user.streak_days or 0,
        "level": user.level or 1,
        "courses": courses_list,
        "activity": activity,
    }


# ==================================================
# PATCH /api/profile/progress/:course_id
# ==================================================
@router.patch("/progress/{course_id}")
def update_progress(
    course_id: int,
    data: ProgressUpdateRequest,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user_or_unauthorized(db, email)

    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.is_active == True)
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    progress = (
        db.query(Progress)
        .filter(Progress.user_id == user.id, Progress.course_id == course_id)
        .first()
    )

    if not progress:
        progress = Progress(
            user_id=user.id, course_id=course_id, percent=0, minutes_spent=0
        )
        db.add(progress)

    progress.percent = min(max(data.percent, 0), 100)
    # ✅ BUG #12 FIX: hours_spent → minutes_spent
    progress.minutes_spent = (getattr(progress, "minutes_spent", None) or 0) + (
        data.minutes_spent or 0
    )
    progress.last_activity = datetime.now(UTC)

    # ✅ BUG #6 FIX: Pointlar ikki marta qo'shilish muammosi hal qilindi.
    # Avvalgi mantiq:
    #   1) Kurs tugasa: +100 ball (sertifikat uchun)
    #   2) DOIM: +minutes_spent ball  ← kurs tugaganda ham ishlardi → ikki marta!
    #
    # Yangi mantiq: faqat BIR MARTA qo'shiladi.
    # Kurs yangi tugagan bo'lsa: +100 (sertifikat) + minutes_spent (bu sessiya)
    # Kurs avval tugagan bo'lsa yoki hali tugamasa: faqat +minutes_spent
    if progress.percent >= 100:
        existing_cert = (
            db.query(Certificate)
            .filter(Certificate.user_id == user.id, Certificate.course_id == course_id)
            .first()
        )
        if not existing_cert:
            cert = Certificate(
                user_id=user.id,
                course_id=course_id,
                title=f"{course.title} sertifikati",
                issued_at=datetime.now(UTC),
            )
            db.add(cert)
            # Sertifikat bonusi + bu sessiyaning minutlari — faqat bir marta
            user.points = (user.points or 0) + 100 + (data.minutes_spent or 0)
        else:
            # Kurs avval tugagan — faqat dars vaqti uchun ball
            user.points = (user.points or 0) + (data.minutes_spent or 0)
    else:
        # Kurs hali tugamagan — faqat dars vaqti uchun ball
        user.points = (user.points or 0) + (data.minutes_spent or 0)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Saqlashda xatolik")

    return JSONResponse(
        {
            "message": "Progress yangilandi",
            "percent": progress.percent,
            "points": user.points,
        }
    )
