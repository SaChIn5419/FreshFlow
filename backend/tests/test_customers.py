from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.core import security
from datetime import timedelta


def test_create_customer(client: TestClient, db: Session) -> None:
    # First create an admin user and get token
    user = User(
        email="admin_customer@example.com",
        password_hash=security.get_password_hash("password"),
        role="ADMIN",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))

    response = client.post(
        "/customers/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "user_id": user.id,
            "restaurant_name": "Test Restobar",
            "credit_days": 15,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["restaurant_name"] == "Test Restobar"
    assert "id" in data


def test_read_customers(client: TestClient, db: Session) -> None:
    # Get token for admin user
    user = db.query(User).filter(User.email == "admin_customer@example.com").first()
    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))

    response = client.get("/customers/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
