import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict

class CustomerBase(BaseModel):
    restaurant_name: str
    contact_person: Optional[str] = None
    gst_number: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    credit_days: int = 0
    is_active: bool = True

class CustomerCreate(CustomerBase):
    email: str
    password: str

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "restaurant_name": "Demo Restaurant",
                "contact_person": "John Doe",
                "email": "demo@restaurant.com",
                "password": "password123",
                "gst_number": "29ABCDE1234F2Z5",
                "phone": "9988776655",
                "address": "456 High Street, Bangalore",
                "credit_days": 15,
                "is_active": True
            }
        }
    )

class CustomerUpdate(CustomerBase):
    email: Optional[str] = None
    password: Optional[str] = None

class CustomerInDBBase(CustomerBase):
    id: uuid.UUID
    user_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)

class Customer(CustomerInDBBase):
    pass
