from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
# ✅ FIX: PyCharm authlib uchun type stub yo'qligi sababli
# "Cannot find reference 'starlette_client'" va
# "Unresolved reference 'OAuth' / 'OAuthError'" xatolarini ko'rsatadi.
# Bu faqat IDE static analysis muammosi — runtime da to'g'ri ishlaydi.
# Yechim: # type: ignore[import] + try/except
try:
    from authlib.integrations.starlette_client import OAuth, OAuthError  # type: ignore[import]
except ImportError as _e:  # pragma: no cover
    raise RuntimeError(
        "authlib o'rnatilmagan. "
        "Quyidagi buyruqni bajaring: pip install authlib"
    ) from _e
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.models.user import User
from app.core.logger import logger
from app.utils.routes import dashboard_path_for_role

router = APIRouter()

oauth = OAuth()
oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


@router.get("/auth/google")
async def google_login(request: Request):
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/auth/google/callback")
async def google_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    # ✅ BUG #9 FIX: OAuthError ushlanmayotgan edi — foydalanuvchi login ni
    # bekor qilsa yoki token noto'g'ri bo'lsa ilova crash qilardi (500).
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as e:
        logger.warning(f"Google OAuth error: {e}")
        return RedirectResponse("/?modal=login&error=oauth_failed")

    userinfo = token["userinfo"]
    if not userinfo.get("email_verified", False):
        return RedirectResponse("/?modal=login&error=email_not_verified")

    email = userinfo["email"]
    name = userinfo.get("name")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            name=name,
            provider="google",
            role="user"
        )
        db.add(user)
        db.commit()

    jwt_token = create_access_token(email)

    response = RedirectResponse(dashboard_path_for_role(user.role))
    response.set_cookie(
        key="access_token",
        value=f"Bearer {jwt_token}",
        httponly=True,
        # ✅ BUG #8 FIX: secure=False hardcode edi → settings dan o'qiladi
        # ✅ BUG #8 FIX: samesite="lax" edi → auth.py bilan mos "strict" ga o'zgartirildi
        secure=settings.ENVIRONMENT == "production",
        samesite="strict",
        max_age=3600,
    )
    return response
