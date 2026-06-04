"""
Security Middleware — CORS, Rate Limiting, Security Headers
"""
from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Limiter config.py dan — bu faylda yangi instance yaratilmaydi
# from core.config import limiter  ← main.py da import qilinadi


# ===== SECURITY HEADERS MIDDLEWARE =====
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"

        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com "
            "https://unpkg.com https://www.google.com https://www.gstatic.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com "
            "https://cdn.tailwindcss.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://accounts.google.com; "
            "frame-src 'self' https://www.google.com;"
        )
        response.headers["Content-Security-Policy"] = csp

        return response


# ===== IP BLOCKING MIDDLEWARE =====
class IPBlockingMiddleware(BaseHTTPMiddleware):
    """Ma'lum IP addresslarni bloklash. Production da Redis/DB dan yuklanadi."""
    BLOCKED_IPS: set[str] = set()

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        if client_ip in self.BLOCKED_IPS:
            logger.warning(f"Blocked IP attempted access: {client_ip}")
            return JSONResponse(
                status_code=403,
                content={"detail": "Access forbidden"}
            )
        return await call_next(request)


# ===== REQUEST LOGGING MIDDLEWARE =====
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger.info(
            f"{request.method} {request.url.path} — "
            f"IP: {request.client.host} — "
            f"UA: {request.headers.get('user-agent', 'unknown')}"
        )
        response = await call_next(request)
        logger.info(
            f"Response: {response.status_code} — "
            f"{request.method} {request.url.path}"
        )
        return response


# ===== RATE LIMIT EXCEPTION HANDLER =====
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.warning(
        f"Rate limit exceeded — "
        f"IP: {request.client.host} — "
        f"Path: {request.url.path}"
    )
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests. Please try again later.",
            "retry_after": 60
        }
    )