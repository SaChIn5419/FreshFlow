import uuid
from decimal import Decimal
from sqlalchemy import String, ForeignKey, Integer, Boolean, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database.base_class import Base
from typing import Optional


class Customer(Base):
    __tablename__ = "customers"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    restaurant_name: Mapped[str] = mapped_column(String, nullable=False)
    contact_person: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    gst_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    credit_days: Mapped[int] = mapped_column(Integer, default=0)
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    user = relationship("User")
    product_templates = relationship("CustomerProductTemplate", back_populates="customer", cascade="all, delete-orphan")
