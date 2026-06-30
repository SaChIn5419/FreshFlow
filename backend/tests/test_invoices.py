from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.core import security
from datetime import timedelta
from decimal import Decimal


def test_generate_and_download_invoice(client: TestClient, db: Session) -> None:
    user = User(
        email="admin_invoice@example.com",
        password_hash=security.get_password_hash("password"),
        role="ADMIN",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    customer = Customer(user_id=user.id, restaurant_name="Invoice Test")
    db.add(customer)
    db.commit()
    db.refresh(customer)

    product = Product(name="Tomato", unit="Kg", default_price=Decimal("50.00"))
    db.add(product)
    db.commit()
    db.refresh(product)

    order = Order(customer_id=customer.id)
    db.add(order)
    db.commit()
    db.refresh(order)

    order_item = OrderItem(
        order_id=order.id, product_id=product.id, quantity=Decimal("10.5"), unit="Kg"
    )
    db.add(order_item)
    db.commit()

    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))

    # Generate Invoice
    response = client.post(
        f"/invoices/generate/{order.id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["order_id"] == order.id
    invoice_id = data["id"]

    # Download Invoice
    download_response = client.get(
        f"/invoices/{invoice_id}/download", headers={"Authorization": f"Bearer {token}"}
    )
    assert download_response.status_code == 200
    assert download_response.headers["content-type"] == "application/pdf"

    # Check 501 Not Implemented on send
    send_response = client.post(
        f"/invoices/{invoice_id}/send", headers={"Authorization": f"Bearer {token}"}
    )
    assert send_response.status_code == 501
