import uuid
from typing import List
from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.invoice import Invoice, InvoiceCreate
from app.services import InvoiceService
from app.services.settings_service import SettingsService
from app.services.template_service import render_invoice, render_to_pdf
from app.repositories import InvoiceRepository, OrderRepository, CustomerRepository, SettingsRepository
from app.core.exceptions import InvoiceNotFound

router = APIRouter()

def get_invoice_service(db: Session = Depends(deps.get_db)) -> InvoiceService:
    invoice_repo = InvoiceRepository(db)
    order_repo = OrderRepository(db)
    customer_repo = CustomerRepository(db)
    settings_repo = SettingsRepository(db)
    return InvoiceService(invoice_repo, order_repo, customer_repo, settings_repo)

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.schemas.pagination import PaginatedResponse

import csv
from io import StringIO
from fastapi.responses import HTMLResponse, Response, StreamingResponse

@router.get("/export/csv")
def export_invoices_csv(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    svc = InvoiceService(InvoiceRepository(db), OrderRepository(db), CustomerRepository(db), SettingsRepository(db))
    items, _ = svc.invoice_repo.get_all(skip=0, limit=10000)

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Invoice Number", "Order ID", "Customer Name", "Subtotal", "GST", "Grand Total", "Paid Amount", "Balance Due", "Payment Status", "Created At"])

    for inv in items:
        customer_name = inv.customer.restaurant_name if inv.customer else "Unknown"
        writer.writerow([
            inv.invoice_number,
            str(inv.order_id),
            customer_name,
            f"{float(inv.subtotal or 0):.2f}",
            f"{float(inv.gst or 0):.2f}",
            f"{float(inv.grand_total or 0):.2f}",
            f"{float(inv.paid_amount or 0):.2f}",
            f"{float(inv.balance_due or 0):.2f}",
            inv.payment_status or "Unpaid",
            inv.created_at.isoformat() if inv.created_at else ""
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="invoices_receivables_export.csv"'}
    )

@router.get("/", response_model=PaginatedResponse[Invoice])
def read_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    svc: InvoiceService = Depends(get_invoice_service),
    current_user = Depends(deps.get_current_active_user)
):
    return svc.get_all_invoices(skip=skip, limit=limit, search=search)

@router.post("/", response_model=Invoice)
def create_invoice(
    data: InvoiceCreate,
    svc: InvoiceService = Depends(get_invoice_service),
    current_user = Depends(deps.get_current_active_admin)
):
    return svc.create_invoice(data, str(current_user.id))

@router.get("/{id}", response_model=Invoice)
def read_invoice(
    id: uuid.UUID,
    svc: InvoiceService = Depends(get_invoice_service),
    current_user = Depends(deps.get_current_active_user)
):
    invoice = svc.get_invoice(id)
    if not invoice:
        raise InvoiceNotFound()
    return invoice


@router.get("/{id}/preview", response_class=HTMLResponse)
def preview_invoice(
    id: uuid.UUID,
    svc: InvoiceService = Depends(get_invoice_service),
    current_user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    """Returns the invoice as rendered HTML for browser preview."""
    invoice = svc.get_invoice(id)
    if not invoice:
        raise InvoiceNotFound()
    customer_repo = CustomerRepository(db)
    customer = customer_repo.get_by_id(invoice.customer_id)
    settings = SettingsService(SettingsRepository(db)).get_settings()
    html = render_invoice(invoice, customer, settings)
    return HTMLResponse(content=html)


@router.get("/{id}/pdf")
def download_invoice_pdf(
    id: uuid.UUID,
    svc: InvoiceService = Depends(get_invoice_service),
    current_user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    """Returns the invoice as a downloadable PDF."""
    invoice = svc.get_invoice(id)
    if not invoice:
        raise InvoiceNotFound()
    customer_repo = CustomerRepository(db)
    customer = customer_repo.get_by_id(invoice.customer_id)
    settings = SettingsService(SettingsRepository(db)).get_settings()
    html = render_invoice(invoice, customer, settings)
    pdf_bytes = render_to_pdf(html)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{invoice.invoice_number}.pdf"'},
    )


from decimal import Decimal

@router.patch("/{id}/payment-status", response_model=Invoice)
def update_invoice_payment_status(
    id: uuid.UUID,
    payment_status: str | None = None,
    paid_amount: Decimal | None = None,
    amount_received: Decimal | None = None,
    svc: InvoiceService = Depends(get_invoice_service),
    current_user = Depends(deps.get_current_active_user)
):
    """Updates invoice payment status or records typed payment amount (e.g. 50k out of 1.5L)."""
    return svc.record_payment(
        id=id,
        amount_received=amount_received,
        paid_amount=paid_amount,
        payment_status=payment_status,
        user_id=str(current_user.id)
    )

