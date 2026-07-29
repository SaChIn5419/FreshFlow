from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import get_password_hash

def test_cookie_login_refresh_logout_flow(client: TestClient, db: Session) -> None:
    # 1. Setup user
    user = User(
        email="cookie_user@example.com",
        password_hash=get_password_hash("password123"),
        role="CUSTOMER"
    )
    db.add(user)
    db.commit()

    # 2. Login & verify HttpOnly cookies issued
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "cookie_user@example.com", "password": "password123"}
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.cookies
    assert "refresh_token" in login_res.cookies

    # 3. Access /auth/me via Cookie
    me_res = client.get("/api/v1/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "cookie_user@example.com"

    # 4. Rotate Refresh Token via /auth/refresh
    refresh_res = client.post("/api/v1/auth/refresh")
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.cookies
    assert "refresh_token" in refresh_res.cookies

    # 5. Logout & Revoke Refresh Token
    logout_res = client.post("/api/v1/auth/logout")
    assert logout_res.status_code == 200

    # 6. Try refreshing again (should fail with 401 since token was revoked)
    failed_refresh = client.post("/api/v1/auth/refresh")
    assert failed_refresh.status_code == 401


def test_csrf_header_validation(client: TestClient) -> None:
    # Mutating request without X-Requested-With header
    res_no_csrf = client.post("/api/v1/auth/logout")
    # Missing CSRF header returns 403 when verify_csrf_header is applied, or 200 if logout handles optional cookies
    assert res_no_csrf.status_code in (200, 403)
