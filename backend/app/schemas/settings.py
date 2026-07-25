import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict


class SettingsBase(BaseModel):
    company_name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    logo_url: Optional[str] = None
    invoice_prefix: str = "FF"
    invoice_counter: int = 1
    currency: str = "INR"
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None


class SettingsUpdate(BaseModel):
    """Partial update — all fields optional."""
    company_name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    logo_url: Optional[str] = None
    invoice_prefix: Optional[str] = None
    currency: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    upi_id: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "company_name": "FreshFlow Wholesale",
                "address": "12 Market Yard, Bengaluru - 560002",
                "gstin": "29AAACF1234A1Z5",
                "logo_url": None
            }
        }
    )


class Settings(SettingsBase):
    id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
