from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
router = APIRouter(prefix="/api/admin", tags=["Admin - Users"])
_ADMIN_ROLES = {"admin", "superadmin"}
def require_admin(email: str = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user: raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    if not user.is_active: raise HTTPException(status_code=403, detail="Hisobingiz bloklangan")
    if user.role not in _ADMIN_ROLES: raise HTTPException(status_code=403, detail="Faqat adminlar uchun")
    return user
def _serialize(u): return {"id":u.id,"name":u.name,"email":u.email,"role":u.role,"is_active":u.is_active,"created_at":u.created_at.isoformat() if u.created_at else None}
@router.get("/users")
def list_users(page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100), q: str | None = None, role: str | None = None, status: str | None = None, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    query = db.query(User)
    if q: query = query.filter((User.name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%")))
    if role and role != "all": query = query.filter(User.role == role)
    if status == "active": query = query.filter(User.is_active.is_(True))
    if status == "inactive": query = query.filter(User.is_active.is_(False))
    total = query.count(); rows = query.order_by(User.id.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {"items": [_serialize(u) for u in rows], "total": total, "page": page, "per_page": per_page, "pages": (total + per_page - 1) // per_page}
