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
from app.models.user import User
from app.routers.token import (
    issue_refresh_token,
    set_access_cookie,
    set_refresh_cookie,
)
from app.utils.routes import dashboard_path_for_role

router = APIRouter()

# Google discovery hujjatini olishda tashqi tarmoqqa chiqiladi.
# Timeout bo'lmasa so'rov uzoq osilib qoladi.
OAUTH_HTTP_TIMEOUT = 10.0

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


def _oauth_configured() -> bool:
    """Kalitlar sozlanganmi.

    Bo'sh client_id bilan ham redirect qurilaveradi va xato faqat Google
    ekranida "401 invalid_client" bo'lib chiqadi. Shu sabab oqimni oldindan
    to'xtatamiz.

    Konstanta emas, funksiya: modul darajasida hisoblansa qiymat import
    vaqtida muzlab qoladi.
    """
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)


def _login_error(reason: str) -> RedirectResponse:
    """Foydalanuvchini login modaliga tushunarli xato bilan qaytarish."""
    return RedirectResponse(f"{settings.FRONTEND_URL}/?modal=login&error={reason}")


@router.get("/auth/google")
async def google_login(request: Request):
    if not _oauth_configured():
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
    if not _oauth_configured():
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
    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            name=userinfo.get("name"),
            provider="google",
            role="user",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Parol oqimi buni /api/auth/login ichida tekshiradi. Google oqimida
    # tekshiruv faqat issue-refresh ichida bor edi va u yo'l endi
    # ishlatilmaydi, ya'ni bu yerda bo'lmasa bloklangan hisob kira olardi.
    if not user.is_active:
        logger.warning("Google OAuth: bloklangan hisob kirishga urindi (%s)", email)
        return _login_error("account_blocked")

    # Sessiya to'liq shu yerda quriladi: access + refresh cookie. Ilgari JWT
    # frontend'ga URL fragmentida (#token=) yuborilar, u esa alohida so'rov
    # bilan refresh token so'rardi. Token URL'da qolishi httpOnly cookie'ning
    # ma'nosini yo'qqa chiqarardi (brauzer tarixi, referrer, sahifa skriptlari).
    refresh_raw = issue_refresh_token(db, user, request.headers.get("user-agent"))
    db.commit()

    next_path = dashboard_path_for_role(getattr(user, "role", "user"))
    redirect = RedirectResponse(
        f"{settings.FRONTEND_URL}/auth/callback?next={quote(next_path, safe='')}"
    )
    set_access_cookie(redirect, user.email)
    set_refresh_cookie(redirect, refresh_raw)
    return redirect
