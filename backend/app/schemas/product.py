import uuid
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

class ProductBase(BaseModel):
    name: str
    category: Optional[str] = None
    unit: str
    default_price: Optional[Decimal] = None
    stock_quantity: Optional[Decimal] = Decimal("0.00")
    reorder_level: Optional[Decimal] = Decimal("0.00")

class ProductCreate(ProductBase):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Tomato",
                "category": "Vegetable",
                "unit": "KG",
                "default_price": 50.00,
                "stock_quantity": 50.00,
                "reorder_level": 10.00
            }
        }
    )

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    default_price: Optional[Decimal] = None
    stock_quantity: Optional[Decimal] = None
    reorder_level: Optional[Decimal] = None
    is_active: Optional[bool] = None

class ProductInDBBase(ProductBase):
    id: uuid.UUID
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class Product(ProductInDBBase):
    pass
