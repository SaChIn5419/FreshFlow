from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.core import security
from app.core.security import get_password_hash

def test_create_customer(client: TestClient, db: Session) -> None:
    user = User(
        email="admin_cust@example.com",
        password_hash=get_password_hash("password"),
        role="ADMIN",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))

    response = client.post(
        "/api/v1/customers/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "restaurant_name": "Test Restaurant",
            "email": "test_rest@example.com",
            "password": "password123",
            "gst_number": "29ABCDE1234F2Z5",
            "phone": "9988776655",
            "address": "123 Main St",
            "credit_days": 7
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["restaurant_name"] == "Test Restaurant"
    assert "id" in data


def test_read_customers(client: TestClient, db: Session) -> None:
    user = db.query(User).filter(User.email == "admin_cust@example.com").first()
    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))

    response = client.get("/api/v1/customers/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) >= 1
