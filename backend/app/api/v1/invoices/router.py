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

@router.get("/", response_model=List[Invoice])
def read_invoices(
    svc: InvoiceService = Depends(get_invoice_service),
    current_user = Depends(deps.get_current_active_user)
):
    return svc.get_all_invoices()

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
