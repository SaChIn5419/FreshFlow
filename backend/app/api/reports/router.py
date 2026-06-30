from typing import Any, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.invoice import Invoice
from app.models.order import Order, PaymentStatus
from app.api import deps

router = APIRouter()


@router.get("/sales", response_model=Dict[str, Any])
def get_sales_report(
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_admin),
) -> Any:
    total_revenue = db.query(func.sum(Invoice.grand_total)).scalar() or 0.0
    total_invoices = db.query(func.count(Invoice.id)).scalar() or 0
    return {"total_revenue": float(total_revenue), "total_invoices": total_invoices}


@router.get("/outstanding", response_model=Dict[str, Any])
def get_outstanding_report(
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_admin),
) -> Any:
    # Get all orders that are not Paid
    outstanding_orders = (
        db.query(Order).filter(Order.payment_status != PaymentStatus.PAID.value).all()
    )

    total_outstanding = 0.0
    for order in outstanding_orders:
        invoice = db.query(Invoice).filter(Invoice.order_id == order.id).first()
        if invoice:
            total_outstanding += float(invoice.grand_total)

    return {
        "total_outstanding": total_outstanding,
        "unpaid_orders_count": len(outstanding_orders),
    }
