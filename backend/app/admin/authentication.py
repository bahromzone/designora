"""SQLAdmin authentication backend."""
import logging
from sqladmin.authentication import AuthenticationBackend
from sqlalchemy.orm import Session
from starlette.requests import Request
from app.core.database import SessionLocal
from app.core.password import verify_password
from app.models.user import User

logger=logging.getLogger(__name__)
_ADMIN_ROLES={"admin","superadmin"}

class AdminAuth(AuthenticationBackend):
    async def login(self,request:Request)->bool:
        form=await request.form();username=form.get("username");password=form.get("password");db:Session=SessionLocal()
        try:
            user=db.query(User).filter(User.email==username).first()
            if not user or not user.password or not verify_password(password,user.password): return False
            if user.role not in _ADMIN_ROLES or not user.is_active: return False
            request.session.clear();request.session["user"]={"id":user.id,"email":user.email,"role":user.role,"name":user.name};return True
        except Exception as exc:
            logger.error("Admin login error: %s",exc);return False
        finally: db.close()
    async def logout(self,request:Request)->bool:
        request.session.clear();return True
    async def authenticate(self,request:Request)->bool:
        user=request.session.get("user")
        if not isinstance(user,dict) or user.get("role") not in _ADMIN_ROLES: return False
        db:Session=SessionLocal()
        try:
            current=db.query(User).filter(User.email==user.get("email")).first()
            return bool(current and current.is_active and current.role in _ADMIN_ROLES)
        finally: db.close()
