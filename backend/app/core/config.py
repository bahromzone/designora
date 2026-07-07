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

    # ===== TO'LOV: PAYME (Paycom Merchant API) =====
    PAYME_MERCHANT_ID: str | None = None
    PAYME_MERCHANT_KEY: str | None = None  # X-Auth kaliti (webhook tekshiruvi)
    PAYME_TEST_KEY: str | None = None
    PAYME_KEY: str | None = None
    PAYME_CHECKOUT_URL: str = "https://checkout.paycom.uz"

    # ===== TO'LOV: CLICK =====
    CLICK_SERVICE_ID: str | None = None
    CLICK_MERCHANT_ID: str | None = None
    CLICK_SECRET_KEY: str | None = None
    CLICK_CHECKOUT_URL: str = "https://my.click.uz/services/pay"

    # ===== CORS =====
    # 5173 — Vite dev server (React frontend)
    ALLOWED_ORIGINS: str = (
        "http://localhost:8000,http://127.0.0.1:8000,"
        "http://localhost:5173,http://127.0.0.1:5173"
    )

    # ===== FRONTEND =====
    FRONTEND_URL: str = "http://localhost:5173"

    # ===== BOSQICH 5: MIQYOSLASH VA MUKAMMALLIK =====
    # Kesh / navbat (ixtiyoriy — o'rnatilmasa xotiradagi kesh ishlatiladi)
    REDIS_URL: str | None = None
    # Monitoring (ixtiyoriy — DSN bo'lmasa Sentry o'chirilgan)
    SENTRY_DSN: str | None = None
    # Video kontent himoyasi uchun signed URL kaliti (bo'lmasa SECRET_KEY)
    MEDIA_SIGNING_KEY: str | None = None
    # Video CDN bazaviy manzili (Mux / Bunny / Cloudflare Stream)
    MEDIA_CDN_BASE_URL: str = ""
    # Ko'p tillilik (i18n)
    DEFAULT_LANGUAGE: str = "uz"

    class Config:
        env_file = ".env"
        # ✅ BUG #17 FIX: "forbid" → "ignore"
        # "forbid" edi: hosting tomonidan avtomatik qo'shiladigan
        # PORT, DATABASE_URL kabi o'zgaruvchilar server ko'tarilmasligiga sabab bo'lardi.
        extra = "ignore"

    def get_allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    @property
    def media_signing_key(self) -> str:
        """Video signed URL kaliti — alohida belgilanmagan bo'lsa SECRET_KEY."""
        return self.MEDIA_SIGNING_KEY or self.SECRET_KEY


settings = Settings()


@CsrfProtect.load_config
def get_csrf_config():
    return [
        ("secret_key", settings.SECRET_KEY),
    ]
