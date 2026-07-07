"""System API testlari — health, metrics, SEO, i18n (BOSQICH 5)."""

from app.models.blog import BlogPost
from app.models.Course import Course


def test_health(client, db_session):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_ready(client, db_session):
    resp = client.get("/ready")
    assert resp.status_code == 200
    assert resp.json()["database"] == "ok"


def test_metrics_endpoint(client, db_session):
    # istalgan so'rov metrikani oshiradi
    client.get("/health")
    resp = client.get("/metrics")
    assert resp.status_code == 200
    assert "http_requests_total" in resp.text


def test_robots(client, db_session):
    resp = client.get("/robots.txt")
    assert resp.status_code == 200
    assert "User-agent: *" in resp.text
    assert "Sitemap:" in resp.text


def test_sitemap_includes_course_and_post(client, db_session):
    course = Course(title="Sitemap kursi", slug="sitemap-kursi", is_active=True)
    db_session.add(course)
    post = BlogPost(slug="salom-blog", title="Salom", is_published=True)
    db_session.add(post)
    db_session.commit()

    from app.services import cache

    cache.clear()
    resp = client.get("/sitemap.xml")
    assert resp.status_code == 200
    assert "application/xml" in resp.headers["content-type"]
    assert "/courses/sitemap-kursi" in resp.text
    assert "/blog/salom-blog" in resp.text


def test_i18n_languages(client, db_session):
    resp = client.get("/api/i18n/languages")
    assert resp.status_code == 200
    assert resp.json()["default"] == "uz"
    assert "ru" in resp.json()["supported"]


def test_i18n_catalog(client, db_session):
    resp = client.get("/api/i18n/en")
    assert resp.status_code == 200
    data = resp.json()
    assert data["lang"] == "en"
    assert data["catalog"]["courses"] == "Courses"


def test_i18n_unknown_lang_falls_back(client, db_session):
    resp = client.get("/api/i18n/fr")
    assert resp.status_code == 200
    assert resp.json()["lang"] == "uz"
