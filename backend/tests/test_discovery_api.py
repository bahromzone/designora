"""Discovery (qidiruv/filtr/tavsiya) API testlari (BOSQICH 4)."""

from app.models.Course import Course


def _mk(db, **kw):
    defaults = dict(is_active=True, status="published")
    defaults.update(kw)
    course = Course(**defaults)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def test_search_by_keyword(client, db_session):
    _mk(db_session, title="Fashion asoslari", category="fashion")
    _mk(db_session, title="Tekstil dizayni", category="textile")
    resp = client.get("/api/discovery/search", params={"q": "fashion"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 1
    assert data["results"][0]["title"] == "Fashion asoslari"


def test_search_filter_by_category_and_price(client, db_session):
    _mk(db_session, title="A", category="fashion", price=100)
    _mk(db_session, title="B", category="fashion", price=500)
    _mk(db_session, title="C", category="textile", price=100)
    resp = client.get(
        "/api/discovery/search",
        params={"category": "fashion", "max_price": 200},
    )
    data = resp.json()
    assert data["total"] == 1
    assert data["results"][0]["title"] == "A"


def test_search_excludes_inactive(client, db_session):
    _mk(db_session, title="Live", is_active=True)
    _mk(db_session, title="Draft", is_active=False)
    resp = client.get("/api/discovery/search")
    titles = [r["title"] for r in resp.json()["results"]]
    assert "Live" in titles
    assert "Draft" not in titles


def test_bestselling_endpoint(client, db_session):
    _mk(db_session, title="Low", students_count=5)
    _mk(db_session, title="High", students_count=500)
    resp = client.get("/api/discovery/recommendations/bestselling")
    assert resp.status_code == 200
    assert resp.json()[0]["title"] == "High"


def test_categories_endpoint(client, db_session):
    _mk(db_session, title="A", category="fashion")
    _mk(db_session, title="B", category="fashion")
    _mk(db_session, title="C", category="textile")
    resp = client.get("/api/discovery/categories")
    data = resp.json()
    counts = {row["category"]: row["count"] for row in data}
    assert counts["fashion"] == 2
    assert counts["textile"] == 1
