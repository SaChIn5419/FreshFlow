import uuid
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional

class PaymentBase(BaseModel):
    amount: Decimal
    payment_date: datetime
    method: str
    notes: Optional[str] = None

class PaymentCreate(PaymentBase):
    customer_id: uuid.UUID

class PaymentOut(PaymentBase):
    id: uuid.UUID
    customer_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class LedgerEntry(BaseModel):
    date: datetime
    description: str
    reference_id: Optional[uuid.UUID] = None
    type: str # 'INVOICE' or 'PAYMENT'
    debit: Decimal = Decimal('0.00')
    credit: Decimal = Decimal('0.00')
    balance: Decimal = Decimal('0.00')

class LedgerResponse(BaseModel):
    customer_id: uuid.UUID
    entries: list[LedgerEntry]
    current_balance: Decimal
