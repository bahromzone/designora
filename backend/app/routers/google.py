from urllib.parse import quote

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

try:
    from authlib.integrations.starlette_client import (  # type: ignore[import]
        OAuth,
        OAuthError,
    )
except ImportError as _e:  # pragma: no cover
    raise RuntimeError(
        "authlib o'rnatilmagan. " "Quyidagi buyruqni bajaring: pip install authlib"
    ) from _e
from app.core.config import settings
from app.core.database import get_db
from app.core.logger import logger
from app.core.security import create_access_token
from app.models.user import User
from app.utils.routes import dashboard_path_for_role

router = APIRouter()

# Google discovery hujjatini olishda tashqi tarmoqqa chiqiladi.
# Timeout bo'lmasa so'rov uzoq osilib qoladi.
OAUTH_HTTP_TIMEOUT = 10.0

# Kalitlar bo'lmasa OAuth oqimini boshlashning ma'nosi yo'q: Google
# bo'sh client_id uchun "401 invalid_client" beradi, ya'ni xato bizning
# tomonda emas, foydalanuvchi ekranida chiqadi.
OAUTH_CONFIGURED = bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile",
        "timeout": OAUTH_HTTP_TIMEOUT,
    },
)


def _login_error(reason: str) -> RedirectResponse:
    """Foydalanuvchini login modaliga tushunarli xato bilan qaytarish."""
    return RedirectResponse(f"{settings.FRONTEND_URL}/?modal=login&error={reason}")


@router.get("/auth/google")
async def google_login(request: Request):
    if not OAUTH_CONFIGURED:
        logger.warning(
            "Google OAuth so'raldi, lekin GOOGLE_CLIENT_ID/SECRET sozlanmagan."
        )
        return _login_error("oauth_unavailable")

    redirect_uri = request.url_for("google_callback")
    try:
        return await oauth.google.authorize_redirect(request, redirect_uri)
    except Exception as e:  # tarmoq, timeout, metadata xatolari
        logger.warning(f"Google OAuth redirect failed: {e!r}")
        return _login_error("oauth_unreachable")


@router.get("/auth/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    if not OAUTH_CONFIGURED:
        return _login_error("oauth_unavailable")

    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        logger.warning(f"Google OAuth error: {e}")
        return _login_error("oauth_failed")
    except Exception as e:  # token almashinuvida tarmoq uzilishi
        logger.warning(f"Google OAuth token exchange failed: {e!r}")
        return _login_error("oauth_unreachable")

    userinfo = token.get("userinfo")
    if not userinfo:
        logger.warning("Google OAuth: token ichida userinfo yo'q")
        return _login_error("oauth_failed")

    if not userinfo.get("email_verified", False):
        return _login_error("email_not_verified")

    email = userinfo["email"]
    name = userinfo.get("name")
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(email=email, name=name, provider="google", role="user")
        db.add(user)
        db.commit()
        db.refresh(user)

    jwt_token = create_access_token(email)
    next_path = dashboard_path_for_role(getattr(user, "role", "user"))
    callback_url = (
        f"{settings.FRONTEND_URL}/auth/callback?next={quote(next_path, safe='')}"
        f"#token={jwt_token}"
    )
    redirect = RedirectResponse(callback_url)
    redirect.set_cookie(
        key="access_token",
        value=f"Bearer {jwt_token}",
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="strict",
        max_age=3600,
    )
    return redirect
