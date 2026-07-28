"""Admin users router with server-side search, filters and pagination."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/admin", tags=["Admin - Users"])
_ADMIN_ROLES = {"admin", "superadmin"}


def require_admin(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Hisobingiz bloklangan")
    if user.role not in _ADMIN_ROLES:
        raise HTTPException(status_code=403, detail="Faqat adminlar uchun")
    return user


def _serialize(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def _list_users(
    db: Session,
    q: str | None,
    role: str | None,
    status: str | None,
    page: int,
    per_page: int,
) -> dict:
    query = db.query(User)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(or_(User.name.ilike(term), User.email.ilike(term)))
    if role and role != "all":
        query = query.filter(User.role == role)
    if status and status != "all":
        query = query.filter(User.is_active.is_(status == "active"))

    total = query.count()
    users = (
        query.order_by(User.id.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {
        "items": [_serialize(user) for user in users],
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": (total + per_page - 1) // per_page,
    }


@router.get("/users")
def list_users(
    q: str | None = None,
    role: str | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return _list_users(db, q, role, status, page, per_page)
