from fastapi_csrf_protect import CsrfProtect
from pydantic import model_validator
from pydantic_settings import BaseSettings
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address, default_limits=["200/minute"], storage_uri="memory://"
)
DEFAULT_MEDIA_SIGNING_KEY = "dev-media-signing-key-change-in-prod"


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
        return self


settings = Settings()


@CsrfProtect.load_config
def get_csrf_config():
    return [("secret_key", settings.SECRET_KEY)]
