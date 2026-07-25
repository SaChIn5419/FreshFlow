import uuid
from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.schemas.product import Product


class PackingListItemBase(BaseModel):
    product_id: uuid.UUID
    quantity_requested: Decimal
    quantity_packed: Decimal = Decimal("0.00")
    unit: str
    is_packed: bool = False


class PackingListItemCreate(PackingListItemBase):
    pass


class PackingListItemUpdate(BaseModel):
    quantity_packed: Optional[Decimal] = None
    is_packed: Optional[bool] = None


class PackingListItem(PackingListItemBase):
    id: uuid.UUID
    packing_list_id: uuid.UUID
    product: Optional[Product] = None

    model_config = ConfigDict(from_attributes=True)


class PackingListBase(BaseModel):
    order_id: uuid.UUID
    status: str = "Pending"
    packed_by: Optional[str] = None
    notes: Optional[str] = None


class PackingListCreate(PackingListBase):
    pass


class PackingListUpdate(BaseModel):
    status: Optional[str] = None
    packed_by: Optional[str] = None
    notes: Optional[str] = None


class PackingList(PackingListBase):
    id: uuid.UUID
    items: List[PackingListItem] = []

    model_config = ConfigDict(from_attributes=True)
