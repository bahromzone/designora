"""System Router — health, readiness, metrics, SEO, i18n (BOSQICH 5).

Prefiksiz — root darajadagi endpointlar (/health, /metrics, /robots.txt,
/sitemap.xml) va /api/i18n.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core import metrics
from app.core.config import settings
from app.core.database import get_db
from app.models.blog import BlogPost
from app.models.Course import Course
from app.services import cache, i18n_service, seo_service

router = APIRouter(tags=["System"])


@router.get("/health")
def health():
    """Tirik-lik tekshiruvi (liveness)."""
    return {"status": "ok", "cache": cache.backend_name()}


@router.get("/ready")
def ready(db: Session = Depends(get_db)):
    """Tayyorlik tekshiruvi (readiness) — DB ulanishini sinaydi."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "ok"}
    except Exception:
        return Response(
            content='{"status": "not-ready", "database": "error"}',
            status_code=503,
            media_type="application/json",
        )


@router.get("/metrics", response_class=PlainTextResponse)
def prometheus_metrics():
    """Prometheus text-exposition formatidagi metrikalar."""
    return metrics.render()


@router.get("/robots.txt", response_class=PlainTextResponse)
def robots():
    sitemap_url = f"{settings.FRONTEND_URL.rstrip('/')}/sitemap.xml"
    return seo_service.build_robots(sitemap_url)


@router.get("/sitemap.xml")
def sitemap(db: Session = Depends(get_db)):
    """Chop etilgan kurslar + blog postlaridan sitemap yaratadi (keshlanadi)."""
    cache_key = "sitemap:xml"
    cached = cache.get(cache_key)
    if cached is not None:
        return Response(content=cached, media_type="application/xml")

    base = settings.FRONTEND_URL.rstrip("/")
    entries: list[dict] = [{"loc": base}]

    courses = db.query(Course).filter(Course.is_active == True).all()  # noqa: E712
    for c in courses:
        slug = c.slug or c.id
        entries.append({"loc": f"{base}/courses/{slug}"})

    posts = db.query(BlogPost).filter(BlogPost.is_published == True).all()  # noqa: E712
    for p in posts:
        lastmod = None
        if p.published_at:
            lastmod = p.published_at.date().isoformat()
        entries.append({"loc": f"{base}/blog/{p.slug}", "lastmod": lastmod})

    xml = seo_service.build_sitemap(entries)
    cache.set(cache_key, xml, ttl=300)
    return Response(content=xml, media_type="application/xml")


@router.get("/api/i18n/languages")
def i18n_languages():
    return {
        "default": i18n_service.DEFAULT_LANGUAGE,
        "supported": i18n_service.SUPPORTED_LANGUAGES,
    }


@router.get("/api/i18n/{lang}")
def i18n_catalog(lang: str):
    normalized = i18n_service.normalize_language(lang)
    return {
        "lang": normalized,
        "catalog": i18n_service.get_catalog(normalized),
    }
