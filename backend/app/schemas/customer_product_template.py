import uuid
from pydantic import BaseModel, ConfigDict


class TemplateAssign(BaseModel):
    product_id: uuid.UUID
    sort_order: int = 0

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "product_id": "123e4567-e89b-12d3-a456-426614174001",
                "sort_order": 1,
            }
        }
    )


class TemplateItem(BaseModel):
    product_id: uuid.UUID
    sort_order: int
    product_name: str | None = None
    product_unit: str | None = None

    model_config = ConfigDict(from_attributes=True)
