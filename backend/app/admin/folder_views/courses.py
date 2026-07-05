from fastapi import APIRouter, Depends, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.core.admin_guard import admin_required
from app.core.database import get_db
from app.models.Course import Course
from app.models.user import User

router = APIRouter(prefix="/admin")
templates = Jinja2Templates(directory="templates")


@router.get("/courses")
def courses_page(
    request: Request,
    admin: User = Depends(admin_required),
    db: Session = Depends(get_db),  # Depends — session avtomatik yopiladi
):
    courses = db.query(Course).all()
    return templates.TemplateResponse(
        "admin/courses.html", {"request": request, "courses": courses}
    )
