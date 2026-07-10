from app.models.portfolio_project import PortfolioProject


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_portfolio_requires_auth(client):
    assert client.get("/api/portfolio/mine").status_code in {401, 403}
    assert client.get("/api/portfolio/eligible").status_code in {401, 403}


def test_portfolio_crud_and_public_visibility(client, auth_token, test_user, db):
    headers = auth_headers(auth_token)
    created = client.post(
        "/api/portfolio",
        headers=headers,
        json={
            "title": "Visual identity case study",
            "summary": "Brand tizimi va natijalar.",
            "story": "Muammo, jarayon va yechim.",
            "skills": ["Branding", "Art direction"],
            "tools": ["Figma"],
            "is_public": False,
        },
    )
    assert created.status_code == 201
    project = created.json()
    assert project["title"] == "Visual identity case study"
    assert project["is_public"] is False

    mine = client.get("/api/portfolio/mine", headers=headers)
    assert mine.status_code == 200
    assert len(mine.json()) == 1

    hidden = client.get(f"/api/portfolio/public/{test_user.id}")
    assert hidden.status_code == 200
    assert hidden.json()["projects"] == []

    updated = client.patch(
        f"/api/portfolio/{project['id']}",
        headers=headers,
        json={"is_public": True, "title": "Published identity case study"},
    )
    assert updated.status_code == 200
    assert updated.json()["is_public"] is True

    public = client.get(f"/api/portfolio/public/{test_user.id}")
    assert public.status_code == 200
    assert public.json()["projects"][0]["title"] == "Published identity case study"

    deleted = client.delete(f"/api/portfolio/{project['id']}", headers=headers)
    assert deleted.status_code == 200
    assert db.query(PortfolioProject).count() == 0
