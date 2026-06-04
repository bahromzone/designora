from fastapi import APIRouter, Request, Depends
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.core.admin_guard import admin_required
from app.core.database import get_db
from app.models.user import User
from app.models.Course import Course

router = APIRouter(prefix="/admin")
templates = Jinja2Templates(directory="templates")


@router.get("")
def dashboard(
    request: Request,
    admin: User = Depends(admin_required),
    db: Session = Depends(get_db),         # ✅ BUG #11 FIX: DB session qo'shildi
):
    # ✅ BUG #11 FIX: Template context bo'sh edi — statistik kartalar ko'rinmasdi.
    # Endi DB dan haqiqiy sonlar o'qilib template ga uzatiladi.
    users_count = db.query(User).filter(User.role == "user").count()
    courses_count = db.query(Course).filter(Course.is_active == True).count()
    admins_count = db.query(User).filter(User.role == "admin").count()

    return templates.TemplateResponse(
        "admin/dashboard.html",
        {
            "request": request,
            "users_count": users_count,
            "courses_count": courses_count,
            "admins_count": admins_count,
        }
    )