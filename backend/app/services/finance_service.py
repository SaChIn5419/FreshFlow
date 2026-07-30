from sqlalchemy.orm import Session
from decimal import Decimal
from uuid import UUID
from datetime import datetime
from typing import Tuple, List
from app.models import Payment, SupplierPayment, Invoice, PurchaseOrder
from app.schemas.finance import CustomerPaymentCreate, SupplierPaymentCreate
from app.repositories.payment_repository import PaymentRepository
from app.repositories.supplier_payment_repository import SupplierPaymentRepository
from app.services.audit_service import AuditService

class FinanceService:
    def __init__(self, db: Session):
        self.db = db
        self.payment_repo = PaymentRepository(db)
        self.supplier_payment_repo = SupplierPaymentRepository(db)

    def get_customer_payments(self, skip: int = 0, limit: int = 100) -> dict:
        items, total = self.payment_repo.get_all(skip=skip, limit=limit)
        return {
            "items": items,
            "total": total,
            "page": (skip // limit) + 1 if limit > 0 else 1,
            "size": limit,
            "pages": (total + limit - 1) // limit if limit > 0 else 1,
        }

    def get_supplier_payments(self, skip: int = 0, limit: int = 100) -> dict:
        items, total = self.supplier_payment_repo.get_all(skip=skip, limit=limit)
        return {
            "items": items,
            "total": total,
            "page": (skip // limit) + 1 if limit > 0 else 1,
            "size": limit,
            "pages": (total + limit - 1) // limit if limit > 0 else 1,
        }

    @staticmethod
    def record_customer_payment(db: Session, payment_in: CustomerPaymentCreate, user_id: str) -> Payment:
        try:
            payment = Payment(
                customer_id=payment_in.customer_id,
                invoice_id=payment_in.invoice_id,
                amount=payment_in.amount,
                method=payment_in.method,
                notes=payment_in.notes
            )
            db.add(payment)
            
            if payment_in.invoice_id:
                invoice = db.query(Invoice).filter(Invoice.id == payment_in.invoice_id).first()
                if invoice:
                    invoice.paid_amount += payment_in.amount
                    invoice.balance_due = invoice.grand_total - invoice.paid_amount
                    
                    if invoice.balance_due <= 0:
                        invoice.payment_status = "Paid"
                    elif invoice.paid_amount > 0:
                        invoice.payment_status = "Partial"
                    else:
                        invoice.payment_status = "Unpaid"

            db.commit()
            db.refresh(payment)
            
            AuditService.log_action(
                db=db,
                user_id=user_id,
                action="RECORDED_PAYMENT",
                entity_type="PAYMENT",
                entity_id=str(payment.id),
                details=f"Recorded customer payment of ₹{payment.amount}"
            )
            return payment
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def record_supplier_payment(db: Session, payment_in: SupplierPaymentCreate, user_id: str) -> SupplierPayment:
        try:
            payment = SupplierPayment(
                supplier_id=payment_in.supplier_id,
                purchase_order_id=payment_in.purchase_order_id,
                amount=payment_in.amount,
                method=payment_in.method,
                notes=payment_in.notes
            )
            db.add(payment)
            
            if payment_in.purchase_order_id:
                po = db.query(PurchaseOrder).filter(PurchaseOrder.id == payment_in.purchase_order_id).first()
                if po:
                    po.paid_amount += payment_in.amount
                    po.balance_due = po.total_cost - po.paid_amount
                    
                    if po.balance_due <= 0:
                        po.payment_status = "Paid"
                    elif po.paid_amount > 0:
                        po.payment_status = "Partial"
                    else:
                        po.payment_status = "Unpaid"

            db.commit()
            db.refresh(payment)
            
            AuditService.log_action(
                db=db,
                user_id=user_id,
                action="RECORDED_PAYMENT",
                entity_type="SUPPLIER_PAYMENT",
                entity_id=str(payment.id),
                details=f"Recorded supplier payment of ₹{payment.amount}"
            )
            return payment
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def get_profitability(db: Session):
        invoices = db.query(Invoice).all()
        pos = db.query(PurchaseOrder).all()

        total_revenue = sum(inv.grand_total for inv in invoices)
        total_cogs = sum(po.total_cost for po in pos)
        gross_profit = total_revenue - total_cogs
        
        if total_revenue > 0:
            gross_margin = (gross_profit / total_revenue) * Decimal("100.0")
        else:
            gross_margin = Decimal("0.0")

        return {
            "total_revenue": total_revenue,
            "total_cogs": total_cogs,
            "gross_profit": gross_profit,
            "gross_margin_percent": gross_margin
        }
