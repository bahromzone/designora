"""SEO (sitemap/robots) xizmati birlik testlari (BOSQICH 5) — DB'siz."""

from app.services.seo_service import build_robots, build_sitemap


def test_robots_contains_sitemap():
    txt = build_robots("https://designora.uz/sitemap.xml")
    assert "User-agent: *" in txt
    assert "Sitemap: https://designora.uz/sitemap.xml" in txt


def test_sitemap_structure():
    xml = build_sitemap(
        [
            {"loc": "https://designora.uz"},
            {"loc": "https://designora.uz/courses/1", "lastmod": "2026-07-07"},
        ]
    )
    assert xml.startswith('<?xml version="1.0"')
    assert "<urlset" in xml
    assert "<loc>https://designora.uz/courses/1</loc>" in xml
    assert "<lastmod>2026-07-07</lastmod>" in xml
    assert xml.count("<url>") == 2


def test_sitemap_escapes_special_chars():
    xml = build_sitemap([{"loc": "https://x.uz/?a=1&b=2"}])
    assert "&amp;" in xml
    assert "&b=2" not in xml
