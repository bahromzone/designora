"""Refresh-token yaratish, hash'lash va rotatsiya yordamchilari (XAVFSIZLIK).

Token ochiq matni faqat mijozga bir marta beriladi; bazada uning SHA-256
hash'i saqlanadi. Shu sabab baza o'g'irlansa ham tokenlar tiklanmaydi.
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

REFRESH_TOKEN_TTL_DAYS = 30


def generate_refresh_token() -> str:
    """Kriptografik jihatdan xavfsiz ochiq refresh-token."""
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """Tokenni bazada saqlash uchun SHA-256 hash."""
    return hashlib.sha256(token.encode()).hexdigest()


def refresh_expiry(days: int = REFRESH_TOKEN_TTL_DAYS) -> datetime:
    return datetime.now(UTC) + timedelta(days=days)
