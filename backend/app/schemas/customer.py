from pydantic import BaseModel
from typing import Optional


class CustomerBase(BaseModel):
    user_id: int
    restaurant_name: str
    gst_number: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    credit_days: int = 0


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    restaurant_name: Optional[str] = None
    gst_number: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    credit_days: Optional[int] = None


class CustomerResponse(CustomerBase):
    id: int

    class Config:
        from_attributes = True
