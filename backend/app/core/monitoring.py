"""Sentry monitoringini ixtiyoriy ishga tushirish (BOSQICH 5).

SENTRY_DSN belgilanmagan yoki `sentry_sdk` o'rnatilmagan bo'lsa — no-op.
Shu sabab CI va lokal muhitda hech narsa buzilmaydi.
"""

from __future__ import annotations

from app.core.config import settings


def init_sentry() -> bool:
    """Sentry'ni ishga tushiradi. Ishga tushsa True, aks holda False."""
    if not settings.SENTRY_DSN:
        return False
    try:
        import sentry_sdk
    except ImportError:  # pragma: no cover
        return False
    sentry_sdk.init(  # pragma: no cover
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=0.1,
    )
    return True  # pragma: no cover
