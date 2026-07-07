"""Forum Router — community forum (BOSQICH 4).

Prefix: /api/forum

Mavzular ommaviy o'qiladi; yaratish/javob berish uchun avtorizatsiya kerak.
Mavzu/javobni faqat egasi yoki admin o'chira oladi.
"""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, StringConstraints
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.forum import ForumPost, ForumThread
from app.models.user import User

router = APIRouter(prefix="/api/forum", tags=["Forum"])

_STAFF_ROLES = {"admin", "superadmin"}


def _now():
    return datetime.now(UTC)


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


class ThreadIn(BaseModel):
    title: Annotated[str, StringConstraints(min_length=3, max_length=200)]
    body: str | None = ""
    category: str | None = "umumiy"
    course_id: int | None = None


class PostIn(BaseModel):
    body: Annotated[str, StringConstraints(min_length=1, max_length=8000)]


def _thread_row(t: ForumThread, author: str | None) -> dict:
    return {
        "id": t.id,
        "title": t.title,
        "category": t.category,
        "course_id": t.course_id,
        "author": author,
        "user_id": t.user_id,
        "is_pinned": t.is_pinned,
        "is_locked": t.is_locked,
        "views": t.views or 0,
        "replies": t.posts.count(),
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


@router.get("/threads")
def list_threads(
    category: str | None = None,
    course_id: int | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    query = db.query(ForumThread)
    if category:
        query = query.filter(ForumThread.category == category)
    if course_id is not None:
        query = query.filter(ForumThread.course_id == course_id)
    total = query.count()
    items = (
        query.order_by(
            ForumThread.is_pinned.desc(), ForumThread.created_at.desc()
        )
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    out = []
    for t in items:
        author = db.query(User).filter(User.id == t.user_id).first()
        out.append(_thread_row(t, author.name if author else None))
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
        "results": out,
    }


@router.post("/threads", status_code=201)
def create_thread(
    data: ThreadIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    thread = ForumThread(
        user_id=user.id,
        title=data.title,
        body=data.body or "",
        category=data.category or "umumiy",
        course_id=data.course_id,
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return JSONResponse(
        status_code=201, content={"message": "Mavzu yaratildi", "id": thread.id}
    )


@router.get("/threads/{thread_id}")
def get_thread(thread_id: int, db: Session = Depends(get_db)):
    thread = db.query(ForumThread).filter(ForumThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Mavzu topilmadi")
    thread.views = (thread.views or 0) + 1
    db.commit()

    author = db.query(User).filter(User.id == thread.user_id).first()
    posts = []
    for p in thread.posts.all():
        pu = db.query(User).filter(User.id == p.user_id).first()
        posts.append(
            {
                "id": p.id,
                "user_id": p.user_id,
                "author": pu.name if pu else None,
                "body": p.body,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
        )
    return {
        "id": thread.id,
        "title": thread.title,
        "body": thread.body,
        "category": thread.category,
        "course_id": thread.course_id,
        "author": author.name if author else None,
        "user_id": thread.user_id,
        "is_pinned": thread.is_pinned,
        "is_locked": thread.is_locked,
        "views": thread.views or 0,
        "created_at": thread.created_at.isoformat() if thread.created_at else None,
        "posts": posts,
    }


@router.post("/threads/{thread_id}/posts", status_code=201)
def reply(
    thread_id: int,
    data: PostIn,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    thread = db.query(ForumThread).filter(ForumThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Mavzu topilmadi")
    if thread.is_locked:
        raise HTTPException(status_code=403, detail="Mavzu yopilgan")
    post = ForumPost(thread_id=thread.id, user_id=user.id, body=data.body)
    db.add(post)
    db.commit()
    db.refresh(post)
    return JSONResponse(
        status_code=201, content={"message": "Javob qo'shildi", "id": post.id}
    )


def _can_moderate(user: User, owner_id: int) -> bool:
    return user.id == owner_id or user.role in _STAFF_ROLES


@router.delete("/threads/{thread_id}")
def delete_thread(
    thread_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    thread = db.query(ForumThread).filter(ForumThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Mavzu topilmadi")
    if not _can_moderate(user, thread.user_id):
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")
    db.delete(thread)
    db.commit()
    return {"message": "Mavzu o'chirildi", "id": thread_id}


@router.delete("/posts/{post_id}")
def delete_post(
    post_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    post = db.query(ForumPost).filter(ForumPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Javob topilmadi")
    if not _can_moderate(user, post.user_id):
        raise HTTPException(status_code=403, detail="Ruxsat yo'q")
    db.delete(post)
    db.commit()
    return {"message": "Javob o'chirildi", "id": post_id}
