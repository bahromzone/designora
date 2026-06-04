"""
Users Router
/api/dashboard endi /api/profile/stats ga yo'naltiradi.
Eski hardcoded endpoint o'chirildi.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/api", tags=["Users"])


@router.get("/dashboard")
def dashboard_redirect(email: str = Depends(get_current_user)):
    """
    Eski /api/dashboard endpoint.
    Haqiqiy ma'lumot uchun /api/profile/stats dan foydalaning.
    """
    return RedirectResponse(url="/api/profile/stats", status_code=307)