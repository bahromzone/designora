"""Blog Router — blog / SEO kontenti (BOSQICH 4).

Prefix: /api/blog

Ommaviy: chop etilgan postlar ro'yxati + slug bo'yicha o'qish.
Instruktor/admin: post yaratish, tahrirlash, chop etish, o'chirish.
"""

import re
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, StringConstraints
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.blog import BlogPost
from app.models.user import User

router = APIRouter(prefix="/api/blog", tags=["Blog"])

_AUTHOR_ROLES = {"instructor", "admin", "superadmin"}


def _now():
    return datetime.now(UTC)


def _require_author(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    if user.role not in _AUTHOR_ROLES:
        raise HTTPException(status_code=403, detail="Faqat muallif yoki admin uchun")
    return user


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-") or "post"


def _unique_slug(db: Session, base: str, exclude_id: int | None = None) -> str:
    slug = base
    n = 1
    while True:
        q = db.query(BlogPost).filter(BlogPost.slug == slug)
        if exclude_id is not None:
            q = q.filter(BlogPost.id != exclude_id)
        if not q.first():
            return slug
        n += 1
        slug = f"{base}-{n}"


class PostIn(BaseModel):
    title: Annotated[str, StringConstraints(min_length=3, max_length=200)]
    excerpt: str | None = None
    body: str | None = ""
    cover_image_url: str | None = None
    tags: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None


class PostPatch(BaseModel):
    title: Annotated[str, StringConstraints(min_length=3, max_length=200)] | None = None
    excerpt: str | None = None
    body: str | None = None
    cover_image_url: str | None = None
    tags: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None


def _post_dict(p: BlogPost, *, full: bool = False) -> dict:
    data = {
        "id": p.id,
        "slug": p.slug,
        "title": p.title,
        "excerpt": p.excerpt,
        "cover_image_url": p.cover_image_url,
        "tags": p.tags,
        "is_published": p.is_published,
        "views": p.views or 0,
        "published_at": p.published_at.isoformat() if p.published_at else None,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }
    if full:
        data.update(
            {
                "body": p.body,
                "meta_title": p.meta_title or p.title,
                "meta_description": p.meta_description or p.excerpt,
                "author_id": p.author_id,
            }
        )
    return data


@router.get("")
def list_posts(
    tag: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(BlogPost).filter(BlogPost.is_published == True)  # noqa: E712
    if tag:
        query = query.filter(BlogPost.tags.ilike(f"%{tag}%"))
    total = query.count()
    items = (
        query.order_by(BlogPost.published_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
        "results": [_post_dict(p) for p in items],
    }


@router.get("/{slug}")
def get_post(slug: str, db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter(BlogPost.slug == slug).first()
    if not post or not post.is_published:
        raise HTTPException(status_code=404, detail="Maqola topilmadi")
    post.views = (post.views or 0) + 1
    db.commit()
    return _post_dict(post, full=True)


@router.post("", status_code=201)
def create_post(
    data: PostIn,
    db: Session = Depends(get_db),
    user: User = Depends(_require_author),
):
    slug = _unique_slug(db, _slugify(data.title))
    post = BlogPost(
        slug=slug,
        title=data.title,
        excerpt=data.excerpt,
        body=data.body or "",
        cover_image_url=data.cover_image_url,
        tags=data.tags,
        meta_title=data.meta_title,
        meta_description=data.meta_description,
        author_id=user.id,
        is_published=False,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return JSONResponse(
        status_code=201,
        content={"message": "Maqola yaratildi (qoralama)", "id": post.id, "slug": slug},
    )


@router.patch("/{post_id}")
def update_post(
    post_id: int,
    data: PostPatch,
    db: Session = Depends(get_db),
    user: User = Depends(_require_author),
):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Maqola topilmadi")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    db.commit()
    return {"message": "Maqola yangilandi", "id": post.id}


@router.post("/{post_id}/publish")
def publish_post(
    post_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(_require_author),
):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Maqola topilmadi")
    post.is_published = True
    if not post.published_at:
        post.published_at = _now()
    db.commit()
    return {"message": "Maqola chop etildi", "slug": post.slug}


@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(_require_author),
):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Maqola topilmadi")
    db.delete(post)
    db.commit()
    return {"message": "Maqola o'chirildi", "id": post_id}
