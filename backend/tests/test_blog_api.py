"""Blog API testlari (BOSQICH 4)."""

from app.core.security import create_access_token
from app.models.blog import BlogPost
from app.models.user import User


def _make_user(db, email, role="user"):
    user = User(email=email, name=email.split("@")[0], role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _auth(email):
    return {"Authorization": f"Bearer {create_access_token(email)}"}


def test_blog_create_requires_author_role(client, db_session):
    _make_user(db_session, "student@example.com", role="user")
    resp = client.post(
        "/api/blog",
        json={"title": "Mening maqolam"},
        headers=_auth("student@example.com"),
    )
    assert resp.status_code == 403


def test_blog_create_publish_and_read(client, db_session):
    _make_user(db_session, "author@example.com", role="instructor")
    h = _auth("author@example.com")

    create = client.post(
        "/api/blog",
        json={"title": "Dizayn trendlari 2026", "body": "matn"},
        headers=h,
    )
    assert create.status_code == 201
    post_id = create.json()["id"]
    slug = create.json()["slug"]
    assert slug == "dizayn-trendlari-2026"

    # Chop etilmagan post ommaviy ko'rinmaydi
    assert client.get(f"/api/blog/{slug}").status_code == 404

    client.post(f"/api/blog/{post_id}/publish", headers=h)
    read = client.get(f"/api/blog/{slug}")
    assert read.status_code == 200
    assert read.json()["title"] == "Dizayn trendlari 2026"

    # ko'rishlar soni oshadi
    db_session.expire_all()
    post = db_session.query(BlogPost).filter(BlogPost.id == post_id).first()
    assert (post.views or 0) >= 1


def test_blog_list_only_published(client, db_session):
    _make_user(db_session, "author2@example.com", role="admin")
    h = _auth("author2@example.com")
    c1 = client.post("/api/blog", json={"title": "Chop etilgan"}, headers=h)
    client.post("/api/blog", json={"title": "Qoralama"}, headers=h)
    client.post(f"/api/blog/{c1.json()['id']}/publish", headers=h)

    resp = client.get("/api/blog")
    assert resp.status_code == 200
    titles = [p["title"] for p in resp.json()["results"]]
    assert "Chop etilgan" in titles
    assert "Qoralama" not in titles
