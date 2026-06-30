from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_register(client: TestClient, db: Session) -> None:
    response = client.post(
        "/auth/register",
        json={"email": "test@example.com", "password": "password", "role": "CUSTOMER"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data


def test_login(client: TestClient, db: Session) -> None:
    response = client.post(
        "/auth/login", data={"username": "test@example.com", "password": "password"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_me(client: TestClient, db: Session) -> None:
    login_response = client.post(
        "/auth/login", data={"username": "test@example.com", "password": "password"}
    )
    token = login_response.json()["access_token"]
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
