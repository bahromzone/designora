"""Kesh xizmati — Redis (bo'lsa) yoki xotiradagi zaxira (BOSQICH 5).

REDIS_URL belgilanmagan yoki `redis` o'rnatilmagan/ulanib bo'lmagan bo'lsa,
avtomatik ravishda jarayon-ichi (in-memory) keshga tushadi. Shu sabab CI'da
Redis serversiz ham ishlaydi.
"""

from __future__ import annotations

import json
import time
from typing import Any

from app.core.config import settings

try:
    import redis as _redis
except ImportError:  # pragma: no cover
    _redis = None


class _MemoryCache:
    """Oddiy TTL'li xotira keshi."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[float | None, Any]] = {}

    def get(self, key: str) -> Any:
        item = self._store.get(key)
        if not item:
            return None
        expires, value = item
        if expires is not None and time.time() > expires:
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        expires = time.time() + ttl if ttl else None
        self._store[key] = (expires, value)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()


_memory = _MemoryCache()
_client: Any = None
_client_ready = False


def _get_client() -> Any:
    """Redis mijozini qaytaradi (ulanmasa None). Bir marta sinaladi."""
    global _client, _client_ready
    if _client_ready:
        return _client
    _client_ready = True
    if _redis is None or not settings.REDIS_URL:
        _client = None
        return None
    try:  # pragma: no cover
        client = _redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
        client.ping()
        _client = client
    except Exception:  # pragma: no cover
        _client = None
    return _client


def get(key: str) -> Any:
    client = _get_client()
    if client is not None:  # pragma: no cover
        try:
            raw = client.get(key)
            return json.loads(raw) if raw is not None else None
        except Exception:
            return _memory.get(key)
    return _memory.get(key)


def set(key: str, value: Any, ttl: int | None = None) -> None:
    client = _get_client()
    if client is not None:  # pragma: no cover
        try:
            data = json.dumps(value)
            if ttl:
                client.setex(key, ttl, data)
            else:
                client.set(key, data)
            return
        except Exception:
            pass
    _memory.set(key, value, ttl)


def delete(key: str) -> None:
    client = _get_client()
    if client is not None:  # pragma: no cover
        try:
            client.delete(key)
            return
        except Exception:
            pass
    _memory.delete(key)


def clear() -> None:
    """Xotira keshini tozalaydi (asosan testlar uchun)."""
    _memory.clear()


def backend_name() -> str:
    """Faol kesh backend nomi: 'redis' yoki 'memory'."""
    return "redis" if _get_client() is not None else "memory"
