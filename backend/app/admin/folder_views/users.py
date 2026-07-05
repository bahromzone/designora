from core.admin_guard import admin_required
from core.database import get_db  # ✅ BUG #7 FIX: get_db import qilindi
from fastapi import APIRouter, Depends, Request
from fastapi.templating import Jinja2Templates
from models.user import User
from sqlalchemy.orm import Session

router = APIRouter(prefix="/admin")
templates = Jinja2Templates(directory="templates")


@router.get("/users")
def users_page(
    request: Request,
    admin: User = Depends(admin_required),
    db: Session = Depends(
        get_db
    ),  # ✅ BUG #7 FIX: SessionLocal() o'rniga Depends(get_db)
    # Avval: session yopilishi kafolatlanmasdi (leak xavfi)
    # Endi: FastAPI session ni avtomatik boshqaradi
):
    users = db.query(User).all()
    return templates.TemplateResponse(
        "admin/users.html", {"request": request, "users": users}
    )
