from app.core.security import create_access_token
from app.models.user import User

AVATAR = "https://cdn.designora.uz/avatars/1.png"


def _user(db, email="profile@example.com"):
    user = User(email=email, name="Profil User", role="user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _headers(user):
    return {"Authorization": f"Bearer {create_access_token(user.email)}"}


def test_profile_update_persists_avatar_url(client, db_session):
    """Avatar URL haqiqatan bazaga yozilishi shart.

    Regressiya: forma avatar_url yuborardi, lekin ProfileUpdateRequest bu
    maydonni bilmagani uchun Pydantic uni jimgina tashlab yuborardi va
    foydalanuvchi "saqlandi" xabarini ko'rib, reload'dan keyin eski
    avatarga qaytardi.
    """
    user = _user(db_session)
    payload = {
        "name": "Bahromjon",
        "bio": "Dizayn o'rganyapman",
        "phone": "+998901234567",
        "location": "Toshkent",
        "website": "https://designora.uz",
        "avatar_url": AVATAR,
    }

    response = client.patch(
        "/api/profile/update",
        json=payload,
        headers=_headers(user),
    )
    assert response.status_code == 200

    db_session.refresh(user)
    assert user.avatar_url == AVATAR

    me = client.get("/api/profile/me", headers=_headers(user)).json()
    assert me["avatar_url"] == AVATAR
    assert me["name"] == "Bahromjon"
    assert me["location"] == "Toshkent"


def test_profile_update_keeps_avatar_when_omitted(client, db_session):
    user = _user(db_session, "keep-avatar@example.com")
    user.avatar_url = AVATAR
    db_session.commit()

    response = client.patch(
        "/api/profile/update",
        json={"name": "Yangi ism"},
        headers=_headers(user),
    )
    assert response.status_code == 200

    db_session.refresh(user)
    assert user.avatar_url == AVATAR
    assert user.name == "Yangi ism"


def test_profile_update_rejects_short_name(client, db_session):
    user = _user(db_session, "short-name@example.com")

    response = client.patch(
        "/api/profile/update",
        json={"name": "B"},
        headers=_headers(user),
    )
    assert response.status_code == 422

    db_session.refresh(user)
    assert user.name == "Profil User"
