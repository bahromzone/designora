# ruff: noqa: I001, E501
import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.sessions import SessionMiddleware

from app.admin.admin_panel import setup_admin
from app.core.config import limiter, settings
from app.core.middleware import IPBlockingMiddleware, RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.routers import admin_courses, admin_payments, admin_users, analytics, assignments, assignments_upload, auth, blog, calendar, certificates, checkout_experience, course_access_codes, course_builder, course_forum, courses_api, dashboard, discovery, forum, gamification, google, instructor, instructor_applications, instructor_analytics, instructors, learning, learning_paths, media, moderation, monetization, notes, notifications, pages, payment_history, payments, portfolio, privacy, profile, qa, quiz_instructor_list, quiz, referrals, reviews, saved_courses, superadmin, system, token, uploads, users, video_uploads
from app.routers.auth import public_router

_log_handlers: list[logging.Handler] = [logging.StreamHandler()]
_log_file = os.getenv("LOG_FILE", "")
if _log_file:
    _log_handlers.append(RotatingFileHandler(_log_file, maxBytes=10_000_000, backupCount=5))
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", handlers=_log_handlers)
app = FastAPI(title="Designora Platform", docs_url="/docs" if settings.ENVIRONMENT != "production" else None, redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None)
app.add_middleware(SessionMiddleware, secret_key=settings.SESSION_SECRET_KEY, https_only=settings.ENVIRONMENT == "production")
app.add_middleware(CORSMiddleware, allow_origins=settings.get_allowed_origins(), allow_credentials=True, allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"], allow_headers=["Content-Type", "Authorization", "X-CSRF-Token", "X-Access-Token", "X-Requested-With"])
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(IPBlockingMiddleware)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
for r in (profile.router, admin_courses.router, admin_payments.router, admin_users.router, analytics.router, assignments.router, assignments_upload.router, blog.router, calendar.router, certificates.router, checkout_experience.router, course_access_codes.admin_router, course_access_codes.router, course_builder.router, course_forum.router, courses_api.router, dashboard.router, discovery.router, forum.router, gamification.router, google.router, instructor_applications.router, instructor.router, instructor_analytics.router, instructors.router, learning.router, learning_paths.router, media.router, moderation.router, monetization.router, notes.router, notifications.router, pages.router, payments.router, payment_history.router, portfolio.router, privacy.router, qa.router, quiz.router, quiz_instructor_list.router, referrals.router, reviews.router, saved_courses.router, superadmin.router, system.router, token.router, uploads.router, video_uploads.router, users.router, public_router, auth.router):
    app.include_router(r)

@app.get("/")
def home():
    return {"app": "Designora API", "status": "ok", "version": os.getenv("APP_VERSION", "1.0"), "docs": "/docs"}

@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "designora-api", "version": os.getenv("APP_VERSION", "1.0")}

@app.get("/api/me")
def me():
    return RedirectResponse(url="/api/profile/me", status_code=307)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logging.getLogger(__name__).exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"detail": "Internal server error" if settings.ENVIRONMENT == "production" else str(exc)})

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=settings.ENVIRONMENT != "production")
