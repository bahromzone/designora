"""HTTP performance policies for browser and CDN caching."""

from time import perf_counter

from starlette.middleware.base import BaseHTTPMiddleware

PUBLIC_CACHE_PREFIXES = ("/api/courses", "/api/discovery", "/api/blog", "/api/instructors", "/sitemap.xml")


class PerformanceHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        started = perf_counter()
        response = await call_next(request)
        duration_ms = (perf_counter() - started) * 1000
        response.headers["Server-Timing"] = f'app;dur={duration_ms:.2f}'
        response.headers["Timing-Allow-Origin"] = "*"
        if (
            request.method == "GET"
            and response.status_code == 200
            and not request.headers.get("authorization")
            and request.url.path.startswith(PUBLIC_CACHE_PREFIXES)
        ):
            response.headers.setdefault("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
            response.headers.setdefault("Vary", "Accept-Encoding, Authorization")
        return response
