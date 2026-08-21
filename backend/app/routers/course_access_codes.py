"""Admin-issued, user-bound, one-time course access codes."""

import hashlib
import secrets
import string
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, StringConstraints
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import limiter
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.access_code import CourseAccessCode
from app.models.Course import Course
from app.models.enrollment import Enrollment
from app.models.order import Order
from app.models.user import User
from app.routers.admin_courses import require_admin
from app.services.payment_service import grant_access

router = APIRouter(prefix="/api/course-access-codes", tags=["Course access codes"])
admin_router = APIRouter(
    prefix="/api/admin/course-access-codes", tags=["Admin - Course access codes"]
)

_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def _now() -> datetime:
    return datetime.now(UTC)


def _normalize(value: str) -> str:
    return "".join(char for char in value.upper() if char in string.ascii_uppercase + string.digits)


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode("ascii")).hexdigest()


def _format(value: str) -> str:
    return "-".join(value[index : index + 4] for index in range(0, len(value), 4))


def _expired(value: datetime) -> bool:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value <= _now()


def _user(db: Session, email: str) -> User:
    user = db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Hisobingiz bloklangan")
    return user


class CreateCodeIn(BaseModel):
    course_id: int = Field(gt=0)
    user_email: Annotated[str, StringConstraints(min_length=3, max_length=320)]
    expires_in_days: int = Field(default=7, ge=1, le=30)


class RedeemCodeIn(BaseModel):
    course_id: int = Field(gt=0)
    code: Annotated[str, StringConstraints(min_length=8, max_length=32)]


@admin_router.post("", status_code=201)
def create_code(
    data: CreateCodeIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    course = (
        db.query(Course)
        .filter(Course.id == data.course_id, Course.is_active == True)  # noqa: E712
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Faol kurs topilmadi")

    target = (
        db.query(User)
        .filter(func.lower(User.email) == data.user_email.strip().lower())
        .first()
    )
    if not target or not target.is_active:
        raise HTTPException(status_code=404, detail="Faol foydalanuvchi topilmadi")
    if (
        db.query(Enrollment)
        .filter(Enrollment.user_id == target.id, Enrollment.course_id == course.id)
        .first()
    ):
        raise HTTPException(status_code=409, detail="Foydalanuvchi bu kursga ega")

    for _ in range(5):
        raw = "".join(secrets.choice(_ALPHABET) for _ in range(12))
        digest = _hash(raw)
        if not db.query(CourseAccessCode).filter_by(code_hash=digest).first():
            break
    else:  # pragma: no cover
        raise HTTPException(status_code=503, detail="Kod yaratib bo'lmadi")

    expires_at = _now() + timedelta(days=data.expires_in_days)
    row = CourseAccessCode(
        code_hash=digest,
        code_hint=raw[-4:],
        course_id=course.id,
        user_id=target.id,
        created_by_id=admin.id,
        expires_at=expires_at,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {
        "id": row.id,
        "code": _format(raw),
        "course_id": course.id,
        "course_title": course.title,
        "user_email": target.email,
        "expires_at": expires_at.isoformat(),
        "message": "Kod yaratildi. U faqat bir marta ko'rsatiladi.",
    }


@router.post("/redeem")
@limiter.limit("8/minute")
def redeem_code(
    request: Request,
    data: RedeemCodeIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _user(db, email)
    normalized = _normalize(data.code)
    if len(normalized) != 12:
        raise HTTPException(status_code=400, detail="Kod noto'g'ri yoki yaroqsiz")

    code = (
        db.query(CourseAccessCode)
        .filter(
            CourseAccessCode.code_hash == _hash(normalized),
            CourseAccessCode.course_id == data.course_id,
            CourseAccessCode.user_id == user.id,
        )
        .with_for_update()
        .first()
    )
    if (
        not code
        or code.used_at is not None
        or code.revoked_at is not None
        or _expired(code.expires_at)
    ):
        raise HTTPException(status_code=400, detail="Kod noto'g'ri yoki yaroqsiz")

    course = (
        db.query(Course)
        .filter(Course.id == data.course_id, Course.is_active == True)  # noqa: E712
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Faol kurs topilmadi")
    if (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user.id, Enrollment.course_id == course.id)
        .first()
    ):
        raise HTTPException(status_code=409, detail="Siz allaqachon bu kursga egasiz")

    order = Order(
        user_id=user.id,
        course_id=course.id,
        amount=course.price or 0,
        original_amount=course.price or 0,
        provider="admin_code",
        status="pending",
    )
    db.add(order)
    db.flush()
    grant_access(db, order)
    code.used_at = _now()
    code.order_id = order.id
    db.commit()
    return {
        "message": "Kod tasdiqlandi. Kurs sizga biriktirildi.",
        "course_id": course.id,
        "order_id": order.id,
        "status": "paid",
    }
