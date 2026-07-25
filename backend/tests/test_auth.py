from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security import get_password_hash

def test_login(client: TestClient, db: Session) -> None:
    # Setup test user
    user = User(
        email="test_login@example.com",
        password_hash=get_password_hash("password"),
        role="CUSTOMER"
    )
    db.add(user)
    db.commit()

    response = client.post(
        "/api/v1/auth/login", data={"username": "test_login@example.com", "password": "password"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data

def test_me(client: TestClient, db: Session) -> None:
    # Setup test user
    user = User(
        email="test_me@example.com",
        password_hash=get_password_hash("password"),
        role="CUSTOMER"
    )
    db.add(user)
    db.commit()

    login_response = client.post(
        "/api/v1/auth/login", data={"username": "test_me@example.com", "password": "password"}
    )
    token = login_response.json()["access_token"]
    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test_me@example.com"
