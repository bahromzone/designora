# ruff: noqa: I001, E501
import logging,os
from logging.handlers import RotatingFileHandler
from pathlib import Path
import uvicorn
from fastapi import APIRouter,Depends,FastAPI,HTTPException,Request,status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse,RedirectResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from starlette.middleware.sessions import SessionMiddleware
from app.admin.admin_panel import setup_admin
from app.core.config import limiter,settings
from app.core.database import Base,engine,get_db
from app.core.middleware import IPBlockingMiddleware,RequestLoggingMiddleware,SecurityHeadersMiddleware
from app.core.performance import PerformanceHeadersMiddleware
from app.core.security import get_current_user
from app.models.user import User
from app.routers import admin_courses,admin_dashboard,analytics,assignments,assignments_upload,auth,blog,calendar,certificates,checkout_experience,course_builder,course_forum,courses_api,discovery,forum,gamification,gamification_v2,google,instructor,instructor_analytics,instructors,learning,learning_paths,media,moderation,monetization,notes,notifications,offline_sync,onboarding,pages,payments,portfolio,privacy,profile,qa,quiz,referrals,reviews,seo,support,system,token,uploads,users
from app.routers.auth import public_router
logging.basicConfig(level=logging.INFO,format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",handlers=[RotatingFileHandler("app.log",maxBytes=10_000_000,backupCount=5),logging.StreamHandler()]);app=FastAPI(title="Designora Platform",docs_url="/docs"if settings.ENVIRONMENT!="production"else None,redoc_url="/redoc"if settings.ENVIRONMENT!="production"else None);Base.metadata.create_all(bind=engine);app.add_middleware(SessionMiddleware,secret_key=settings.SESSION_SECRET_KEY,https_only=settings.ENVIRONMENT=="production");app.add_middleware(CORSMiddleware,allow_origins=settings.get_allowed_origins(),allow_credentials=True,allow_methods=["GET","POST","PUT","PATCH","DELETE"],allow_headers=["Content-Type","Authorization","X-CSRF-Token","X-Access-Token","X-Requested-With"]);app.add_middleware(GZipMiddleware,minimum_size=1000,compresslevel=6);app.add_middleware(PerformanceHeadersMiddleware);app.add_middleware(SecurityHeadersMiddleware);app.add_middleware(RequestLoggingMiddleware);app.add_middleware(IPBlockingMiddleware);app.state.limiter=limiter;app.add_exception_handler(RateLimitExceeded,_rate_limit_exceeded_handler);BASE_DIR=Path(__file__).resolve().parent;app.mount("/static",StaticFiles(directory=str(BASE_DIR/"static")),name="static");setup_admin(app)
for r in(profile.router,admin_courses.router,admin_dashboard.router,analytics.router,assignments.router,assignments_upload.router,blog.router,calendar.router,certificates.router,checkout_experience.router,course_builder.router,course_forum.router,courses_api.router,discovery.router,forum.router,gamification.router,gamification_v2.router,google.router,instructor.router,instructor_analytics.router,instructors.router,learning.router,learning_paths.router,media.router,moderation.router,monetization.router,notes.router,notifications.router,offline_sync.router,onboarding.router,pages.router,payments.router,portfolio.router,privacy.router,qa.router,quiz.router,referrals.router,reviews.router,seo.router,support.router,system.router,token.router,uploads.router,users.router,public_router,auth.router):app.include_router(r)
_admin=APIRouter(prefix="/api/admin",tags=["Admin"])
def require_admin(email:str=Depends(get_current_user),db:Session=Depends(get_db)):
 u=db.query(User).filter(User.email==email).first()
 if not u or u.role!="admin":raise HTTPException(status_code=403,detail="Faqat adminlar uchun")
 return u
@_admin.get("/users")
def admin_users(db:Session=Depends(get_db),admin:User=Depends(require_admin)):return[{"id":u.id,"name":u.name,"email":u.email,"role":u.role,"is_active":u.is_active}for u in db.query(User).order_by(User.id.desc()).all()]
app.include_router(_admin)
@app.get("/")
def home():return{"app":"Designora API","status":"ok","version":os.getenv("APP_VERSION","1.0"),"docs":"/docs"}
@app.get("/api/me")
def me():return RedirectResponse(url="/api/profile/me",status_code=307)
@app.exception_handler(Exception)
async def global_error(request:Request,exc:Exception):return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,content={"detail":"Internal server error"if settings.ENVIRONMENT=="production"else str(exc)})
if __name__=="__main__":uvicorn.run("app.main:app",host="127.0.0.1",port=8000,reload=settings.ENVIRONMENT!="production")
