from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.core import security
from app.core.security import get_password_hash

def test_create_product(client: TestClient, db: Session) -> None:
    user = User(
        email="admin_prod@example.com",
        password_hash=get_password_hash("password"),
        role="ADMIN",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))

    response = client.post(
        "/api/v1/products/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Tomato",
            "category": "Vegetable",
            "unit": "Kg",
            "default_price": 50.0,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Tomato"
    assert "id" in data


def test_read_products(client: TestClient, db: Session) -> None:
    user = db.query(User).filter(User.email == "admin_prod@example.com").first()
    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))

    response = client.get("/api/v1/products/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) >= 1
