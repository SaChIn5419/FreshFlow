import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.supplier_payment import SupplierPayment
from app.services.finance_service import FinanceService
from app.models.user import User
from app.core.security import get_password_hash

@pytest.fixture
def golden_dataset(db: Session):
    # 0. Create Users
    u1 = User(email="golden_c1@example.com", password_hash=get_password_hash("password"), role="CUSTOMER")
    u2 = User(email="golden_c2@example.com", password_hash=get_password_hash("password"), role="CUSTOMER")
    db.add_all([u1, u2])
    db.commit()

    # 1. Create Base Entities
    c1 = Customer(user_id=u1.id, restaurant_name="Golden Rest 1", is_active=True, credit_limit=Decimal("50000"))
    c2 = Customer(user_id=u2.id, restaurant_name="Golden Rest 2", is_active=True, credit_limit=Decimal("100000"))
    s1 = Supplier(name="Golden Supplier 1", is_active=True)
    db.add_all([c1, c2, s1])
    db.commit()

    p1 = Product(name="Golden Tomato", unit="KG", category="Veg", default_price=50.0, is_active=True)
    p2 = Product(name="Golden Potato", unit="KG", category="Veg", default_price=30.0, is_active=True)
    db.add_all([p1, p2])
    db.commit()

    base_date = datetime.utcnow() - timedelta(days=30)
    
    # 2. Customer Orders and Invoices (Creating Revenue and Receivables)
    # Creating Orders first since Purchase Orders require a triggered_by_order_id
    o1 = Order(customer_id=c1.id, payment_status="Pending", created_at=base_date)
    db.add(o1)
    db.commit()
    db.add_all([
        OrderItem(order_id=o1.id, product_id=p1.id, quantity=Decimal("50.0"), unit="KG"),
        OrderItem(order_id=o1.id, product_id=p2.id, quantity=Decimal("50.0"), unit="KG")
    ])
    inv1 = Invoice(order_id=o1.id, customer_id=c1.id, invoice_number="GOLD-001", subtotal=Decimal("4000.0"), gst=Decimal("0"), grand_total=Decimal("4000.0"), balance_due=Decimal("4000.0"), payment_status="Unpaid")
    db.add(inv1)
    db.commit()

    o2 = Order(customer_id=c2.id, payment_status="Pending", created_at=base_date + timedelta(days=1))
    db.add(o2)
    db.commit()
    db.add(OrderItem(order_id=o2.id, product_id=p1.id, quantity=Decimal("30.0"), unit="KG"))
    inv2 = Invoice(order_id=o2.id, customer_id=c2.id, invoice_number="GOLD-002", subtotal=Decimal("1500.0"), gst=Decimal("0"), grand_total=Decimal("1500.0"), balance_due=Decimal("1500.0"), payment_status="Unpaid")
    db.add(inv2)
    db.commit()

    # 3. Supplier Purchase Orders (creating COGS and Payables)
    po1 = PurchaseOrder(supplier_id=s1.id, triggered_by_order_id=o1.id, total_cost=Decimal("4000.0"), balance_due=Decimal("4000.0"), payment_status="Unpaid", status="Completed")
    db.add(po1)
    db.commit()
    po1_item = PurchaseOrderItem(purchase_order_id=po1.id, product_id=p1.id, quantity_ordered=Decimal("100.0"), unit="KG", cost_price_at_time=Decimal("40.0"))
    db.add(po1_item)

    po2 = PurchaseOrder(supplier_id=s1.id, triggered_by_order_id=o2.id, total_cost=Decimal("2000.0"), balance_due=Decimal("2000.0"), payment_status="Unpaid", status="Completed")
    db.add(po2)
    db.commit()
    po2_item = PurchaseOrderItem(purchase_order_id=po2.id, product_id=p2.id, quantity_ordered=Decimal("100.0"), unit="KG", cost_price_at_time=Decimal("20.0"))
    db.add(po2_item)
    db.commit()

    # 4. Payments
    cp1 = Payment(customer_id=c1.id, invoice_id=inv1.id, amount=Decimal("3000.0"), method="TRANSFER")
    inv1.balance_due -= Decimal("3000.0")
    inv1.paid_amount = Decimal("3000.0")
    inv1.payment_status = "Partial"
    db.add(cp1)
    
    cp2 = Payment(customer_id=c2.id, invoice_id=inv2.id, amount=Decimal("1500.0"), method="TRANSFER")
    inv2.balance_due -= Decimal("1500.0")
    inv2.paid_amount = Decimal("1500.0")
    inv2.payment_status = "Paid"
    db.add(cp2)

    sp1 = SupplierPayment(supplier_id=s1.id, purchase_order_id=po1.id, amount=Decimal("2000.0"), method="TRANSFER")
    po1.balance_due -= Decimal("2000.0")
    po1.paid_amount = (po1.paid_amount or Decimal("0")) + Decimal("2000.0")
    po1.payment_status = "Partial"
    db.add(sp1)
    db.commit()

    return {
        "c_ids": [c1.id, c2.id],
        "s_ids": [s1.id],
        "po_ids": [po1.id, po2.id]
    }


def test_golden_dataset_financial_reconciliation(db: Session, golden_dataset):
    ds = golden_dataset
    c_ids = ds["c_ids"]
    s_ids = ds["s_ids"]
    po_ids = ds["po_ids"]

    finance_service = FinanceService(db)

    # 1. Total Revenue Check
    total_revenue_db = db.query(func.sum(Invoice.grand_total)).filter(Invoice.customer_id.in_(c_ids)).scalar() or Decimal("0")
    assert total_revenue_db == Decimal("5500.0"), f"Revenue mismatch: expected 5500, got {total_revenue_db}"

    # 2. Receivables Reconciliation
    total_payments = db.query(func.sum(Payment.amount)).filter(Payment.customer_id.in_(c_ids)).scalar() or Decimal("0")
    assert total_payments == Decimal("4500.0"), "Total customer payments mismatch"

    calculated_receivables = total_revenue_db - total_payments
    sum_balance_due = db.query(func.sum(Invoice.balance_due)).filter(Invoice.customer_id.in_(c_ids)).scalar() or Decimal("0")
    assert calculated_receivables == sum_balance_due == Decimal("1000.0"), "Receivables reconciliation failed!"

    # 3. Payables Reconciliation
    total_po_amount = db.query(func.sum(PurchaseOrder.total_cost)).filter(PurchaseOrder.supplier_id.in_(s_ids)).scalar() or Decimal("0")
    assert total_po_amount == Decimal("6000.0"), "Total PO amount mismatch"

    total_supplier_payments = db.query(func.sum(SupplierPayment.amount)).filter(SupplierPayment.supplier_id.in_(s_ids)).scalar() or Decimal("0")
    assert total_supplier_payments == Decimal("2000.0"), "Total supplier payments mismatch"

    calculated_payables = total_po_amount - total_supplier_payments
    sum_po_balance_due = db.query(func.sum(PurchaseOrder.balance_due)).filter(PurchaseOrder.supplier_id.in_(s_ids)).scalar() or Decimal("0")
    assert calculated_payables == sum_po_balance_due == Decimal("4000.0"), "Payables reconciliation failed!"

    # 5. Ledger Integrity
    negative_invoices = db.query(Invoice).filter(Invoice.customer_id.in_(c_ids), Invoice.balance_due < 0).count()
    negative_pos = db.query(PurchaseOrder).filter(PurchaseOrder.supplier_id.in_(s_ids), PurchaseOrder.balance_due < 0).count()
    assert negative_invoices == 0, "Ledger integrity violated: found negative invoice balances"
    assert negative_pos == 0, "Ledger integrity violated: found negative PO balances"

    unpaid_zero_balance_invoices = db.query(Invoice).filter(Invoice.customer_id.in_(c_ids), Invoice.balance_due == 0, Invoice.payment_status != 'Paid').count()
    assert unpaid_zero_balance_invoices == 0, "Ledger integrity violated: fully paid invoice has incorrect status"
