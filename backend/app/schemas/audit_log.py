from pydantic import BaseModel, UUID4, ConfigDict
from typing import Optional
from datetime import datetime


class AuditLogBase(BaseModel):
    action: str
    entity_type: str
    entity_id: str
    details: Optional[str] = None


class AuditLogCreate(AuditLogBase):
    user_id: str


class AuditLogResponse(AuditLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime

