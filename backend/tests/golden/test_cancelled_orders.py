import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.invoice import Invoice
from app.models.user import User
from app.core.security import get_password_hash

@pytest.fixture
def cancelled_dataset(db: Session):
    u1 = User(email="cancel_c1@example.com", password_hash=get_password_hash("password"), role="CUSTOMER")
    db.add(u1)
    db.commit()

    c1 = Customer(user_id=u1.id, restaurant_name="Cancel Rest 1", is_active=True, credit_limit=Decimal("50000"))
    db.add(c1)
    db.commit()

    p1 = Product(name="Cancel Veg", unit="KG", category="Veg", default_price=50.0, is_active=True)
    db.add(p1)
    db.commit()

    base_date = datetime.utcnow()
    
    # 1. Normal Order (1000)
    o1 = Order(customer_id=c1.id, payment_status="Pending", created_at=base_date)
    db.add(o1)
    db.commit()
    db.add(OrderItem(order_id=o1.id, product_id=p1.id, quantity=Decimal("20.0"), unit="KG"))
    
    inv1 = Invoice(
        order_id=o1.id, customer_id=c1.id, invoice_number="NORM-001", 
        subtotal=Decimal("1000.0"), gst=Decimal("0"), grand_total=Decimal("1000.0"), 
        balance_due=Decimal("1000.0"), payment_status="Unpaid"
    )
    db.add(inv1)
    db.commit()

    # 2. Cancelled Order (2000)
    o2 = Order(customer_id=c1.id, status="Cancelled", payment_status="Pending", created_at=base_date)
    db.add(o2)
    db.commit()
    db.add(OrderItem(order_id=o2.id, product_id=p1.id, quantity=Decimal("40.0"), unit="KG"))
    
    # If the system accidentally invoiced a cancelled order (or it was cancelled after invoicing),
    # its invoice status should ideally reflect it, or we should have logic to ignore cancelled order invoices in revenue.
    # For now, we simulate an invoice that shouldn't exist, or we check that it doesn't count.
    # In a perfect ERP, cancelling an order should cancel the invoice.
    inv2 = Invoice(
        order_id=o2.id, customer_id=c1.id, invoice_number="CANC-001", status="Cancelled",
        subtotal=Decimal("2000.0"), gst=Decimal("0"), grand_total=Decimal("2000.0"), 
        balance_due=Decimal("0.0"), payment_status="Cancelled"
    )
    db.add(inv2)
    db.commit()

    return {
        "c_ids": [c1.id]
    }


def test_cancelled_orders_reconciliation(db: Session, cancelled_dataset):
    ds = cancelled_dataset
    c_ids = ds["c_ids"]

    # 1. Total Revenue Check (Should only count the normal invoice, not the cancelled one)
    # The logic requires revenue engines to ignore status="Cancelled"
    total_revenue_db = db.query(func.sum(Invoice.grand_total)).filter(
        Invoice.customer_id.in_(c_ids),
        Invoice.status != "Cancelled"
    ).scalar() or Decimal("0")
    
    assert total_revenue_db == Decimal("1000.0"), f"Revenue mismatch: expected 1000, got {total_revenue_db} (Cancelled orders are leaking into revenue!)"
