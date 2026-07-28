from datetime import UTC, datetime, timedelta
import pytest
from fastapi import HTTPException
from app.core.password import hash_password
from app.core.security import create_access_token, get_current_user
from app.models.refresh_token import RefreshToken
from app.models.user import User

def test_existing_token_is_rejected_after_account_is_blocked(client, db_session):
    user=User(email="blocked@example.com",name="Blocked",role="user",password=hash_password("Password123"),is_active=True);db_session.add(user);db_session.commit()
    token=create_access_token(user.email);user.is_active=False;db_session.commit()
    response=client.get("/api/profile/me",headers={"Authorization":f"Bearer {token}"})
    assert response.status_code==403

def test_blocked_user_cannot_login(client, db_session):
    user=User(email="login-blocked@example.com",name="Blocked",role="user",password=hash_password("Password123"),is_active=False);db_session.add(user);db_session.commit()
    response=client.post("/api/auth/login",json={"email":user.email,"password":"Password123","recaptcha_token":"dummy"})
    assert response.status_code==403

def test_refresh_for_blocked_user_is_rejected(client, db_session):
    user=User(email="refresh-blocked@example.com",name="Blocked",role="user",password=hash_password("Password123"),is_active=False);db_session.add(user);db_session.commit()
    db_session.add(RefreshToken(user_id=user.id,token_hash="known-hash",expires_at=datetime.now(UTC)+timedelta(days=1)));db_session.commit()
    response=client.post("/api/auth/login",json={"email":user.email,"password":"Password123","recaptcha_token":"dummy"})
    assert response.status_code==403
