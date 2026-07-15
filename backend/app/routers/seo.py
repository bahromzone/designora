"""Public SEO documents: dynamic sitemap and crawler policy."""

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.Course import Course
from app.models.blog import BlogPost
from app.models.user import User
from app.services.seo_service import build_robots, build_sitemap, canonical_url

router = APIRouter(tags=["SEO"])
_INSTRUCTOR_ROLES = {"instructor", "admin", "superadmin"}


def _date(value) -> str | None:
    return value.date().isoformat() if value else None


def sitemap_entries(db: Session, base_url: str) -> list[dict]:
    entries = [
        {"loc": canonical_url(base_url), "changefreq": "daily", "priority": "1.0"},
        {"loc": canonical_url(base_url, "/kurslar"), "changefreq": "daily", "priority": "0.9"},
        {"loc": canonical_url(base_url, "/blog"), "changefreq": "weekly", "priority": "0.8"},
        {"loc": canonical_url(base_url, "/learning-paths"), "changefreq": "weekly", "priority": "0.7"},
        {"loc": canonical_url(base_url, "/about"), "changefreq": "monthly", "priority": "0.5"},
    ]
    courses = db.query(Course).filter(Course.is_active == True).all()  # noqa: E712
    for course in courses:
        course_data = {"lastmod": _date(course.updated_at), "changefreq": "weekly", "priority": "0.8"}
        entries.append({"loc": canonical_url(base_url, f"/kurslar/{course.id}"), **course_data})
        if course.slug:
            entries.append({"loc": canonical_url(base_url, f"/courses/{course.slug}"), **course_data})
    posts = db.query(BlogPost).filter(BlogPost.is_published == True).all()  # noqa: E712
    for post in posts:
        entries.append({"loc": canonical_url(base_url, f"/blog/{post.slug}"), "lastmod": _date(post.updated_at or post.published_at), "changefreq": "monthly", "priority": "0.7"})
    instructors = db.query(User).filter(User.role.in_(_INSTRUCTOR_ROLES), User.is_active == True).all()  # noqa: E712
    for instructor in instructors:
        entries.append({"loc": canonical_url(base_url, f"/instruktor/{instructor.id}"), "changefreq": "monthly", "priority": "0.6"})
    return entries


@router.get("/robots.txt", include_in_schema=False)
def robots_txt():
    base = settings.FRONTEND_URL.rstrip("/")
    return PlainTextResponse(build_robots(f"{base}/sitemap.xml"), media_type="text/plain")


@router.get("/sitemap.xml", include_in_schema=False)
def sitemap_xml(db: Session = Depends(get_db)):
    return Response(content=build_sitemap(sitemap_entries(db, settings.FRONTEND_URL)), media_type="application/xml")
