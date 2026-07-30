from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.badge import Badge, UserBadge
from app.models.user import User

POINTS_PER_LEVEL = 100

# Keep database values ASCII-safe: Windows cp1251 connections cannot encode emoji.
DEFAULT_BADGES = [
    {
        "code": "first_enroll",
        "title": "Birinchi qadam",
        "description": "Birinchi kursga yozildingiz",
        "icon": "target",
        "points": 10,
    },
    {
        "code": "first_lesson",
        "title": "O'rganish boshlandi",
        "description": "Birinchi darsni tugatdingiz",
        "icon": "book",
        "points": 10,
    },
    {
        "code": "quiz_passed",
        "title": "Bilimdon",
        "description": "Birinchi testdan o'tdingiz",
        "icon": "brain",
        "points": 20,
    },
    {
        "code": "quiz_perfect",
        "title": "Mukammal",
        "description": "Testni 100% bilan topshirdingiz",
        "icon": "sparkles",
        "points": 30,
    },
    {
        "code": "course_completed",
        "title": "Bitiruvchi",
        "description": "Kursni 100% tugatdingiz",
        "icon": "trophy",
        "points": 50,
    },
    {
        "code": "certified",
        "title": "Sertifikatli",
        "description": "Sertifikat qo'lga kiritdingiz",
        "icon": "certificate",
        "points": 50,
    },
    {
        "code": "streak_7",
        "title": "Izchil hafta",
        "description": "7 kunlik streak",
        "icon": "flame",
        "points": 40,
    },
    {
        "code": "streak_30",
        "title": "Izchil oy",
        "description": "30 kunlik streak",
        "icon": "bolt",
        "points": 100,
    },
]


def recalc_level(user: User) -> int:
    level = max(1, (user.points or 0) // POINTS_PER_LEVEL + 1)
    user.level = level
    return level


def award_points(db: Session, user: User, points: int) -> None:
    if not points or points <= 0:
        return
    user.points = (user.points or 0) + points
    recalc_level(user)
    db.add(user)
    db.flush()


def ensure_default_badges(db: Session) -> None:
    existing = {code for (code,) in db.query(Badge.code).all()}
    created = False
    for spec in DEFAULT_BADGES:
        if spec["code"] not in existing:
            db.add(Badge(**spec))
            created = True
    if created:
        db.commit()


def award_badge(db: Session, user: User, code: str) -> UserBadge | None:
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
    users = (
        db.query(User).order_by(User.points.desc(), User.id.asc()).limit(limit).all()
    )
    return [
        {
            "rank": rank,
            "user_id": u.id,
            "name": u.name,
            "points": u.points or 0,
            "level": u.level or 1,
            "streak_days": u.streak_days or 0,
        }
        for rank, u in enumerate(users, start=1)
    ]
