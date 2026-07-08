import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path

import uvicorn
from fastapi import APIRouter, Depends, FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware

from app.admin.admin_panel import setup_admin
from app.core.config import limiter, settings
from app.core.database import Base, engine, get_db
from app.core.middleware import (
    IPBlockingMiddleware,
    RequestLoggingMiddleware,
    SecurityHeadersMiddleware,
)
from app.core.security import get_current_user
from app.models.user import User
from app.routers import (
    admin_courses,
    auth,
    certificates,
    courses_api,
    discovery,
    google,
    instructor,
    learning,
    media,
    notes,
    profile,
    qa,
    quiz,
    reviews,
    users,
)
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
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-CSRF-Token",
        "X-Access-Token",
        "X-Requested-With",
    ],
)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(IPBlockingMiddleware)

# ── RATE LIMITER ──────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── STATIC ───────────────────────────────────────────────────────────────────
# Absolyut yo'l — server qaysi papkadan ishga tushirilishidan qat'i nazar ishlaydi
BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

setup_admin(app)

# ── ROUTERS ───────────────────────────────────────────────────────────────────
app.include_router(profile.router)
app.include_router(admin_courses.router)
app.include_router(courses_api.router)
app.include_router(learning.router)
app.include_router(instructor.router)
app.include_router(public_router)
app.include_router(auth.router)
app.include_router(google.router)
app.include_router(users.router)

# ── BOSQICH 1-2 routerlari (React frontend ulanishi uchun) ────────────────────
app.include_router(discovery.router)
app.include_router(quiz.router)
app.include_router(reviews.router)
app.include_router(qa.router)
app.include_router(notes.router)
app.include_router(certificates.router)
app.include_router(media.router)

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
# UI endi to'liq React frontend'da (frontend/ papkasi, Vite dev: 5173-port).
# Backend faqat JSON API xizmatini bajaradi.
@app.get("/")
def home():
    return {
        "app": "Designora API",
        "status": "ok",
        "version": os.getenv("APP_VERSION", "1.0"),
        "docs": "/docs",
    }


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
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=settings.ENVIRONMENT != "production",
    )
