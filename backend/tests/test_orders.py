from datetime import timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.core import security
from app.core.security import get_password_hash

def test_create_order(client: TestClient, db: Session) -> None:
    user = User(
        email="admin_ord@example.com",
        password_hash=get_password_hash("password"),
        role="ADMIN",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    customer = Customer(user_id=user.id, restaurant_name="Order Test Rest")
    db.add(customer)
    
    product = Product(name="Tomato", unit="KG")
    db.add(product)
    db.commit()
    
    db.refresh(customer)
    db.refresh(product)

    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))

    order_response = client.post(
        "/api/v1/orders/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "customer_id": str(customer.id),
            "remarks": "Deliver quickly",
            "items": [
                {
                    "product_id": str(product.id),
                    "quantity": 5.5,
                    "unit": "KG"
                }
            ]
        },
    )
    assert order_response.status_code == 200
    order_data = order_response.json()
    assert "id" in order_data
    assert order_data["customer_id"] == str(customer.id)
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["product_id"] == str(product.id)
