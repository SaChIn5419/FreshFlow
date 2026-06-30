from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
import os

from app.database.session import get_db
from app.models.invoice import Invoice
from app.schemas.invoice import InvoiceResponse
from app.services.invoice_service import create_invoice_from_order, INVOICE_DIR
from app.api import deps

router = APIRouter()


@router.post("/generate/{order_id}", response_model=InvoiceResponse)
def generate_invoice(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_admin),
) -> Any:
    invoice = create_invoice_from_order(db, order_id)
    return invoice


@router.get("/{id}", response_model=InvoiceResponse)
def read_invoice(
    id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if current_user.role != "ADMIN" and invoice.customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return invoice


@router.get("/{id}/download")
def download_invoice(
    id: int,
    db: Session = Depends(get_db),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if current_user.role != "ADMIN" and invoice.customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    file_path = os.path.join(INVOICE_DIR, f"{invoice.invoice_number}.pdf")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Invoice PDF not found")

    return FileResponse(file_path, filename=f"{invoice.invoice_number}.pdf")


@router.post("/{id}/send")
def send_invoice(
    id: int, current_user: Any = Depends(deps.get_current_active_admin)
) -> Any:
    # TODO: Implement email sending in Version 1.1
    raise HTTPException(
        status_code=501, detail="Email sending not implemented yet (v1.1 feature)"
    )
