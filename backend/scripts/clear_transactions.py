import os
import sys

# Ensure backend directory is in path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.models.order import Order, OrderItem
from app.models.invoice import Invoice, InvoiceItem
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.payment import Payment
from app.models.supplier_payment import SupplierPayment

def clear_db():
    db = SessionLocal()
    
    try:
        # Delete in proper order to respect foreign keys (if applicable)
        db.query(Payment).delete()
        db.query(SupplierPayment).delete()
        db.query(InvoiceItem).delete()
        db.query(Invoice).delete()
        db.query(PurchaseOrderItem).delete()
        db.query(PurchaseOrder).delete()
        db.query(OrderItem).delete()
        db.query(Order).delete()
        
        db.commit()
        print("Successfully cleared all transaction data (Orders, Invoices, Purchase Orders, Payments).")
    except Exception as e:
        db.rollback()
        print(f"Error clearing data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_db()
