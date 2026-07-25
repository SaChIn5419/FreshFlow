import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.purchase_order import PurchaseOrder, PurchaseOrderUpdate, PurchaseOrderItem, PurchaseOrderItemUpdate, WhatsAppTextResponse
from app.services.purchase_order_service import PurchaseOrderService

router = APIRouter()

def get_po_service(db: Session = Depends(deps.get_db)) -> PurchaseOrderService:
    return PurchaseOrderService(db)

@router.get("/", response_model=List[PurchaseOrder])
def read_purchase_orders(
    supplier_id: Optional[uuid.UUID] = None,
    order_id: Optional[uuid.UUID] = None,
    svc: PurchaseOrderService = Depends(get_po_service),
    current_user = Depends(deps.get_current_active_user)
):
    if supplier_id:
        return svc.get_purchase_orders_by_supplier(supplier_id)
    if order_id:
        return svc.get_purchase_orders_by_order(order_id)
    return svc.get_all_purchase_orders()

@router.get("/{id}", response_model=PurchaseOrder)
def read_purchase_order(
    id: uuid.UUID,
    svc: PurchaseOrderService = Depends(get_po_service),
    current_user = Depends(deps.get_current_active_user)
):
    po = svc.get_purchase_order(id)
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
    return po

@router.get("/{id}/whatsapp", response_model=WhatsAppTextResponse)
def get_purchase_order_whatsapp_text(
    id: uuid.UUID,
    svc: PurchaseOrderService = Depends(get_po_service),
    current_user = Depends(deps.get_current_active_user)
):
    po = svc.get_purchase_order(id)
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
    return WhatsAppTextResponse(whatsapp_text=po.whatsapp_message_text or "")

@router.patch("/{id}", response_model=PurchaseOrder)
def update_purchase_order(
    id: uuid.UUID,
    data: PurchaseOrderUpdate,
    svc: PurchaseOrderService = Depends(get_po_service),
    current_user = Depends(deps.get_current_active_admin)
):
    po = svc.update_purchase_order(id, data)
    if not po:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase order not found")
    return po

@router.patch("/{id}/items/{item_id}/receive", response_model=PurchaseOrderItem)
def receive_purchase_order_item(
    id: uuid.UUID,
    item_id: uuid.UUID,
    data: PurchaseOrderItemUpdate,
    svc: PurchaseOrderService = Depends(get_po_service),
    current_user = Depends(deps.get_current_active_admin)
):
    item = svc.update_po_item(item_id, data)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item
