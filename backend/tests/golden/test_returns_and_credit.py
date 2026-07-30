import pytest
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.user import User
from app.core.security import get_password_hash

# TODO: Import CreditNote model once implemented
# from app.models.credit_note import CreditNote 

@pytest.mark.xfail(reason="CreditNote and Returns schema not yet implemented", strict=True)
def test_returns_and_credit_note_reconciliation(db: Session):
    u1 = User(email="returns_c1@example.com", password_hash=get_password_hash("password"), role="CUSTOMER")
    db.add(u1)
    db.commit()

    c1 = Customer(user_id=u1.id, restaurant_name="Returns Rest", is_active=True, credit_limit=Decimal("50000"))
    db.add(c1)
    db.commit()

    inv1 = Invoice(
        customer_id=c1.id, invoice_number="RET-001", 
        subtotal=Decimal("1000.0"), gst=Decimal("0"), grand_total=Decimal("1000.0"), 
        balance_due=Decimal("1000.0"), payment_status="Unpaid"
    )
    db.add(inv1)
    db.commit()

    # TDD: Simulating a return of 300
    # credit = CreditNote(customer_id=c1.id, invoice_id=inv1.id, amount=Decimal("300.0"))
    # db.add(credit)
    # db.commit()

    # The expected result is that Revenue should be 700 (1000 invoice - 300 return)
    total_revenue_db = db.query(func.sum(Invoice.grand_total)).filter(Invoice.customer_id == c1.id).scalar() or Decimal("0")
    # total_credits_db = db.query(func.sum(CreditNote.amount)).filter(CreditNote.customer_id == c1.id).scalar() or Decimal("0")
    total_credits_db = Decimal("0")

    net_revenue = total_revenue_db - total_credits_db
    
    # Asserting that the net revenue equals 700
    # This will fail because we haven't implemented the logic or schema to handle returns yet!
    assert net_revenue == Decimal("700.0"), f"Expected 700 net revenue after returns, got {net_revenue}"
