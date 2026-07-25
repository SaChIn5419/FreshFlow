import uuid
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.models.order import OrderStatus, PaymentStatus

class OrderItemBase(BaseModel):
    product_id: uuid.UUID
    quantity: Decimal

class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: Decimal
    unit: str

from app.schemas.customer import Customer
from app.schemas.product import Product

class OrderItem(OrderItemBase):
    id: uuid.UUID
    order_id: uuid.UUID
    unit: str
    unit_price: Optional[Decimal] = None
    product: Product | None = None
    model_config = ConfigDict(from_attributes=True)

class OrderBase(BaseModel):
    customer_id: uuid.UUID
    remarks: Optional[str] = None
    status: str = OrderStatus.SUBMITTED.value
    payment_status: str = PaymentStatus.PENDING.value

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "customer_id": "123e4567-e89b-12d3-a456-426614174000",
                "remarks": "Please deliver before 10 AM",
                "items": [
                    {
                        "product_id": "123e4567-e89b-12d3-a456-426614174001",
                        "quantity": "5.5"
                    }
                ]
            }
        }
    )

class OrderUpdate(OrderBase):
    pass

from datetime import datetime

class OrderInDBBase(OrderBase):
    id: uuid.UUID
    items: List[OrderItem] = []
    customer: Customer | None = None
    created_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)

class Order(OrderInDBBase):
    pass
