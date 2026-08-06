"""Rate limit saqlagichi va Redis konfiguratsiyasi testlari.

Regressiya nuqtalari:
  1. `cache.py` `settings.REDIS_URL` ga tayanadi — bu maydon ilgari umuman
     mavjud emas edi va `redis` paketi o'rnatilgan zahoti AttributeError
     bilan yiqilardi.
  2. Rate limit `memory://` da sanalsa, har worker o'z hisobini yuritadi —
     ko'p worker'li production'da limit amalda ishlamaydi.
"""

import pytest
from pydantic import ValidationError

from app.core.config import (
    MEMORY_STORAGE_URI,
    Settings,
    _storage_is_reachable,
    settings,
)
from app.services import cache

BASE_ENV = {
    "DATABASE_URL": "sqlite+pysqlite:///:memory:",
    "SECRET_KEY": "test-secret",
    "SESSION_SECRET_KEY": "test-session",
    "JWT_SECRET_KEY": "test-jwt",
    "MAIL_USERNAME": "test@example.com",
    "MAIL_PASSWORD": "test-password",
    "MAIL_FROM": "test@example.com",
    "MAIL_PORT": 587,
    "MAIL_SERVER": "smtp.example.com",
    "RECAPTCHA_SECRET_KEY": "test-recaptcha",
}

PROD_ENV = {
    **BASE_ENV,
    "ENVIRONMENT": "production",
    "PAYME_KEY": "payme-key",
    "CLICK_SECRET_KEY": "click-key",
    "media_signing_key": "prod-media-signing-key",
    "VIDEO_STORAGE_ACCESS_KEY": "access-key",
    "VIDEO_STORAGE_SECRET_KEY": "secret-key",
    "VIDEO_STORAGE_PUBLIC_BASE_URL": "https://cdn.example.com",
}


@pytest.fixture(autouse=True)
def _clean_env(monkeypatch):
    """Muhitdagi qiymatlar testlarga aralashmasin."""
    for key in ("REDIS_URL", "RATE_LIMIT_STORAGE_URI", "RATE_LIMIT_DEFAULT"):
        monkeypatch.delenv(key, raising=False)


def _settings(**overrides) -> Settings:
    return Settings(_env_file=None, **{**BASE_ENV, **overrides})


def test_storage_defaults_to_memory_without_redis():
    assert _settings().get_rate_limit_storage_uri() == MEMORY_STORAGE_URI


def test_redis_url_becomes_rate_limit_storage():
    cfg = _settings(REDIS_URL="redis://localhost:6379/0")
    assert cfg.get_rate_limit_storage_uri() == "redis://localhost:6379/0"


def test_explicit_storage_uri_wins_over_redis_url():
    cfg = _settings(
        REDIS_URL="redis://localhost:6379/0",
        RATE_LIMIT_STORAGE_URI="redis://localhost:6379/9",
    )
    assert cfg.get_rate_limit_storage_uri() == "redis://localhost:6379/9"


def test_whitespace_redis_url_is_treated_as_empty():
    cfg = _settings(REDIS_URL="   ")
    assert cfg.get_redis_url() == ""
    assert cfg.get_rate_limit_storage_uri() == MEMORY_STORAGE_URI


def test_production_rejects_memory_rate_limit_storage():
    with pytest.raises(ValidationError) as exc:
        Settings(_env_file=None, **PROD_ENV)
    assert "REDIS_URL" in str(exc.value)


def test_production_accepts_shared_storage():
    cfg = Settings(_env_file=None, **PROD_ENV, REDIS_URL="redis://cache:6379/0")
    assert cfg.get_rate_limit_storage_uri() == "redis://cache:6379/0"


def test_development_allows_memory_storage():
    assert _settings(ENVIRONMENT="development").ENVIRONMENT == "development"


def test_memory_storage_is_always_reachable():
    assert _storage_is_reachable(MEMORY_STORAGE_URI) is True


def test_unreachable_storage_is_detected():
    # 127.0.0.1:1 — ulanish darhol rad etiladi.
    assert _storage_is_reachable("redis://127.0.0.1:1/0") is False


def test_cache_reads_redis_url_from_settings():
    """Regressiya: settings.REDIS_URL mavjud va cache uni o'qiy oladi."""
    assert hasattr(settings, "REDIS_URL")
    assert settings.get_redis_url() == ""
    assert cache.backend_name() == "memory"
