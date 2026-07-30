from datetime import timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.settings import Settings
from app.core import security
from app.core.security import get_password_hash

def test_generate_invoice(client: TestClient, db: Session) -> None:
    user = User(
        email="admin_inv@example.com",
        password_hash=get_password_hash("password"),
        role="ADMIN",
    )
    db.add(user)
    
    settings = Settings(company_name="Test Co", invoice_counter=1000)
    db.add(settings)
    db.commit()
    db.refresh(user)

    customer = Customer(user_id=user.id, restaurant_name="Invoice Test Rest")
    db.add(customer)
    db.commit()
    db.refresh(customer)

    product = Product(name="Tomato", unit="KG", category="Veg", default_price=50.0)
    db.add(product)
    db.commit()
    db.refresh(product)

    order = Order(customer_id=customer.id, payment_status="Pending")
    db.add(order)
    db.commit()
    db.refresh(order)

    order_item = OrderItem(order_id=order.id, product_id=product.id, quantity=Decimal("2.0"), unit="KG")
    db.add(order_item)
    db.commit()
    db.refresh(order_item)

    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))

    invoice_response = client.post(
        "/api/v1/invoices/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "order_id": str(order.id),
            "items": [
                {
                    "order_item_id": str(order_item.id),
                    "quantity": 2.0,
                    "unit_price": 50.0
                }
            ]
        },
    )
    assert invoice_response.status_code == 200
    data = invoice_response.json()
    assert "invoice_number" in data
    assert "id" in data

def test_read_invoices(client: TestClient, db: Session) -> None:
    user = db.query(User).filter(User.email == "admin_inv@example.com").first()
    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))

    response = client.get("/api/v1/invoices/", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
