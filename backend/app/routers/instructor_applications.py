from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, StringConstraints
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.instructor_application import InstructorApplication
from app.models.user import User

router = APIRouter(prefix="/api", tags=["Instructor Applications"])
_ADMIN_ROLES = {"admin", "superadmin"}


class ApplicationIn(BaseModel):
    name: Annotated[str, StringConstraints(min_length=2, max_length=100)]
    bio: Annotated[str, StringConstraints(min_length=10, max_length=500)]
    portfolio_url: str | None = None


class ReviewIn(BaseModel):
    status: str


def current_user(
    email: str = Depends(get_current_user), db: Session = Depends(get_db)
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Hisobingiz bloklangan")
    return user


def require_admin(user: User = Depends(current_user)) -> User:
    if user.role not in _ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Faqat adminlar uchun")
    return user


@router.post("/instructor/apply")
def apply(
    data: ApplicationIn,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if user.role in {"instructor", "admin", "superadmin"}:
        return {"message": "Siz allaqachon instruktorsiz", "role": user.role}
    existing = (
        db.query(InstructorApplication)
        .filter(
            InstructorApplication.user_id == user.id,
            InstructorApplication.status == "pending",
        )
        .first()
    )
    if existing:
        return {
            "message": "Arizangiz ko'rib chiqilmoqda",
            "status": existing.status,
            "id": existing.id,
        }
    application = InstructorApplication(
        user_id=user.id, name=data.name, bio=data.bio, portfolio_url=data.portfolio_url
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return {
        "message": "Ariza yuborildi. Admin tasdiqlashini kuting.",
        "status": application.status,
        "id": application.id,
    }


@router.get("/admin/instructor-applications")
def list_applications(
    status: str = "pending",
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    rows = (
        db.query(InstructorApplication)
        .filter(InstructorApplication.status == status)
        .order_by(InstructorApplication.created_at.asc())
        .all()
    )
    return [
        {
            "id": row.id,
            "user_id": row.user_id,
            "name": row.name,
            "bio": row.bio,
            "portfolio_url": row.portfolio_url,
            "status": row.status,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]


@router.patch("/admin/instructor-applications/{application_id}")
def review_application(
    application_id: int,
    data: ReviewIn,
    db: Session = Depends(get_db),
    reviewer: User = Depends(require_admin),
):
    if data.status not in {"approved", "rejected"}:
        raise HTTPException(
            status_code=400, detail="Status approved yoki rejected bo'lishi kerak"
        )
    application = (
        db.query(InstructorApplication)
        .filter(InstructorApplication.id == application_id)
        .first()
    )
    if not application:
        raise HTTPException(status_code=404, detail="Ariza topilmadi")
    if application.status != "pending":
        raise HTTPException(
            status_code=400, detail="Bu ariza allaqachon ko'rib chiqilgan"
        )
    user = db.query(User).filter(User.id == application.user_id).first()
    if not user:
        raise HTTPException(status_code=409, detail="Ariza egasi topilmadi")
    application.status = data.status
    application.reviewed_by_id = reviewer.id
    application.reviewed_at = datetime.now(UTC)
    if data.status == "approved":
        user.name = application.name
        user.bio = application.bio
        user.website = application.portfolio_url
        user.role = "instructor"
    db.commit()
    return {
        "message": "Ariza yangilandi",
        "id": application.id,
        "status": application.status,
    }
