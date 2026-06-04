"""
Pages Router — Barcha sidebar sahifalari
"""
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_optional
from app.models.Course import Course
from app.models.progress import Progress
from app.models.user import User
from app.utils.routes import dashboard_path_for_role, profile_path_for_role, is_admin_role

router = APIRouter(tags=["Pages"])
templates = Jinja2Templates(directory="templates")


# ── YORDAMCHI FUNKSIYALAR ──────────────────────────────────────────────────────

def get_user_safe(request: Request) -> str | None:
    """Session, cookie, yoki auth header orqali user emailini oladi."""
    return get_current_user_optional(request)


def _login_required(request: Request) -> RedirectResponse | None:
    """Login yo'q bo'lsa login sahifasiga yuboradi."""
    if not get_user_safe(request):
        return RedirectResponse("/login", status_code=302)
    return None


def _request_user(request: Request, db: Session) -> User | None:
    email = get_user_safe(request)
    if not email:
        return None
    return db.query(User).filter(User.email == email).first()


def _base_ctx(request: Request, active_page: str, **extra) -> dict:
    """Barcha sahifalar uchun umumiy template context"""
    return {"request": request, "active_page": active_page, **extra}


# ── ASOSIY SAHIFALAR ──────────────────────────────────────────────────────────

@router.get("/dashboard", response_class=HTMLResponse)
def dashboard_page(request: Request, db: Session = Depends(get_db)):
    if redir := _login_required(request):
        return redir
    user = _request_user(request, db)
    if user and is_admin_role(user.role):
        return RedirectResponse(dashboard_path_for_role(user.role), status_code=302)
    return templates.TemplateResponse(
        "dashboard.html", _base_ctx(request, "dashboard")
    )


@router.get("/courses", response_class=HTMLResponse)
def courses_page(request: Request):
    if redir := _login_required(request):
        return redir
    return templates.TemplateResponse(
        "courses.html", _base_ctx(request, "courses")
    )


@router.get("/catalog", response_class=HTMLResponse)
def catalog_page(request: Request, db: Session = Depends(get_db)):
    if redir := _login_required(request):
        return redir
    courses = (
        db.query(Course)
        .filter(Course.is_active == True)
        .order_by(Course.id.desc())
        .all()
    )
    return templates.TemplateResponse(
        "catalog.html", _base_ctx(request, "catalog", courses=courses)
    )


@router.get("/course/{course_id}", response_class=HTMLResponse)
def course_detail_page(
    course_id: int,
    request: Request,
    db: Session = Depends(get_db),
):
    if redir := _login_required(request):
        return redir

    course = db.query(Course).filter(
        Course.id == course_id,
        Course.is_active == True,
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Kurs topilmadi")

    # Joriy foydalanuvchi va uning progressi
    current_user = None
    progress = None
    email = get_user_safe(request)
    if email:
        current_user = db.query(User).filter(User.email == email).first()
        if current_user:
            progress = db.query(Progress).filter(
                Progress.user_id == current_user.id,
                Progress.course_id == course_id,
            ).first()

    return templates.TemplateResponse(
        "course_detail.html",
        _base_ctx(
            request, "catalog",      # catalog highlighted in sidebar
            course=course,
            progress=progress,
            user=current_user,       # ✅ BUG #3 FIX: user object passed — {% if user %} works
        ),
    )


@router.get("/certificates", response_class=HTMLResponse)
def certificates_page(request: Request):
    if redir := _login_required(request):
        return redir
    return templates.TemplateResponse(
        "certificates.html", _base_ctx(request, "certificates")
    )


# ── O'RGANISH ─────────────────────────────────────────────────────────────────

@router.get("/schedule", response_class=HTMLResponse)
def schedule_page(request: Request):
    if redir := _login_required(request):
        return redir
    return templates.TemplateResponse(
        "coming_soon.html",
        _base_ctx(
            request, "schedule",
            page_title="Jadval",
            page_icon="calendar",
            page_desc="Dars jadvali tez orada ochiladi",
        ),
    )


@router.get("/assignments", response_class=HTMLResponse)
def assignments_page(request: Request):
    if redir := _login_required(request):
        return redir
    return templates.TemplateResponse(
        "coming_soon.html",
        _base_ctx(
            request, "assignments",
            page_title="Topshiriqlar",
            page_icon="clipboard-list",
            page_desc="Topshiriqlar bo'limi tez orada",
        ),
    )


@router.get("/community", response_class=HTMLResponse)
def community_page(request: Request):
    if redir := _login_required(request):
        return redir
    return templates.TemplateResponse(
        "coming_soon.html",
        _base_ctx(
            request, "community",
            page_title="Jamiyat",
            page_icon="users",
            page_desc="Jamiyat platformasi tez orada ochiladi",
        ),
    )


@router.get("/mentors", response_class=HTMLResponse)
def mentors_page(request: Request):
    if redir := _login_required(request):
        return redir
    return templates.TemplateResponse(
        "coming_soon.html",
        _base_ctx(
            request, "mentors",
            page_title="Mentorlar",
            page_icon="message-circle",
            page_desc="Mentor bron qilish tez orada",
        ),
    )


# ── TAHLIL ────────────────────────────────────────────────────────────────────

@router.get("/stats", response_class=HTMLResponse)
def stats_page(request: Request):
    if redir := _login_required(request):
        return redir
    return templates.TemplateResponse(
        "coming_soon.html",
        _base_ctx(
            request, "stats",
            page_title="Statistika",
            page_icon="bar-chart-2",
            page_desc="Batafsil statistika bo'limi tez orada",
        ),
    )


@router.get("/goals", response_class=HTMLResponse)
def goals_page(request: Request):
    if redir := _login_required(request):
        return redir
    return templates.TemplateResponse(
        "coming_soon.html",
        _base_ctx(
            request, "goals",
            page_title="Maqsadlar",
            page_icon="target",
            page_desc="Maqsad qo'yish va kuzatish tizimi tez orada",
        ),
    )


@router.get("/messages", response_class=HTMLResponse)
def messages_page(request: Request):
    if redir := _login_required(request):
        return redir
    return templates.TemplateResponse(
        "coming_soon.html",
        _base_ctx(
            request, "messages",
            page_title="Xabarlar",
            page_icon="message-square",
            page_desc="Xabarlar tizimi tez orada ochiladi",
        ),
    )


@router.get("/notifications", response_class=HTMLResponse)
def notifications_page(request: Request):
    if redir := _login_required(request):
        return redir
    return templates.TemplateResponse(
        "coming_soon.html",
        _base_ctx(
            request, "notifications",
            page_title="Bildirishnomalar",
            page_icon="bell",
            page_desc="Bildirishnomalar markazi tez orada",
        ),
    )


# ── SOZLAMALAR ────────────────────────────────────────────────────────────────

@router.get("/profile", response_class=HTMLResponse)
def profile_redirect_page(request: Request, db: Session = Depends(get_db)):
    if redir := _login_required(request):
        return redir

    user = _request_user(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)

    return RedirectResponse(profile_path_for_role(user.role), status_code=302)


@router.get("/user/profile", response_class=HTMLResponse)
def user_profile_page(request: Request, db: Session = Depends(get_db)):
    if redir := _login_required(request):
        return redir

    user = _request_user(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    if is_admin_role(user.role):
        return RedirectResponse(profile_path_for_role(user.role), status_code=302)

    return templates.TemplateResponse(
        "profile.html", _base_ctx(request, "profile")
    )


@router.get("/admin/profile", response_class=HTMLResponse)
def admin_profile_page(request: Request, db: Session = Depends(get_db)):
    if redir := _login_required(request):
        return redir

    user = _request_user(request, db)
    if not user:
        return RedirectResponse("/login", status_code=302)
    if not is_admin_role(user.role):
        return RedirectResponse(profile_path_for_role(user.role), status_code=302)

    return templates.TemplateResponse(
        "profile.html", _base_ctx(request, "profile")
    )


@router.get("/settings", response_class=HTMLResponse)
def settings_page(request: Request):
    if redir := _login_required(request):
        return redir
    return templates.TemplateResponse(
        "coming_soon.html",
        _base_ctx(
            request, "settings",
            page_title="Sozlamalar",
            page_icon="settings",
            page_desc="Sozlamalar bo'limi tez orada",
        ),
    )


@router.get("/help", response_class=HTMLResponse)
def help_page(request: Request):
    if redir := _login_required(request):
        return redir
    return templates.TemplateResponse(
        "coming_soon.html",
        _base_ctx(
            request, "help",
            page_title="Yordam",
            page_icon="help-circle",
            page_desc="Yordam markazi va FAQ tez orada",
        ),
    )


# ── ADMIN: KURSLAR BOSHQARUVI ─────────────────────────────────────────────────

@router.get("/manage/courses", response_class=HTMLResponse)
def admin_courses_page(request: Request, db: Session = Depends(get_db)):
    """
    ✅ BUG #6 FIX: Avval faqat login tekshirilardi — har qanday user kira olardi.
    Endi DB dan role tekshiriladi — faqat adminlar ko'ra oladi.
    """
    email = get_user_safe(request)
    if not email:
        return RedirectResponse("/login", status_code=302)

    user = db.query(User).filter(User.email == email).first()
    if not user or not is_admin_role(user.role):
        # Admin bo'lmagan userni dashboard ga yuboramiz, 403 ko'rsatmaymiz
        # (URL enumeration dan himoya: admin panel mavjudligini yashiramiz)
        return RedirectResponse("/dashboard", status_code=302)

    courses = db.query(Course).order_by(Course.id.desc()).all()
    category_count = len({course.category for course in courses if course.category})
    active_count = sum(1 for course in courses if course.is_active)
    courses_payload = [
        {
            "id": course.id,
            "title": course.title,
            "category": course.category,
            "price": course.price,
            "is_active": course.is_active,
            "thumbnail_url": course.thumbnail_url,
            "description": course.description,
        }
        for course in courses
    ]

    return templates.TemplateResponse(
        "admin_courses.html",
        _base_ctx(
            request,
            "manage_courses",
            courses=courses,
            courses_payload=courses_payload,
            course_stats={
                "total": len(courses),
                "active": active_count,
                "inactive": len(courses) - active_count,
                "categories": category_count,
            },
        ),
    )
