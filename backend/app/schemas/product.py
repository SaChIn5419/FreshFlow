from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class ProductBase(BaseModel):
    name: str
    category: Optional[str] = None
    unit: str
    default_price: Optional[Decimal] = None
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    name: Optional[str] = None
    unit: Optional[str] = None


class ProductResponse(ProductBase):
    id: int

    class Config:
        from_attributes = True
