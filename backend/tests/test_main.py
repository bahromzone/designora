"""Asosiy ilova endpointlari testlari."""


def test_home_endpoint(client):
    resp = client.get("/")
    assert resp.status_code == 200
    body = resp.json()
    assert body["app"] == "Designora API"
    assert body["status"] == "ok"


def test_me_redirects_to_profile(client):
    resp = client.get("/api/me", follow_redirects=False)
    assert resp.status_code == 307
    assert resp.headers["location"] == "/api/profile/me"


def test_security_headers_present(client):
    resp = client.get("/")
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"


def test_docs_available_in_dev(client):
    resp = client.get("/docs")
    assert resp.status_code == 200
