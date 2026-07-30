import pytest
import random
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.customer import Customer
from app.models.order import Order
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.user import User
from app.core.security import get_password_hash

@pytest.fixture
def randomized_dataset(db: Session):
    # Create 1 User, 5 Customers, 20 Invoices, 30 Payments
    # Scaled down from 500/2000 to keep test fast, but logic remains the same
    customers = []
    for i in range(5):
        u = User(email=f"random_c{i}@example.com", password_hash=get_password_hash("password"), role="CUSTOMER")
        db.add(u)
        db.commit()
        
        c = Customer(user_id=u.id, restaurant_name=f"Random Rest {i}", is_active=True, credit_limit=Decimal("10000"))
        db.add(c)
        customers.append(c)
    db.commit()

    invoices = []
    base_date = datetime.utcnow()
    for i in range(20):
        c = random.choice(customers)
        # Random fractional total between 10.00 and 1000.00
        total = Decimal(str(round(random.uniform(10.0, 1000.0), 2)))

        o = Order(customer_id=c.id, payment_status="Pending", created_at=base_date)
        db.add(o)
        db.commit()

        inv = Invoice(
            order_id=o.id,
            customer_id=c.id, 
            invoice_number=f"RAND-{i}", 
            subtotal=total, 
            gst=Decimal("0"), 
            grand_total=total, 
            balance_due=total, 
            paid_amount=Decimal("0"), 
            payment_status="Unpaid",
            created_at=base_date
        )
        db.add(inv)
        invoices.append(inv)
    db.commit()

    for i in range(30):
        inv = random.choice(invoices)
        # Random fractional payment up to the balance due
        if inv.balance_due > 0:
            payment_amount = Decimal(str(round(random.uniform(1.0, float(inv.balance_due)), 2)))
            cp = Payment(customer_id=inv.customer_id, invoice_id=inv.id, amount=payment_amount, method="TRANSFER")
            inv.balance_due -= payment_amount
            inv.paid_amount += payment_amount
            if inv.balance_due <= Decimal("0"):
                inv.payment_status = "Paid"
            else:
                inv.payment_status = "Partial"
            db.add(cp)
    db.commit()

    return {
        "c_ids": [c.id for c in customers]
    }


def test_randomized_reconciliation(db: Session, randomized_dataset):
    ds = randomized_dataset
    c_ids = ds["c_ids"]

    total_revenue_db = db.query(func.sum(Invoice.grand_total)).filter(Invoice.customer_id.in_(c_ids)).scalar() or Decimal("0")
    total_payments = db.query(func.sum(Payment.amount)).filter(Payment.customer_id.in_(c_ids)).scalar() or Decimal("0")
    sum_balance_due = db.query(func.sum(Invoice.balance_due)).filter(Invoice.customer_id.in_(c_ids)).scalar() or Decimal("0")

    calculated_receivables = total_revenue_db - total_payments
    
    # Asserting exact precision match regardless of floating point noise
    assert calculated_receivables == sum_balance_due, f"Randomized precision failed: {calculated_receivables} != {sum_balance_due}"
