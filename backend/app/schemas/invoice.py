from pydantic import BaseModel
from typing import List
from datetime import datetime
from decimal import Decimal


class InvoiceItemBase(BaseModel):
    product_name: str
    quantity: Decimal
    unit_price: Decimal
    gst: Decimal
    total: Decimal


class InvoiceItemResponse(InvoiceItemBase):
    id: int
    invoice_id: int

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    invoice_number: str
    order_id: int
    customer_id: int
    subtotal: Decimal
    gst: Decimal
    grand_total: Decimal
    status: str


class InvoiceResponse(InvoiceBase):
    id: int
    created_at: datetime
    items: List[InvoiceItemResponse] = []

    class Config:
        from_attributes = True
