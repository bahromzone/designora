from fastapi_csrf_protect import CsrfProtect
from pydantic import model_validator
from pydantic_settings import BaseSettings
from slowapi import Limiter
from slowapi.util import get_remote_address

# ===== YAGONA LIMITER (barcha joylarda shu ishlatiladi) =====
limiter = Limiter(
    key_func=get_remote_address, default_limits=["200/minute"], storage_uri="memory://"
)

# Dev uchun media imzo kaliti. Production'da almashtirilishi SHART —
# quyidagi validator buni tekshiradi.
DEFAULT_MEDIA_SIGNING_KEY = "dev-media-signing-key-change-in-prod"


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

    # ===== MEDIA (signed video URL) =====
    # HMAC imzo kaliti va (ixtiyoriy) CDN bazasi. CDN bo'lmasa nisbiy
    # /video/... havola ishlatiladi. Prod'da media_signing_key ni almashtiring.
    media_signing_key: str = DEFAULT_MEDIA_SIGNING_KEY
    MEDIA_CDN_BASE_URL: str = ""

    # ===== PAYME =====
    # Merchant API kaliti (webhook auth) + checkout uchun merchant ID/URL.
    PAYME_KEY: str = ""
    PAYME_MERCHANT_ID: str = ""
    PAYME_CHECKOUT_URL: str = "https://checkout.paycom.uz"

    # ===== CLICK =====
    CLICK_SECRET_KEY: str = ""
    CLICK_SERVICE_ID: str = ""
    CLICK_MERCHANT_ID: str = ""
    CLICK_CHECKOUT_URL: str = "https://my.click.uz/services/pay"

    class Config:
        env_file = ".env"
        # ✅ BUG #17 FIX: "forbid" → "ignore"
        # "forbid" edi: hosting tomonidan avtomatik qo'shiladigan
        # PORT, DATABASE_URL kabi o'zgaruvchilar server ko'tarilmasligiga sabab bo'lardi.
        extra = "ignore"

    def get_allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    # ── XAVFSIZLIK: prod'da xavfli standart qiymatlar bilan ishga tushmaslik ──
    #
    # Avval PAYME_KEY / CLICK_SECRET_KEY sukut bo'yicha bo'sh ("") edi. Bo'sh
    # kalit bilan deploy qilinsa to'lov webhook'larini istalgan odam
    # soxtalashtirib, to'lovsiz kurs ochib olishi mumkin edi. Endi server
    # bunday konfiguratsiya bilan umuman ko'tarilmaydi — xato deploy paytida
    # ko'rinadi, prodda jim ishlab turmaydi.
    @model_validator(mode="after")
    def _require_production_secrets(self):
        if self.ENVIRONMENT != "production":
            return self

        missing: list[str] = []
        if not (self.PAYME_KEY or "").strip():
            missing.append("PAYME_KEY")
        if not (self.CLICK_SECRET_KEY or "").strip():
            missing.append("CLICK_SECRET_KEY")
        if self.media_signing_key == DEFAULT_MEDIA_SIGNING_KEY:
            missing.append("media_signing_key (dev qiymati o'zgartirilmagan)")

        if missing:
            raise ValueError(
                "Production muhitida quyidagi maxfiy kalitlar to'ldirilishi SHART: "
                + ", ".join(missing)
                + ". Bo'sh kalit bilan to'lov webhook'lari soxtalashtirilishi mumkin."
            )
        return self


settings = Settings()


@CsrfProtect.load_config
def get_csrf_config():
    return [
        ("secret_key", settings.SECRET_KEY),
    ]
