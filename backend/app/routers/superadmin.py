from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.audit_log import AdminAuditLog
from app.models.Course import Course
from app.models.user import User
router = APIRouter(prefix="/api/superadmin", tags=["Superadmin"])
def require_superadmin(email: str = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or user.role != "superadmin": raise HTTPException(status_code=403, detail="Faqat superadminlar uchun")
    if not user.is_active: raise HTTPException(status_code=403, detail="Hisobingiz bloklangan")
    return user
class RoleUpdate(BaseModel): role: Literal["user", "instructor", "admin", "superadmin"]
class StatusUpdate(BaseModel): is_active: bool
@router.get("/overview")
def overview(db: Session = Depends(get_db), _: User = Depends(require_superadmin)):
    counts = dict(db.query(User.role, func.count(User.id)).group_by(User.role).all())
    return {"users_total":db.query(User).count(),"users_active":db.query(User).filter(User.is_active.is_(True)).count(),"admins":counts.get("admin",0),"superadmins":counts.get("superadmin",0),"instructors":counts.get("instructor",0),"students":counts.get("user",0),"courses":db.query(Course).count()}
@router.get("/users")
def list_users(page: int = Query(1, ge=1), per_page: int = Query(25, ge=1, le=100), q: str | None = None, role: str | None = None, status: str | None = None, db: Session = Depends(get_db), _: User = Depends(require_superadmin)):
    query = db.query(User)
    if q: query = query.filter((User.name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%")))
    if role and role != "all": query = query.filter(User.role == role)
    if status == "active": query = query.filter(User.is_active.is_(True))
    if status == "inactive": query = query.filter(User.is_active.is_(False))
    total = query.count(); rows = query.order_by(User.id.desc()).offset((page-1)*per_page).limit(per_page).all()
    return {"items":[{"id":u.id,"email":u.email,"name":u.name,"role":u.role,"is_active":u.is_active,"created_at":u.created_at.isoformat() if u.created_at else None} for u in rows],"total":total,"page":page,"per_page":per_page,"pages":(total+per_page-1)//per_page}
@router.get("/audit")
def audit_logs(db: Session = Depends(get_db), _: User = Depends(require_superadmin)):
    rows=db.query(AdminAuditLog,User).join(User,User.id==AdminAuditLog.actor_id).order_by(AdminAuditLog.created_at.desc()).limit(200).all()
    return [{"id":l.id,"actor_id":l.actor_id,"actor_name":a.name or a.email,"action":l.action,"target_id":l.target_id,"target_type":l.target_type,"old_value":l.old_value,"new_value":l.new_value,"ip_address":l.ip_address,"created_at":l.created_at.isoformat() if l.created_at else None} for l,a in rows]
@router.patch("/users/{user_id}/role")
def update_role(user_id:int,data:RoleUpdate,request:Request,db:Session=Depends(get_db),actor:User=Depends(require_superadmin)):
    if actor.id==user_id: raise HTTPException(status_code=400,detail="O'zingizning rolingizni o'zgartira olmaysiz")
    user=db.query(User).filter(User.id==user_id).first()
    if not user: raise HTTPException(status_code=404,detail="Foydalanuvchi topilmadi")
    old=user.role; user.role=data.role; db.add(AdminAuditLog(actor_id=actor.id,action="user.role_changed",target_id=user.id,old_value={"role":old},new_value={"role":data.role},ip_address=request.client.host if request.client else None));db.commit();return {"message":"Rol yangilandi","id":user.id,"role":user.role}
@router.patch("/users/{user_id}/status")
def update_status(user_id:int,data:StatusUpdate,request:Request,db:Session=Depends(get_db),actor:User=Depends(require_superadmin)):
    if actor.id==user_id and not data.is_active: raise HTTPException(status_code=400,detail="O'zingizni bloklay olmaysiz")
    user=db.query(User).filter(User.id==user_id).first()
    if not user: raise HTTPException(status_code=404,detail="Foydalanuvchi topilmadi")
    old=user.is_active; user.is_active=data.is_active; db.add(AdminAuditLog(actor_id=actor.id,action="user.status_changed",target_id=user.id,old_value={"is_active":old},new_value={"is_active":data.is_active},ip_address=request.client.host if request.client else None));db.commit();return {"message":"Hisob holati yangilandi","id":user.id,"is_active":user.is_active}
