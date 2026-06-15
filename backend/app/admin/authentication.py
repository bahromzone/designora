"""
SQLAdmin Authentication Backend
Admin panelga kirish uchun authentication
"""
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.password import verify_password
from app.models.user import User
import logging

logger = logging.getLogger(__name__)


class AdminAuth(AuthenticationBackend):
    """
    SQLAdmin uchun authentication backend
    Faqat role="admin" bo'lgan userlar kirishlari mumkin
    """

    async def login(self, request: Request) -> bool:
        """
        Login form submit qilinganda chaqiriladi
        """
        form = await request.form()
        username = form.get("username")  # SQLAdmin default: username
        password = form.get("password")

        logger.info(f"Admin login attempt: {username}")

        # Database session
        db: Session = SessionLocal()

        try:
            # User topish (email bo'yicha)
            user = db.query(User).filter(User.email == username).first()

            # Tekshirish
            if not user:
                logger.warning(f"Admin login failed: User not found - {username}")
                return False

            if not verify_password(password, user.password):
                logger.warning(f"Admin login failed: Wrong password - {username}")
                return False

            if user.role != "admin":
                logger.warning(f"Admin login failed: Not admin role - {username}")
                return False

            # ✅ SUCCESS - Session ga saqlash
            # session ni to'liq tozalab, qaytadan yozamiz
            request.session.clear()
            request.session["user"] = {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "name": user.name,
            }
            logger.info(f"Admin login successful: {username}")
            return True

        except Exception as e:
            logger.error(f"Admin login error: {e}")
            return False
        finally:
            db.close()

    async def logout(self, request: Request) -> bool:
        """
        Logout qilinganda chaqiriladi
        """
        user_email = request.session.get("user", {}).get("email", "unknown")
        logger.info(f"Admin logout: {user_email}")

        # Session tozalash
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        """
        Har bir admin sahifaga kirishda tekshiriladi.
        """
        try:
            # Sensitive session/cookie details only at DEBUG level (never INFO in prod logs)
            logger.debug(f"[AUTHENTICATE] session keys: {list(request.session.keys())}")
            logger.debug(f"[AUTHENTICATE] cookies: {list(request.cookies.keys())}")

            user = request.session.get("user")
            if not user:
                logger.warning("[AUTHENTICATE] No user in session → False")
                return False
            if isinstance(user, dict):
                role = user.get("role")
                logger.debug(f"[AUTHENTICATE] role={role}")
                return role == "admin"
            return False
        except Exception as e:
            logger.error(f"[AUTHENTICATE] Error: {e}")
            return False