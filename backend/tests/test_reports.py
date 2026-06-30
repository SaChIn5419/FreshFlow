from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.customer import Customer
from app.models.order import Order
from app.models.invoice import Invoice
from app.core import security
from datetime import timedelta
from decimal import Decimal


def test_reports(client: TestClient, db: Session) -> None:
    user = User(
        email="admin_reports@example.com",
        password_hash=security.get_password_hash("password"),
        role="ADMIN",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))

    customer = Customer(user_id=user.id, restaurant_name="Reports Test")
    db.add(customer)
    db.commit()

    order = Order(customer_id=customer.id, payment_status="Pending")
    db.add(order)
    db.commit()
    db.refresh(order)

    invoice = Invoice(
        invoice_number="INV-12345",
        order_id=order.id,
        customer_id=customer.id,
        subtotal=Decimal("100.00"),
        gst=Decimal("5.00"),
        grand_total=Decimal("105.00"),
        status="Generated",
    )
    db.add(invoice)
    db.commit()

    sales_response = client.get(
        "/reports/sales", headers={"Authorization": f"Bearer {token}"}
    )
    assert sales_response.status_code == 200
    assert sales_response.json()["total_invoices"] >= 1
    assert sales_response.json()["total_revenue"] >= 105.0

    outstanding_response = client.get(
        "/reports/outstanding", headers={"Authorization": f"Bearer {token}"}
    )
    assert outstanding_response.status_code == 200
    assert outstanding_response.json()["unpaid_orders_count"] >= 1
    assert outstanding_response.json()["total_outstanding"] >= 105.0
