from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.core import security
from datetime import timedelta
import io


def test_create_order(client: TestClient, db: Session) -> None:
    # Setup user, customer, and product
    user = User(
        email="customer_order@example.com",
        password_hash=security.get_password_hash("password"),
        role="CUSTOMER",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    customer = Customer(user_id=user.id, restaurant_name="Order Test")
    db.add(customer)
    db.commit()
    db.refresh(customer)

    product = Product(name="Tomato", unit="Kg", default_price=50.0)
    db.add(product)
    db.commit()
    db.refresh(product)

    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))

    response = client.post(
        "/orders/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "customer_id": customer.id,
            "remarks": "Please deliver early",
            "items": [{"product_id": product.id, "quantity": 10.5, "unit": "Kg"}],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["customer_id"] == customer.id
    assert len(data["items"]) == 1
    assert float(data["items"][0]["quantity"]) == 10.5


def test_upload_order_file(client: TestClient, db: Session) -> None:
    # Needs to be admin for simplicity of finding an existing order
    user = User(
        email="admin_order_upload@example.com",
        password_hash=security.get_password_hash("password"),
        role="ADMIN",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    customer = Customer(user_id=user.id, restaurant_name="Upload Test")
    db.add(customer)
    db.commit()
    db.refresh(customer)

    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))

    order_response = client.post(
        "/orders/",
        headers={"Authorization": f"Bearer {token}"},
        json={"customer_id": customer.id},
    )
    order_id = order_response.json()["id"]

    file_content = b"fake pdf content"
    files = {"file": ("test_order.pdf", io.BytesIO(file_content), "application/pdf")}

    response = client.post(
        f"/orders/{order_id}/upload",
        headers={"Authorization": f"Bearer {token}"},
        files=files,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test_order.pdf"
