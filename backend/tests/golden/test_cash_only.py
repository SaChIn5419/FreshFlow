import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.user import User
from app.core.security import get_password_hash

@pytest.fixture
def cash_only_dataset(db: Session):
    u1 = User(email="cash_only_c1@example.com", password_hash=get_password_hash("password"), role="CUSTOMER")
    db.add(u1)
    db.commit()

    c1 = Customer(user_id=u1.id, restaurant_name="Cash Only Rest 1", is_active=True, credit_limit=Decimal("0"))
    db.add(c1)
    db.commit()

    p1 = Product(name="Cash Tomato", unit="KG", category="Veg", default_price=50.0, is_active=True)
    db.add(p1)
    db.commit()

    base_date = datetime.utcnow() - timedelta(days=2)
    
    # Order: 20 KG @ 50 = 1000
    o1 = Order(customer_id=c1.id, payment_status="Paid", created_at=base_date)
    db.add(o1)
    db.commit()
    db.add(OrderItem(order_id=o1.id, product_id=p1.id, quantity=Decimal("20.0"), unit="KG"))
    
    inv1 = Invoice(
        order_id=o1.id, customer_id=c1.id, invoice_number="CASH-001", 
        subtotal=Decimal("1000.0"), gst=Decimal("0"), grand_total=Decimal("1000.0"), 
        balance_due=Decimal("0.0"), paid_amount=Decimal("1000.0"), payment_status="Paid"
    )
    db.add(inv1)
    db.commit()

    cp1 = Payment(customer_id=c1.id, invoice_id=inv1.id, amount=Decimal("1000.0"), method="CASH")
    db.add(cp1)
    db.commit()

    return {
        "c_ids": [c1.id]
    }


def test_cash_only_reconciliation(db: Session, cash_only_dataset):
    ds = cash_only_dataset
    c_ids = ds["c_ids"]

    # 1. Total Revenue Check
    total_revenue_db = db.query(func.sum(Invoice.grand_total)).filter(Invoice.customer_id.in_(c_ids)).scalar() or Decimal("0")
    assert total_revenue_db == Decimal("1000.0"), f"Revenue mismatch: expected 1000, got {total_revenue_db}"

    # 2. Receivables Reconciliation
    total_payments = db.query(func.sum(Payment.amount)).filter(Payment.customer_id.in_(c_ids)).scalar() or Decimal("0")
    assert total_payments == Decimal("1000.0"), "Total customer payments mismatch"

    calculated_receivables = total_revenue_db - total_payments
    sum_balance_due = db.query(func.sum(Invoice.balance_due)).filter(Invoice.customer_id.in_(c_ids)).scalar() or Decimal("0")
    
    # Asserting receivables = 0
    assert calculated_receivables == sum_balance_due == Decimal("0.0"), "Receivables should be exactly 0 in cash only scenario!"
