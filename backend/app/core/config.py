import logging

from fastapi_csrf_protect import CsrfProtect
from pydantic import model_validator
from pydantic_settings import BaseSettings
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)

DEFAULT_MEDIA_SIGNING_KEY = "dev-media-signing-key-change-in-prod"
MEMORY_STORAGE_URI = "memory://"


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ENVIRONMENT: str = "development"
    SESSION_SECRET_KEY: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    GOOGLE_CLIENT_ID: str | None = None
    GOOGLE_CLIENT_SECRET: str | None = None
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    RECAPTCHA_SECRET_KEY: str
    ALLOWED_ORIGINS: str = (
        "http://localhost:8000,http://127.0.0.1:8000,http://localhost:5173,http://127.0.0.1:5173"
    )
    FRONTEND_URL: str = "http://localhost:5173"

    # ===== Kesh / umumiy holat (Redis) =====
    # Bo'sh bo'lsa kesh jarayon-ichi (in-memory) zaxiraga tushadi.
    REDIS_URL: str = ""
    REDIS_SOCKET_TIMEOUT: float = 2.0

    # ===== Rate limiting =====
    RATE_LIMIT_DEFAULT: str = "200/minute"
    # Odatda bo'sh qoldiriladi — REDIS_URL ishlatiladi.
    RATE_LIMIT_STORAGE_URI: str = ""

    media_signing_key: str = DEFAULT_MEDIA_SIGNING_KEY
    MEDIA_CDN_BASE_URL: str = ""
    VIDEO_STORAGE_BUCKET: str = "designora-videos"
    VIDEO_STORAGE_REGION: str = "auto"
    VIDEO_STORAGE_ENDPOINT: str = ""
    VIDEO_STORAGE_ACCESS_KEY: str = ""
    VIDEO_STORAGE_SECRET_KEY: str = ""
    VIDEO_STORAGE_PUBLIC_BASE_URL: str = ""
    VIDEO_UPLOAD_PART_SIZE_MB: int = 16
    VIDEO_UPLOAD_MAX_GB: int = 3
    VIDEO_UPLOAD_URL_TTL_SECONDS: int = 900
    PAYME_KEY: str = ""
    PAYME_MERCHANT_ID: str = ""
    PAYME_CHECKOUT_URL: str = "https://checkout.paycom.uz"
    CLICK_SECRET_KEY: str = ""
    CLICK_SERVICE_ID: str = ""
    CLICK_MERCHANT_ID: str = ""
    CLICK_CHECKOUT_URL: str = "https://my.click.uz/services/pay"

    class Config:
        env_file = ".env"
        extra = "ignore"

    def get_allowed_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    def get_redis_url(self) -> str:
        return self.REDIS_URL.strip()

    def get_rate_limit_storage_uri(self) -> str:
        """Rate limit hisoblagichi qayerda saqlanishini aniqlaydi.

        Ustuvorlik: RATE_LIMIT_STORAGE_URI -> REDIS_URL -> memory://

        memory:// hisoblagichni har bir worker/instance ichida alohida
        saqlaydi. Ya'ni 4 ta worker'da "5/minute" amalda 20/minute bo'lib
        qoladi — auth va to'lov endpointlari uchun bu ochiq eshik.
        Shu sabab production'da umumiy saqlagich majburiy.
        """
        explicit = self.RATE_LIMIT_STORAGE_URI.strip()
        if explicit:
            return explicit
        return self.get_redis_url() or MEMORY_STORAGE_URI

    @model_validator(mode="after")
    def _validate_settings(self):
        if self.ENVIRONMENT == "production":
            missing = []
            if not self.PAYME_KEY.strip():
                missing.append("PAYME_KEY")
            if not self.CLICK_SECRET_KEY.strip():
                missing.append("CLICK_SECRET_KEY")
            if self.media_signing_key == DEFAULT_MEDIA_SIGNING_KEY:
                missing.append("media_signing_key")
            if not all(
                v.strip()
                for v in [
                    self.VIDEO_STORAGE_ACCESS_KEY,
                    self.VIDEO_STORAGE_SECRET_KEY,
                    self.VIDEO_STORAGE_PUBLIC_BASE_URL,
                ]
            ):
                missing.append("VIDEO_STORAGE_ACCESS_KEY/SECRET_KEY/PUBLIC_BASE_URL")
            if self.get_rate_limit_storage_uri() == MEMORY_STORAGE_URI:
                missing.append(
                    "REDIS_URL yoki RATE_LIMIT_STORAGE_URI "
                    "(memory:// ko'p worker'da rate limit'ni buzadi)"
                )
            if missing:
                raise ValueError(
                    "Production secrets/config missing: " + ", ".join(missing)
                )
        if not 5 <= self.VIDEO_UPLOAD_PART_SIZE_MB <= 100:
            raise ValueError(
                "VIDEO_UPLOAD_PART_SIZE_MB 5..100 oralig'ida bo'lishi kerak"
            )
        if not 1 <= self.VIDEO_UPLOAD_MAX_GB <= 5:
            raise ValueError("VIDEO_UPLOAD_MAX_GB 1..5 oralig'ida bo'lishi kerak")
        if self.REDIS_SOCKET_TIMEOUT <= 0:
            raise ValueError("REDIS_SOCKET_TIMEOUT musbat bo'lishi kerak")
        return self


settings = Settings()


def _storage_is_reachable(uri: str) -> bool:
    """Rate limit saqlagichi haqiqatan javob beradimi (PING)."""
    if uri == MEMORY_STORAGE_URI:
        return True
    try:
        from limits.storage import storage_from_string

        return bool(storage_from_string(uri).check())
    except Exception:
        return False


def _build_limiter() -> Limiter:
    """Limiter'ni umumiy saqlagich bilan quradi.

    Production'da saqlagich ishlamasa — jimgina degrade bo'lmaymiz, boot'da
    yiqilamiz. Dev'da esa Redis'siz ham ishlash kerak, shu sabab memory://
    zaxirasiga tushamiz va ogohlantiramiz.
    """
    storage_uri = settings.get_rate_limit_storage_uri()
    if not _storage_is_reachable(storage_uri):
        if settings.ENVIRONMENT == "production":
            raise RuntimeError(
                f"Rate limit saqlagichiga ulanib bo'lmadi: {storage_uri}. "
                "Production'da umumiy saqlagich majburiy."
            )
        logger.warning(
            "Rate limit saqlagichi (%s) javob bermadi — memory:// ga qaytildi. "
            "Bu faqat bitta worker uchun to'g'ri ishlaydi.",
            storage_uri,
        )
        storage_uri = MEMORY_STORAGE_URI
    return Limiter(
        key_func=get_remote_address,
        default_limits=[settings.RATE_LIMIT_DEFAULT],
        storage_uri=storage_uri,
    )


limiter = _build_limiter()


@CsrfProtect.load_config
def get_csrf_config():
    return [("secret_key", settings.SECRET_KEY)]
