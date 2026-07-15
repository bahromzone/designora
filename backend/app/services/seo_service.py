"""SEO helpers for canonical URLs, robots.txt and XML sitemaps."""

from __future__ import annotations

from urllib.parse import urljoin, urlsplit, urlunsplit
from xml.sax.saxutils import escape

PRIVATE_PATHS = (
    "/api/",
    "/admin",
    "/dashboard",
    "/checkout",
    "/profil",
    "/organish",
    "/instructor/dashboard",
)


def canonical_url(base_url: str, path: str = "/") -> str:
    """Return a normalized, query-free absolute canonical URL."""
    base = base_url.rstrip("/") + "/"
    absolute = urljoin(base, path.lstrip("/"))
    parts = urlsplit(absolute)
    clean_path = parts.path or "/"
    if clean_path != "/":
        clean_path = clean_path.rstrip("/")
    return urlunsplit((parts.scheme, parts.netloc, clean_path, "", ""))


def build_robots(sitemap_url: str, private_paths: tuple[str, ...] = PRIVATE_PATHS) -> str:
    """Create a production robots policy without blocking public noindex pages."""
    lines = ["User-agent: *", "Allow: /"]
    lines.extend(f"Disallow: {path}" for path in private_paths)
    lines.extend([f"Sitemap: {sitemap_url}", ""])
    return "\n".join(lines)


def build_sitemap(entries: list[dict]) -> str:
    """Create a standards-compliant, safely escaped sitemap document."""
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    seen: set[str] = set()
    for entry in entries:
        loc = str(entry.get("loc", "")).strip()
        if not loc or loc in seen:
            continue
        seen.add(loc)
        parts.append("  <url>")
        parts.append(f"    <loc>{escape(loc)}</loc>")
        if entry.get("lastmod"):
            parts.append(f"    <lastmod>{escape(str(entry['lastmod']))}</lastmod>")
        if entry.get("changefreq"):
            parts.append(f"    <changefreq>{escape(str(entry['changefreq']))}</changefreq>")
        if entry.get("priority") is not None:
            parts.append(f"    <priority>{escape(str(entry['priority']))}</priority>")
        parts.append("  </url>")
    parts.append("</urlset>")
    return "\n".join(parts) + "\n"
