"""SEO yordamchilari — sitemap.xml va robots.txt generatsiyasi (BOSQICH 5).

Sof funksiyalar, DB'siz — to'liq unit-test qilinadi.
"""

from __future__ import annotations

from xml.sax.saxutils import escape


def build_robots(sitemap_url: str) -> str:
    """robots.txt matnini yaratadi."""
    return "\n".join(
        [
            "User-agent: *",
            "Allow: /",
            f"Sitemap: {sitemap_url}",
            "",
        ]
    )


def build_sitemap(entries: list[dict]) -> str:
    """sitemap.xml matnini yaratadi.

    entries: [{"loc": "https://...", "lastmod": "2026-07-07"}] (lastmod ixtiyoriy)
    """
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for entry in entries:
        loc = escape(str(entry.get("loc", "")))
        parts.append("  <url>")
        parts.append(f"    <loc>{loc}</loc>")
        lastmod = entry.get("lastmod")
        if lastmod:
            parts.append(f"    <lastmod>{escape(str(lastmod))}</lastmod>")
        parts.append("  </url>")
    parts.append("</urlset>")
    return "\n".join(parts) + "\n"
