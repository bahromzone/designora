"""
Pytest umumiy fixture'lari.

MUHIM: Sozlamalar (Settings) muhit o'zgaruvchilaridan o'qiladi va ba'zilari
majburiy (default'siz). Shu sabab app modullari import qilinishidan OLDIN
bu yerda test uchun xavfsiz qiymatlar o'rnatiladi.

TEST BAZASI
-----------
`TEST_DATABASE_URL` orqali boshqariladi:

  - default: `sqlite+pysqlite:///:memory:` — lokal ishlab chiqish uchun tez.
  - CI: `postgresql+psycopg2://...` — prod bilan bir xil dialekt.

SQLite bilan PostgreSQL bir xil emas (JSON, ON DELETE, VARCHAR uzunligi,
tranzaksiya semantikasi). Shu sabab CI ikkala rejimda ham yuritiladi va
PostgreSQL natijasi hal qiluvchi hisoblanadi.
"""

import os

_DEFAULT_TEST_DB = "sqlite+pysqlite:///:memory:"
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "").strip() or _DEFAULT_TEST_DB
IS_SQLITE = TEST_DATABASE_URL.startswith("sqlite")

# ── Test muhiti o'zgaruvchilari (app import qilinishidan oldin) ──────────────
# DATABASE_URL setdefault EMAS: testlar hech qachon haqiqiy bazaga tegmasligi
# uchun majburan test bazasiga yo'naltiriladi.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ.setdefault("ENVIRONMENT", "development")
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

# ── Test bazasi engine'i ────────────────────────────────────────────────────
if IS_SQLITE:
    test_engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    test_engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def _reset_tables() -> None:
    """Barcha jadvallarni bo'shatadi va identity'larni qaytaradi.

    Faqat SQLite bo'lmagan (ya'ni PostgreSQL) rejimda ishlatiladi: har test
    uchun 35 ta jadvalni qayta yaratishdan ko'ra TRUNCATE ancha tez.
    """
    tables = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
    if not tables:
        return
    with test_engine.begin() as conn:
        # Ochiq qolgan ulanish TRUNCATE'ni cheksiz kutishga majburlamasin —
        # muammo bo'lsa qotib qolmay, aniq xato bersin.
        conn.exec_driver_sql("SET LOCAL lock_timeout = '15s'")
        conn.exec_driver_sql(f"TRUNCATE {tables} RESTART IDENTITY CASCADE")


@pytest.fixture(scope="session", autouse=True)
def database_schema():
    """PostgreSQL uchun sxemani sessiyada bir marta quradi."""
    if IS_SQLITE:
        yield
        return
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def db_session(database_schema):
    """Har bir test uchun toza jadvallar va sessiya."""
    if IS_SQLITE:
        Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        # Buzilgan tranzaksiya keyingi testga o'tib ketmasin (PostgreSQL
        # xatodan keyin butun tranzaksiyani bloklaydi).
        session.rollback()
        session.close()
        if IS_SQLITE:
            Base.metadata.drop_all(bind=test_engine)
        else:
            _reset_tables()


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
