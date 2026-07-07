"""Notifications Router — platforma ichidagi bildirishnomalar (BOSQICH 4).

Prefix: /api/notifications
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.notification import Notification
from app.models.user import User

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


def _get_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Avtorizatsiya talab etiladi")
    return user


def _dict(n: Notification) -> dict:
    return {
        "id": n.id,
        "message": n.message,
        "type": n.type,
        "link": n.link,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }


@router.get("")
def list_notifications(
    only_unread: bool = False,
    limit: int = Query(50, ge=1, le=100),
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    query = db.query(Notification).filter(Notification.user_id == user.id)
    if only_unread:
        query = query.filter(Notification.is_read == False)  # noqa: E712
    rows = (
        query.order_by(Notification.is_read.asc(), Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    return [_dict(n) for n in rows]


@router.get("/unread-count")
def unread_count(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    count = (
        db.query(Notification)
        .filter(
            Notification.user_id == user.id,
            Notification.is_read == False,  # noqa: E712
        )
        .count()
    )
    return {"unread": count}


@router.post("/{notification_id}/read")
def mark_read(
    notification_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    n = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user.id,
        )
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Bildirishnoma topilmadi")
    n.is_read = True
    db.commit()
    return {"message": "O'qilgan deb belgilandi", "id": n.id}


@router.post("/read-all")
def mark_all_read(
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    updated = (
        db.query(Notification)
        .filter(
            Notification.user_id == user.id,
            Notification.is_read == False,  # noqa: E712
        )
        .update({Notification.is_read: True})
    )
    db.commit()
    return {"message": "Barchasi o'qilgan deb belgilandi", "updated": updated}


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    email: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = _get_user(db, email)
    n = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user.id,
        )
        .first()
    )
    if not n:
        raise HTTPException(status_code=404, detail="Bildirishnoma topilmadi")
    db.delete(n)
    db.commit()
    return {"message": "O'chirildi", "id": notification_id}
