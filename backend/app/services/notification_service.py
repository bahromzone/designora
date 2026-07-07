"""Bildirishnoma yaratish yordamchisi (BOSQICH 4).

Konvensiya: sessiyaga qo'shadi + flush qiladi, lekin commit QILMAYDI —
commit chaqiruvchi router zimmasida (mavjud tranzaksiya buzilmasligi uchun).
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.notification import Notification


def notify(
    db: Session,
    user_id: int,
    message: str,
    *,
    type: str = "info",
    link: str | None = None,
) -> Notification:
    """Foydalanuvchiga bitta bildirishnoma qo'shadi."""
    n = Notification(user_id=user_id, message=message, type=type, link=link)
    db.add(n)
    db.flush()
    return n
