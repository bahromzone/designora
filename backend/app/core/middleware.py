import logging
import time

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.core import metrics
from app.core.config import settings

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://accounts.google.com; frame-src 'self' https://www.google.com;"
        return response


class IPBlockingMiddleware(BaseHTTPMiddleware):
    BLOCKED_IPS: set[str] = set()

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        if client_ip in self.BLOCKED_IPS:
            return JSONResponse(status_code=403, content={"detail": "Access forbidden"})
        return await call_next(request)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        started = time.perf_counter()
        response = await call_next(request)
        metrics.inc_counter("http_requests_total", method=request.method, path=request.url.path, status=str(response.status_code))
        metrics.observe("http_request_duration_seconds", time.perf_counter() - started)
        logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
        return response


async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Too many requests. Please try again later.", "retry_after": 60})
