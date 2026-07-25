import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.order import Order, OrderCreate
from pydantic import BaseModel
class PriceUpdate(BaseModel):
    price: float
from app.schemas.purchase_order import PurchaseOrder as PurchaseOrderSchema
from app.services import OrderService, PurchaseOrderService
from app.services.settings_service import SettingsService
from app.services.template_service import render_packing_slip, render_to_pdf
from app.repositories import OrderRepository, ProductRepository, CustomerRepository, SettingsRepository
from app.core.exceptions import OrderNotFound
from app.api.v1.orders.parser_router import router as parser_router

router = APIRouter()
router.include_router(parser_router)

def get_order_service(db: Session = Depends(deps.get_db)) -> OrderService:
    order_repo = OrderRepository(db)
    product_repo = ProductRepository(db)
    return OrderService(order_repo, product_repo)

@router.get("/", response_model=List[Order])
def read_orders(
    svc: OrderService = Depends(get_order_service),
    current_user = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
):
    if current_user.role == "ADMIN":
        return svc.get_all_orders()
    
    # Get the customer associated with this user
    customer_repo = CustomerRepository(db)
    customers = customer_repo.get_all()
    my_customer = next((c for c in customers if c.user_id == current_user.id), None)
    if not my_customer:
        return []
        
    return svc.get_orders_by_customer(my_customer.id)

@router.post("/", response_model=Order)
def create_order(
    data: OrderCreate,
    svc: OrderService = Depends(get_order_service),
    current_user = Depends(deps.get_current_active_user)
):
    return svc.create_order(data, str(current_user.id))

@router.get("/{id}", response_model=Order)
def read_order(
    id: uuid.UUID,
    svc: OrderService = Depends(get_order_service),
    current_user = Depends(deps.get_current_active_user)
):
    order = svc.get_order(id)
    if not order:
        raise OrderNotFound()
    return order


@router.get("/{id}/packing-slip", response_class=HTMLResponse)
def preview_packing_slip(
    id: uuid.UUID,
    svc: OrderService = Depends(get_order_service),
    current_user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    """Returns the packing slip as rendered HTML (no prices)."""
    order = svc.get_order(id)
    if not order:
        raise OrderNotFound()
    customer = CustomerRepository(db).get_by_id(order.customer_id)
    settings = SettingsService(SettingsRepository(db)).get_settings()
    html = render_packing_slip(order, customer, settings)
    return HTMLResponse(content=html)


@router.get("/{id}/packing-slip/pdf")
def download_packing_slip_pdf(
    id: uuid.UUID,
    svc: OrderService = Depends(get_order_service),
    current_user=Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    """Returns the packing slip as a downloadable PDF."""
    order = svc.get_order(id)
    if not order:
        raise OrderNotFound()
    customer = CustomerRepository(db).get_by_id(order.customer_id)
    settings = SettingsService(SettingsRepository(db)).get_settings()
    html = render_packing_slip(order, customer, settings)
    pdf_bytes = render_to_pdf(html)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="packing_slip_{str(id)[:8]}.pdf"'},
    )


@router.post("/{id}/status", response_model=Order)
def update_order_status(
    id: uuid.UUID,
    status: str,
    svc: OrderService = Depends(get_order_service),
    current_user = Depends(deps.get_current_active_user)
):
    order = svc.update_order_status(id, status, str(current_user.id))
    if not order:
        raise OrderNotFound()
    return order


@router.patch("/{id}/items/{item_id}/price", response_model=Order)
def update_item_price(
    id: uuid.UUID,
    item_id: uuid.UUID,
    data: PriceUpdate,
    svc: OrderService = Depends(get_order_service),
    current_user = Depends(deps.get_current_active_user)
):
    try:
        order = svc.update_item_price(id, item_id, data.price, str(current_user.id))
        if not order:
            raise OrderNotFound()
        return order
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{id}/generate-purchase-orders", response_model=List[PurchaseOrderSchema])
def generate_purchase_orders(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_admin)
):
    po_service = PurchaseOrderService(db)
    try:
        return po_service.generate_purchase_orders_for_order(id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
