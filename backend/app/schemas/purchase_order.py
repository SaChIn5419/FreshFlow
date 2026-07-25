import uuid
from typing import Optional, List
from decimal import Decimal
from datetime import date, datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.product import Product
from app.schemas.supplier import Supplier


class PurchaseOrderItemBase(BaseModel):
    product_id: uuid.UUID
    quantity_ordered: Decimal
    unit: str
    cost_price_at_time: Decimal


class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass


class PurchaseOrderItemUpdate(BaseModel):
    quantity_received: Optional[Decimal] = None
    is_received: Optional[bool] = None


class PurchaseOrderItem(PurchaseOrderItemBase):
    id: uuid.UUID
    purchase_order_id: uuid.UUID
    quantity_received: Decimal
    is_received: bool
    product: Optional[Product] = None

    model_config = ConfigDict(from_attributes=True)


class PurchaseOrderBase(BaseModel):
    supplier_id: uuid.UUID
    status: str
    expected_delivery: Optional[date] = None
    whatsapp_message_text: Optional[str] = None
    total_cost: Decimal
    paid_amount: Decimal = Decimal("0.00")
    balance_due: Decimal = Decimal("0.00")
    payment_status: str = "Unpaid"


class PurchaseOrderCreate(BaseModel):
    supplier_id: uuid.UUID
    triggered_by_order_id: uuid.UUID
    expected_delivery: Optional[date] = None


class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None
    expected_delivery: Optional[date] = None
    whatsapp_message_text: Optional[str] = None
    total_cost: Optional[Decimal] = None


class PurchaseOrder(PurchaseOrderBase):
    id: uuid.UUID
    triggered_by_order_id: uuid.UUID
    items: List[PurchaseOrderItem] = []
    supplier: Optional[Supplier] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WhatsAppTextResponse(BaseModel):
    whatsapp_text: str
