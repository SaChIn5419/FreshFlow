import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from app.repositories import InvoiceRepository, OrderRepository, CustomerRepository, SettingsRepository
from app.models.invoice import Invoice, InvoiceItem
from app.schemas.invoice import InvoiceCreate
from app.core.exceptions import (
    OrderNotFound, OrderEmpty, CustomerNotFound, 
    InvoiceAlreadyGenerated, InvoiceNumberExists, CompanySettingsMissing
)
from app.services.audit_service import AuditService

class InvoiceService:
    def __init__(
        self, 
        invoice_repo: InvoiceRepository, 
        order_repo: OrderRepository,
        customer_repo: CustomerRepository,
        settings_repo: SettingsRepository
    ):
        self.invoice_repo = invoice_repo
        self.order_repo = order_repo
        self.customer_repo = customer_repo
        self.settings_repo = settings_repo

    def get_invoice(self, id: uuid.UUID) -> Invoice | None:
        return self.invoice_repo.get_by_id(id)

    def get_all_invoices(self) -> List[Invoice]:
        return self.invoice_repo.get_all()

    def create_invoice(self, data: InvoiceCreate, user_id: str) -> Invoice:
        # Validations
        order = self.order_repo.get_by_id(data.order_id)
        if not order:
            raise OrderNotFound()
        
        if not order.items:
            raise OrderEmpty()
            
        settings = self.settings_repo.get_settings()
        if not settings:
            raise CompanySettingsMissing()
            
        # Check if invoice already exists for this order
        existing_invoices = self.invoice_repo.get_all() # simplify for demo, should be by order_id
        for inv in existing_invoices:
            if inv.order_id == data.order_id:
                raise InvoiceAlreadyGenerated()

        # Build invoice items and calculate totals
        subtotal = 0
        invoice_items = []
        for item_data in data.items:
            # Find the corresponding order item to get product name
            order_item = next((oi for oi in order.items if oi.id == item_data.order_item_id), None)
            if not order_item:
                raise ValueError(f"Order item {item_data.order_item_id} not found in order {order.id}")
            
            total = item_data.quantity * item_data.unit_price
            subtotal += total
            
            invoice_items.append(InvoiceItem(
                product_name=order_item.product.name if order_item.product else "Unknown Product",
                quantity=item_data.quantity,
                unit=order_item.unit,
                unit_price=item_data.unit_price,
                gst=0, # Simplified for v1
                total=total
            ))

        invoice_number = f"{settings.invoice_prefix}{settings.invoice_counter:04d}"

        invoice_created_at = data.created_at if data.created_at else datetime.now()

        invoice = Invoice(
            invoice_number=invoice_number,
            order_id=data.order_id,
            customer_id=order.customer_id,
            subtotal=subtotal,
            gst=0,
            grand_total=subtotal,
            status="Generated",
            created_at=invoice_created_at
        )
        invoice.items = invoice_items
        
        try:
            # Save all changes atomically
            self.invoice_repo.db.add(invoice)
            
            # Update order status
            order.status = "Invoice Generated"
            
            # Increment counter
            settings.invoice_counter += 1
            
            self.invoice_repo.db.commit()
            self.invoice_repo.db.refresh(invoice)
            
            AuditService.log_action(
                db=self.invoice_repo.db,
                user_id=user_id,
                action="GENERATED_INVOICE",
                entity_type="INVOICE",
                entity_id=str(invoice.id),
                details=f"Generated Invoice {invoice.invoice_number} for ₹{invoice.grand_total}"
            )
            
            return invoice
        except Exception as e:
            self.invoice_repo.db.rollback()
            raise e

    def record_payment(
        self, 
        id: uuid.UUID, 
        amount_received: Optional[Decimal] = None, 
        paid_amount: Optional[Decimal] = None, 
        payment_status: Optional[str] = None, 
        user_id: str = ""
    ) -> Invoice:
        invoice = self.invoice_repo.get_by_id(id)
        if not invoice:
            raise InvoiceNotFound()
        
        if payment_status and payment_status.strip().upper() == "PAID":
            invoice.paid_amount = invoice.grand_total
            invoice.balance_due = Decimal("0.00")
            invoice.payment_status = "Paid"
        elif payment_status and payment_status.strip().upper() == "UNPAID":
            invoice.paid_amount = Decimal("0.00")
            invoice.balance_due = invoice.grand_total
            invoice.payment_status = "Unpaid"
        else:
            if amount_received is not None:
                current = invoice.paid_amount or Decimal("0.00")
                invoice.paid_amount = current + amount_received
            elif paid_amount is not None:
                invoice.paid_amount = paid_amount

            # Bound paid_amount between 0 and grand_total
            if invoice.paid_amount > invoice.grand_total:
                invoice.paid_amount = invoice.grand_total
            elif invoice.paid_amount < Decimal("0.00"):
                invoice.paid_amount = Decimal("0.00")

            invoice.balance_due = invoice.grand_total - invoice.paid_amount

            if invoice.balance_due == Decimal("0.00"):
                invoice.payment_status = "Paid"
            elif invoice.paid_amount > Decimal("0.00"):
                invoice.payment_status = "Partial"
            else:
                invoice.payment_status = "Unpaid"

        self.invoice_repo.db.commit()
        self.invoice_repo.db.refresh(invoice)

        AuditService.log_action(
            db=self.invoice_repo.db,
            user_id=user_id,
            action="RECORDED_INVOICE_PAYMENT",
            entity_type="INVOICE",
            entity_id=str(invoice.id),
            details=f"Updated Invoice {invoice.invoice_number} payment: Paid=₹{invoice.paid_amount}, Balance=₹{invoice.balance_due}, Status={invoice.payment_status}"
        )

        return invoice
