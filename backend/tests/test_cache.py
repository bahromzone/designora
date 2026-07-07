"""Kesh xizmati birlik testlari (BOSQICH 5) — xotira zaxirasi.

CI'da REDIS_URL yo'q, shu sabab backend 'memory' bo'ladi.
"""

import time

from app.services import cache


def test_backend_is_memory_without_redis():
    assert cache.backend_name() == "memory"


def test_set_get_delete():
    cache.clear()
    cache.set("k1", {"a": 1})
    assert cache.get("k1") == {"a": 1}
    cache.delete("k1")
    assert cache.get("k1") is None


def test_missing_key_returns_none():
    cache.clear()
    assert cache.get("nope") is None


def test_ttl_expiry():
    cache.clear()
    cache.set("temp", "v", ttl=1)
    assert cache.get("temp") == "v"
    time.sleep(1.1)
    assert cache.get("temp") is None
