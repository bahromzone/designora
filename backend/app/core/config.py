from fastapi_csrf_protect import CsrfProtect
from pydantic_settings import BaseSettings
from slowapi import Limiter
from slowapi.util import get_remote_address

# ===== YAGONA LIMITER (barcha joylarda shu ishlatiladi) =====
limiter = Limiter(
    key_func=get_remote_address, default_limits=["200/minute"], storage_uri="memory://"
)


class Settings(BaseSettings):
    # ===== DATABASE =====
    DATABASE_URL: str
    SECRET_KEY: str
    ENVIRONMENT: str = "development"

    # ===== SESSION =====
    SESSION_SECRET_KEY: str

    # ===== JWT =====
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    # ===== GOOGLE =====
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None

    # ===== EMAIL =====
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str

    # ===== RECAPTCHA =====
    RECAPTCHA_SECRET_KEY: str

    # ===== CORS =====
    # 5173 — Vite dev server (React frontend)
    ALLOWED_ORIGINS: str = (
        "http://localhost:8000,http://127.0.0.1:8000,"
        "http://localhost:5173,http://127.0.0.1:5173"
    )

    # ===== FRONTEND =====
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        # ✅ BUG #17 FIX: "forbid" → "ignore"
        # "forbid" edi: hosting tomonidan avtomatik qo'shiladigan
        # PORT, DATABASE_URL kabi o'zgaruvchilar server ko'tarilmasligiga sabab bo'lardi.
        extra = "ignore"

    def get_allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()


@CsrfProtect.load_config
def get_csrf_config():
    return [
        ("secret_key", settings.SECRET_KEY),
    ]
