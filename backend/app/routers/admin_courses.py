"""
Admin Courses Router — Kurslarni boshqarish (CRUD)
Faqat admin roli uchun.
Prefix: /api/admin/courses
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, StringConstraints
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.Course import Course
from app.models.user import User

router = APIRouter(prefix="/api/admin/courses", tags=["Admin - Courses"])


# ── YORDAMCHI: admin tekshiruvi ───────────────────────────────────────────────
def require_admin(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Faqat adminlar uchun")
    return user


# ── SCHEMAS ───────────────────────────────────────────────────────────────────
class CourseCreate(BaseModel):
    title: Annotated[str, StringConstraints(min_length=3, max_length=200)]
    description: str | None = None
    category: str | None = None
    price: int | None = 0
    thumbnail_url: str | None = None
    is_active: bool | None = True


class CourseUpdate(BaseModel):
    title: Annotated[str, StringConstraints(min_length=3, max_length=200)] | None = None
    description: str | None = None
    category: str | None = None
    price: int | None = None
    thumbnail_url: str | None = None
    is_active: bool | None = None


# ── GET /api/admin/users ──────────────────────────────────────────────────────
# ✅ BUG #2 FIX: Avval @router.get("/api/admin/users") edi.
# router prefix /api/admin/courses bo'lgani uchun haqiqiy URL:
#   /api/admin/courses/api/admin/users → 404
# Endi to'g'ri: /api/admin/users → prefix siz alohida APIRouter ga ko'chirildi.
# Yechim: bu endpointni alohida router orqali chiqaramiz.
# (admin_courses.py da faqat /api/admin/courses/* bo'lishi mantiqan to'g'ri)


@router.get("/api/admin/users", include_in_schema=False)
def _wrong_users_route():
    """Bu route avval noto'g'ri joyda edi — endi 410 Gone qaytaradi."""
    raise HTTPException(
        status_code=410, detail="Bu endpoint ko'chirildi. /api/admin/users ishlatilsin."
    )


# ── GET /api/admin/courses ────────────────────────────────────────────────────
@router.get("")
def list_courses(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    courses = db.query(Course).order_by(Course.id.desc()).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "category": c.category,
            "price": c.price,
            "is_active": c.is_active,
            "thumbnail_url": c.thumbnail_url,
            "description": c.description,
        }
        for c in courses
    ]


# ── POST /api/admin/courses ───────────────────────────────────────────────────
@router.post("", status_code=201)
def create_course(
    data: CourseCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    course = Course(
        title=data.title,
        description=data.description,
        category=data.category.lower() if data.category else None,
        price=data.price or 0,
        thumbnail_url=data.thumbnail_url,
        is_active=data.is_active if data.is_active is not None else True,
        instructor_id=admin.id,
    )
    db.add(course)
    try:
        db.commit()
        db.refresh(course)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Saqlashda xatolik: {e}")

    return JSONResponse(
        status_code=201,
        content={
            "message": "Kurs muvaffaqiyatli qo'shildi",
            "id": course.id,
            "title": course.title,
        },
    )


# ── PATCH /api/admin/courses/{id} ────────────────────────────────────────────
@router.patch("/{course_id}")
def update_course(
    course_id: int,
    data: CourseUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    update_fields = data.model_dump(exclude_none=True)
    if "category" in update_fields and update_fields["category"]:
        update_fields["category"] = update_fields["category"].lower()

    for field, value in update_fields.items():
        setattr(course, field, value)

    try:
        db.commit()
        db.refresh(course)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Yangilashda xatolik: {e}")

    return JSONResponse({"message": "Kurs yangilandi", "id": course.id})


# ── DELETE /api/admin/courses/{id} ───────────────────────────────────────────
@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    try:
        db.delete(course)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"O'chirishda xatolik: {e}")

    return JSONResponse({"message": "Kurs o'chirildi", "id": course_id})


# ── PATCH /api/admin/courses/{id}/toggle ─────────────────────────────────────
@router.patch("/{course_id}/toggle")
def toggle_course(
    course_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    course.is_active = not course.is_active
    db.commit()

    status = "faollashtirildi" if course.is_active else "o'chirildi"
    return JSONResponse({"message": f"Kurs {status}", "is_active": course.is_active})
