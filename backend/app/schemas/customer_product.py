import uuid
from pydantic import BaseModel, ConfigDict
from app.schemas.product import Product

class CustomerProductBase(BaseModel):
    product_id: uuid.UUID
    display_order: int = 0
    favorite: bool = False

class CustomerProductCreate(CustomerProductBase):
    pass

class CustomerProductInDBBase(CustomerProductBase):
    id: uuid.UUID
    customer_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)

class CustomerProduct(CustomerProductInDBBase):
    product: Product
