"""Superadmin-only control plane."""

import json
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.audit_log import AuditLog
from app.models.Course import Course
from app.models.user import User

router = APIRouter(prefix="/api/superadmin", tags=["Superadmin"])


def require_superadmin(email: str = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or user.role != "superadmin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Faqat superadminlar uchun")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Hisobingiz bloklangan")
    return user


def _audit(db: Session, request: Request, actor: User, action: str, target_id: int, old_value, new_value):
    db.add(AuditLog(actor_id=actor.id, actor_email=actor.email, action=action, target_type="user", target_id=target_id, old_value=json.dumps(old_value, ensure_ascii=False) if old_value is not None else None, new_value=json.dumps(new_value, ensure_ascii=False) if new_value is not None else None, ip_address=request.client.host if request.client else None))


def _serialize(user: User) -> dict:
    return {"id": user.id, "email": user.email, "name": user.name, "role": user.role, "is_active": user.is_active, "created_at": user.created_at.isoformat() if user.created_at else None}


class RoleUpdate(BaseModel):
    role: Literal["user", "instructor", "admin", "superadmin"]


class StatusUpdate(BaseModel):
    is_active: bool


@router.get("/overview")
def overview(db: Session = Depends(get_db), _: User = Depends(require_superadmin)):
    role_counts = dict(db.query(User.role, func.count(User.id)).group_by(User.role).all())
    return {"users_total": db.query(User).count(), "users_active": db.query(User).filter(User.is_active.is_(True)).count(), "admins": role_counts.get("admin", 0), "superadmins": role_counts.get("superadmin", 0), "instructors": role_counts.get("instructor", 0), "students": role_counts.get("user", 0), "courses": db.query(Course).count()}


@router.get("/users")
def list_users(q: str | None = None, role: str | None = None, status: str | None = None, page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100), db: Session = Depends(get_db), _: User = Depends(require_superadmin)):
    query = db.query(User)
    if q:
        term = f"%{q.strip()}%"
        query = query.filter(or_(User.name.ilike(term), User.email.ilike(term)))
    if role and role != "all": query = query.filter(User.role == role)
    if status and status != "all": query = query.filter(User.is_active.is_(status == "active"))
    total = query.count()
    users = query.order_by(User.id.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return {"items": [_serialize(user) for user in users], "page": page, "per_page": per_page, "total": total, "pages": (total + per_page - 1) // per_page}


@router.get("/audit")
def list_audit_logs(limit: int = 100, db: Session = Depends(get_db), _: User = Depends(require_superadmin)):
    limit = max(1, min(limit, 200))
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc(), AuditLog.id.desc()).limit(limit).all()
    return [{"id": log.id, "actor_id": log.actor_id, "actor_email": log.actor_email, "action": log.action, "target_type": log.target_type, "target_id": log.target_id, "old_value": log.old_value, "new_value": log.new_value, "ip_address": log.ip_address, "created_at": log.created_at.isoformat() if log.created_at else None} for log in logs]


@router.patch("/users/{user_id}/role")
def update_role(user_id: int, data: RoleUpdate, request: Request, db: Session = Depends(get_db), actor: User = Depends(require_superadmin)):
    if actor.id == user_id: raise HTTPException(status_code=400, detail="O'zingizning rolingizni o'zgartira olmaysiz")
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    old = {"role": user.role}; user.role = data.role; _audit(db, request, actor, "user.role_updated", user.id, old, {"role": user.role}); db.commit()
    return {"message": "Rol yangilandi", "id": user.id, "role": user.role}


@router.patch("/users/{user_id}/status")
def update_status(user_id: int, data: StatusUpdate, request: Request, db: Session = Depends(get_db), actor: User = Depends(require_superadmin)):
    if actor.id == user_id and not data.is_active: raise HTTPException(status_code=400, detail="O'zingizni bloklay olmaysiz")
    user = db.query(User).filter(User.id == user_id).first()
    if not user: raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")
    old = {"is_active": user.is_active}; user.is_active = data.is_active; _audit(db, request, actor, "user.status_updated", user.id, old, {"is_active": user.is_active}); db.commit()
    return {"message": "Hisob holati yangilandi", "id": user.id, "is_active": user.is_active}
