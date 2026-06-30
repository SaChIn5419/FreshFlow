from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal


class OrderItemBase(BaseModel):
    product_id: int
    quantity: Decimal
    unit: str


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: int
    order_id: int

    class Config:
        from_attributes = True


class OrderFileResponse(BaseModel):
    id: int
    filename: str
    path: str
    uploaded_at: datetime

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    customer_id: int
    remarks: Optional[str] = None


class OrderCreate(OrderBase):
    items: Optional[List[OrderItemCreate]] = []


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None


class OrderResponse(OrderBase):
    id: int
    status: str
    payment_status: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    files: List[OrderFileResponse] = []

    class Config:
        from_attributes = True
