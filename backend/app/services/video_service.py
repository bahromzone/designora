"""Video kontent himoyasi — HMAC signed URL (BOSQICH 5).

CDN (Mux / Bunny / Cloudflare Stream) oldida ishlaydigan, muddati o'tuvchi
imzolangan havolalar. Sof funksiyalar — to'liq unit-test qilinadi.
"""

from __future__ import annotations

import hashlib
import hmac
import time
from urllib.parse import urlencode


def sign_path(path: str, expires_at: int, secret: str) -> str:
    """path + muddat uchun HMAC-SHA256 imzosini qaytaradi."""
    msg = f"{path}:{expires_at}".encode()
    return hmac.new(secret.encode(), msg, hashlib.sha256).hexdigest()


def build_signed_url(
    path: str,
    secret: str,
    *,
    base_url: str = "",
    ttl_seconds: int = 3600,
    now: int | None = None,
) -> dict:
    """Imzolangan havola + muddat + token qaytaradi."""
    current = int(now if now is not None else time.time())
    expires = current + ttl_seconds
    token = sign_path(path, expires, secret)
    query = urlencode({"expires": expires, "token": token})
    prefix = base_url.rstrip("/") if base_url else ""
    return {
        "url": f"{prefix}{path}?{query}",
        "expires": expires,
        "token": token,
    }


def verify_signed(
    path: str,
    expires_at: int,
    token: str,
    secret: str,
    *,
    now: int | None = None,
) -> bool:
    """Imzo to'g'ri va muddati o'tmagan bo'lsa True."""
    current = int(now if now is not None else time.time())
    if current > expires_at:
        return False
    expected = sign_path(path, expires_at, secret)
    return hmac.compare_digest(expected, token)
