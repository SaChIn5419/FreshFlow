import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.database.base_class import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # e.g., 'CREATED', 'UPDATED'
    entity_type = Column(String(100), nullable=False)  # e.g., 'INVOICE', 'PRODUCT'
    entity_id = Column(String(36), nullable=False)
    details = Column(Text, nullable=True)  # Markdown or JSON summary of changes
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
