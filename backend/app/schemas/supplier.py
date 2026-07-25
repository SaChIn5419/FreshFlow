import uuid
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.schemas.product import Product


class SupplierBase(BaseModel):
    name: str
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    credit_days: int = 0
    average_lead_time: int = 0
    notes: Optional[str] = None


class SupplierCreate(SupplierBase):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Leaf Supplier Ltd",
                "phone": "+919876543210",
                "whatsapp_number": "+919876543210",
                "email": "leaf@supplier.com",
                "address": "123 Market St, City",
                "credit_days": 15,
                "average_lead_time": 1,
                "notes": "Primary green leaf supplier"
            }
        }
    )


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    whatsapp_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    credit_days: Optional[int] = None
    average_lead_time: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    current_balance: Optional[Decimal] = None


class ProductSupplierBase(BaseModel):
    product_id: uuid.UUID
    cost_price: Decimal
    is_primary_supplier: bool = False
    notes: Optional[str] = None


class ProductSupplierCreate(ProductSupplierBase):
    pass


class ProductSupplier(ProductSupplierBase):
    id: uuid.UUID
    supplier_id: uuid.UUID
    product: Optional[Product] = None

    model_config = ConfigDict(from_attributes=True)


class Supplier(SupplierBase):
    id: uuid.UUID
    current_balance: Decimal
    is_active: bool
    products: List[ProductSupplier] = []

    model_config = ConfigDict(from_attributes=True)
