"""Roadmap 3.29 SEO policy and document tests."""

from app.services.seo_service import build_robots, build_sitemap, canonical_url


def test_canonical_removes_query_fragment_and_trailing_slash():
    assert canonical_url("https://designora.uz/", "/kurslar/12/?utm=x#buy") == "https://designora.uz/kurslar/12"


def test_robots_protects_private_routes_but_allows_verify_noindex_page():
    text = build_robots("https://designora.uz/sitemap.xml")
    assert "Disallow: /api/" in text
    assert "Disallow: /checkout" in text
    assert "Disallow: /verify" not in text
    assert "Sitemap: https://designora.uz/sitemap.xml" in text


def test_sitemap_is_valid_escaped_and_deduplicated():
    xml = build_sitemap(
        [
            {"loc": "https://designora.uz/kurslar/1?a=1&b=2", "priority": "0.8"},
            {"loc": "https://designora.uz/kurslar/1?a=1&b=2"},
        ]
    )
    assert xml.startswith('<?xml version="1.0"')
    assert "http://www.sitemaps.org/schemas/sitemap/0.9" in xml
    assert "a=1&amp;b=2" in xml
    assert xml.count("<url>") == 1
