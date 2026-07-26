"""
SQLAdmin Authentication Backend
Admin panelga kirish uchun authentication
"""

import logging

from sqladmin.authentication import AuthenticationBackend
from sqlalchemy.orm import Session
from starlette.requests import Request

from app.core.database import SessionLocal
from app.core.password import verify_password
from app.models.user import User

logger = logging.getLogger(__name__)
_ADMIN_ROLES = {"admin", "superadmin"}


class AdminAuth(AuthenticationBackend):
    """SQLAdmin uchun admin yoki superadmin authentication backend."""

    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")
        logger.info("Admin login attempt: %s", username)
        db: Session = SessionLocal()
        try:
            user = db.query(User).filter(User.email == username).first()
            if not user or not user.password or not verify_password(password, user.password):
                logger.warning("Admin login failed: invalid credentials - %s", username)
                return False
            if user.role not in _ADMIN_ROLES or not user.is_active:
                logger.warning("Admin login failed: insufficient permission - %s", username)
                return False
            request.session.clear()
            request.session["user"] = {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "name": user.name,
            }
            logger.info("Admin login successful: %s", username)
            return True
        except Exception as exc:
            logger.error("Admin login error: %s", exc)
            return False
        finally:
            db.close()

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        try:
            user = request.session.get("user")
            return isinstance(user, dict) and user.get("role") in _ADMIN_ROLES
        except Exception as exc:
            logger.error("Admin authentication error: %s", exc)
            return False
