"""Gamifikatsiya xizmati — ball, daraja va nishonlar (BOSQICH 3).

Konvensiya: bu yerdagi funksiyalar sessiyaga yozadi (add/flush) lekin
commit QILMAYDI — commit chaqiruvchi router zimmasida (mavjud tranzaksiya
buzilmasligi uchun). Faqat `ensure_default_badges()` idempotent seed uchun
o'zi commit qiladi.
"""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.badge import Badge, UserBadge
from app.models.user import User

# Har 100 ball = 1 daraja
POINTS_PER_LEVEL = 100

DEFAULT_BADGES = [
    {"code": "first_enroll", "title": "Birinchi qadam", "description": "Birinchi kursga yozildingiz", "icon": "🎯", "points": 10},
    {"code": "first_lesson", "title": "O'rganish boshlandi", "description": "Birinchi darsni tugatdingiz", "icon": "📘", "points": 10},
    {"code": "quiz_passed", "title": "Bilimdon", "description": "Birinchi testdan o'tdingiz", "icon": "🧠", "points": 20},
    {"code": "quiz_perfect", "title": "Mukammal", "description": "Testni 100% bilan topshirdingiz", "icon": "💯", "points": 30},
    {"code": "course_completed", "title": "Bitiruvchi", "description": "Kursni 100% tugatdingiz", "icon": "🏆", "points": 50},
    {"code": "certified", "title": "Sertifikatli", "description": "Sertifikat qo'lga kiritdingiz", "icon": "📜", "points": 50},
    {"code": "streak_7", "title": "Izchil hafta", "description": "7 kunlik streak", "icon": "🔥", "points": 40},
    {"code": "streak_30", "title": "Izchil oy", "description": "30 kunlik streak", "icon": "⚡", "points": 100},
]


def recalc_level(user: User) -> int:
    """Balldan darajani hisoblab, user.level'ni yangilaydi."""
    level = max(1, (user.points or 0) // POINTS_PER_LEVEL + 1)
    user.level = level
    return level


def award_points(db: Session, user: User, points: int) -> None:
    """Foydalanuvchiga ball qo'shadi va darajani qayta hisoblaydi."""
    if not points or points <= 0:
        return
    user.points = (user.points or 0) + points
    recalc_level(user)
    db.add(user)
    db.flush()


def ensure_default_badges(db: Session) -> None:
    """Standart nishonlarni bazaga joylaydi (idempotent)."""
    existing = {code for (code,) in db.query(Badge.code).all()}
    created = False
    for spec in DEFAULT_BADGES:
        if spec["code"] not in existing:
            db.add(Badge(**spec))
            created = True
    if created:
        db.commit()


def award_badge(db: Session, user: User, code: str) -> UserBadge | None:
    """Nishonni foydalanuvchiga beradi (bir marta).

    Yangi berilgan bo'lsa UserBadge qaytaradi; allaqachon bor bo'lsa None.
    Nishon katalogda bo'lmasa — DEFAULT_BADGES'dan yaratib oladi.
    """
    badge = db.query(Badge).filter(Badge.code == code).first()
    if not badge:
        spec = next((b for b in DEFAULT_BADGES if b["code"] == code), None)
        if not spec:
            return None
        badge = Badge(**spec)
        db.add(badge)
        db.flush()

    already = (
        db.query(UserBadge)
        .filter(UserBadge.user_id == user.id, UserBadge.badge_id == badge.id)
        .first()
    )
    if already:
        return None

    ub = UserBadge(user_id=user.id, badge_id=badge.id)
    db.add(ub)
    if badge.points:
        award_points(db, user, badge.points)
    db.flush()
    return ub


def leaderboard(db: Session, limit: int = 20) -> list[dict]:
    """Eng ko'p ballga ega foydalanuvchilar reytingi."""
    users = (
        db.query(User)
        .order_by(User.points.desc(), User.id.asc())
        .limit(limit)
        .all()
    )
    out = []
    for rank, u in enumerate(users, start=1):
        out.append(
            {
                "rank": rank,
                "user_id": u.id,
                "name": u.name,
                "points": u.points or 0,
                "level": u.level or 1,
                "streak_days": u.streak_days or 0,
            }
        )
    return out
