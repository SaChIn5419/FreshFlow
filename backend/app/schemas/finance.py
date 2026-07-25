from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal

class CustomerPaymentCreate(BaseModel):
    customer_id: UUID
    invoice_id: Optional[UUID] = None
    amount: Decimal
    method: str
    notes: Optional[str] = None

class CustomerPaymentResponse(BaseModel):
    id: UUID
    customer_id: UUID
    invoice_id: Optional[UUID]
    amount: Decimal
    payment_date: datetime
    method: str
    notes: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class SupplierPaymentCreate(BaseModel):
    supplier_id: UUID
    purchase_order_id: Optional[UUID] = None
    amount: Decimal
    method: str
    notes: Optional[str] = None

class SupplierPaymentResponse(BaseModel):
    id: UUID
    supplier_id: UUID
    purchase_order_id: Optional[UUID]
    amount: Decimal
    payment_date: datetime
    method: str
    notes: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProfitabilityMetrics(BaseModel):
    total_revenue: Decimal
    total_cogs: Decimal
    gross_profit: Decimal
    gross_margin_percent: Decimal
