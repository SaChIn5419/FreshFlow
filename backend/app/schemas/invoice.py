import uuid
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class InvoiceItemBase(BaseModel):
    product_name: str
    quantity: Decimal
    unit: str
    unit_price: Decimal
    gst: Decimal
    total: Decimal

class InvoiceItemCreate(BaseModel):
    order_item_id: uuid.UUID
    quantity: Decimal
    unit_price: Decimal

class InvoiceItem(InvoiceItemBase):
    id: uuid.UUID
    invoice_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class InvoiceBase(BaseModel):
    order_id: uuid.UUID
    customer_id: uuid.UUID
    subtotal: Decimal
    gst: Decimal
    grand_total: Decimal
    status: str = "Generated"
    due_date: Optional[datetime] = None
    paid_amount: Decimal = Decimal("0.00")
    balance_due: Decimal = Decimal("0.00")
    payment_status: str = "Unpaid"

class InvoiceCreate(BaseModel):
    order_id: uuid.UUID
    items: List[InvoiceItemCreate]
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "order_id": "123e4567-e89b-12d3-a456-426614174000",
                "items": [
                    {
                        "order_item_id": "123e4567-e89b-12d3-a456-426614174002",
                        "quantity": "5.5",
                        "unit_price": "50.00"
                    }
                ]
            }
        }
    )

class InvoiceInDBBase(InvoiceBase):
    id: uuid.UUID
    invoice_number: str
    items: List[InvoiceItem] = []
    created_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)

class Invoice(InvoiceInDBBase):
    pass
