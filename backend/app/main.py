# ruff: noqa: I001,E701,E702
# fmt: off
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
from app.core.middleware import IPBlockingMiddleware, MetricsMiddleware, RequestLoggingMiddleware, SecurityHeadersMiddleware
from app.core.security import get_current_user
from app.models.user import User
from app.routers import admin_courses, analytics, assignments, assignments_upload, auth, blog, calendar, certificates, courses_api, discovery, forum, google, instructor, learning, learning_paths, media, notes, notifications, payments, portfolio, privacy, profile, qa, quiz, referrals, reviews, system, token, users
from app.routers.auth import public_router
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", handlers=[RotatingFileHandler("app.log", maxBytes=10_000_000, backupCount=5), logging.StreamHandler()])
logger=logging.getLogger(__name__)
app=FastAPI(title="Designora Platform",docs_url="/docs" if settings.ENVIRONMENT!="production" else None,redoc_url="/redoc" if settings.ENVIRONMENT!="production" else None)
Base.metadata.create_all(bind=engine)
app.add_middleware(SessionMiddleware,secret_key=settings.SESSION_SECRET_KEY,https_only=settings.ENVIRONMENT=="production")
app.add_middleware(CORSMiddleware,allow_origins=settings.get_allowed_origins(),allow_credentials=True,allow_methods=["GET","POST","PUT","PATCH","DELETE"],allow_headers=["Content-Type","Authorization","X-CSRF-Token","X-Access-Token","X-Requested-With"])
app.add_middleware(SecurityHeadersMiddleware);app.add_middleware(MetricsMiddleware);app.add_middleware(RequestLoggingMiddleware);app.add_middleware(IPBlockingMiddleware)
app.state.limiter=limiter;app.add_exception_handler(RateLimitExceeded,_rate_limit_exceeded_handler)
BASE_DIR=Path(__file__).resolve().parent
app.mount("/static",StaticFiles(directory=str(BASE_DIR/"static")),name="static");setup_admin(app)
for item in [profile,admin_courses,courses_api,learning,learning_paths,calendar,instructor,assignments,assignments_upload,portfolio]: app.include_router(item.router)
app.include_router(public_router)
for item in [auth,google,users,discovery,quiz,reviews,qa,notes,certificates,media,blog,forum,notifications,referrals,analytics,payments,privacy,system,token]: app.include_router(item.router)
_admin_router=APIRouter(prefix="/api/admin",tags=["Admin"])
def _require_admin(email:str=Depends(get_current_user),db:Session=Depends(get_db))->User:
 user=db.query(User).filter(User.email==email).first()
 if not user or user.role!="admin":
  from fastapi import HTTPException
  raise HTTPException(status_code=403,detail="Faqat adminlar uchun")
 return user
@_admin_router.get("/users")
def admin_list_users(db:Session=Depends(get_db),admin:User=Depends(_require_admin)):
 return [{"id":u.id,"name":u.name,"email":u.email,"role":u.role,"is_active":u.is_active} for u in db.query(User).order_by(User.id.desc()).all()]
app.include_router(_admin_router)
@app.get("/")
def home(): return {"app":"Designora API","status":"ok","version":os.getenv("APP_VERSION","1.0"),"docs":"/docs"}
@app.get("/api/me")
def me(): return RedirectResponse(url="/api/profile/me",status_code=307)
@app.exception_handler(Exception)
async def global_exception_handler(request:Request,exc:Exception):
 if settings.ENVIRONMENT=="production": return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,content={"detail":"Internal server error"})
 return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,content={"detail":str(exc)})
if __name__=="__main__": uvicorn.run("app.main:app",host="127.0.0.1",port=8000,reload=settings.ENVIRONMENT!="production")
# fmt: on
