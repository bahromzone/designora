import logging
from logging.handlers import RotatingFileHandler
import os
import uvicorn
from fastapi import APIRouter, FastAPI, Request, status, Depends
from fastapi.responses import JSONResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session

from app.core.config import settings, limiter
from app.core.database import Base, engine, get_db
from app.core.middleware import (
    SecurityHeadersMiddleware,
    RequestLoggingMiddleware,
    IPBlockingMiddleware,
)
from app.core.security import get_current_user
from app.models.user import User
from app.models.Course import Course

from app.routers import auth, google, users, pages, profile
from app.routers import admin_courses
from app.routers.auth import public_router

# ── LOGGING ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        RotatingFileHandler("app.log", maxBytes=10_000_000, backupCount=5),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# ── APP ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Designora Platform",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# ── DATABASE ─────────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── MIDDLEWARES ───────────────────────────────────────────────────────────────
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    https_only=settings.ENVIRONMENT == "production",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(IPBlockingMiddleware)

# ── RATE LIMITER ──────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── STATIC & TEMPLATES ───────────────────────────────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# ── SQLADMIN ─────────────────────────────────────────────────────────────────
# ✅ BUG #9 FIX: setup_admin() taniqlanmagan (never called) edi.
# Admin panel butunlay mount qilinmagan — /sqladmin yo'qligi uchun.
# Endi app yaratilgandan keyin darhol chaqiriladi.
from app.admin.admin_panel import setup_admin
setup_admin(app)

# ── ROUTERS ───────────────────────────────────────────────────────────────────
app.include_router(profile.router)
app.include_router(admin_courses.router)
app.include_router(pages.router)
app.include_router(public_router)
app.include_router(auth.router)
app.include_router(google.router)
app.include_router(users.router)

# ── ADMIN USERS API ───────────────────────────────────────────────────────────
# ✅ BUG #2 FIX (qo'shimcha): /api/admin/users avval admin_courses.py da
# noto'g'ri prefix ostida edi → hech qachon ishlamasdi.
# Endi to'g'ri /api/admin/users da ro'yxatdan o'tkaziladi.
_admin_router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _require_admin(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Faqat adminlar uchun")
    return user


@_admin_router.get("/users")
def admin_list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(_require_admin),
):
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
        }
        for u in db.query(User).order_by(User.id.desc()).all()
    ]


app.include_router(_admin_router)

# ── ASOSIY SAHIFA ────────────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "static_version": os.getenv("APP_VERSION", "1.0"),
    })


# ── /api/me → /api/profile/me ────────────────────────────────────────────────
@app.get("/api/me")
def me():
    return RedirectResponse(url="/api/profile/me", status_code=307)


# ── XATO HANDLERI ─────────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
    )


# ── RUN ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=settings.ENVIRONMENT != "production",
    )