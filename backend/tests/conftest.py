"""
Pytest umumiy fixture'lari.

MUHIM: Sozlamalar (Settings) muhit o'zgaruvchilaridan o'qiladi va ba'zilari
majburiy (default'siz). Shu sabab app modullari import qilinishidan OLDIN
bu yerda test uchun xavfsiz qiymatlar o'rnatiladi.
"""

import os

# ── Test muhiti o'zgaruvchilari (app import qilinishidan oldin) ──────────────
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("SESSION_SECRET_KEY", "test-session-secret")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret")
os.environ.setdefault("JWT_EXPIRE_MINUTES", "60")
os.environ.setdefault("MAIL_USERNAME", "test@example.com")
os.environ.setdefault("MAIL_PASSWORD", "test-password")
os.environ.setdefault("MAIL_FROM", "test@example.com")
os.environ.setdefault("MAIL_PORT", "587")
os.environ.setdefault("MAIL_SERVER", "smtp.example.com")
os.environ.setdefault("RECAPTCHA_SECRET_KEY", "test-recaptcha")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

# Barcha modellarni ro'yxatga olish (metadata to'liq bo'lishi uchun) ─────────
import app.models  # noqa: E402,F401
from app.core.config import limiter  # noqa: E402
from app.core.database import Base, get_db  # noqa: E402

# Testlarda rate limiting'ni o'chiramiz — aks holda takroriy so'rovlar
# 429 (Too Many Requests) beradi va testlar beqaror bo'ladi.
limiter.enabled = False

# ── Yagona, xotiradagi (in-memory) test bazasi ──────────────────────────────
test_engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Har bir test uchun toza jadvallar va sessiya."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """get_db bog'liqligini test bazasiga almashtirilgan TestClient."""
    from app.main import app

    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
