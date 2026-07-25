import uuid
from typing import List, Optional
from decimal import Decimal
from sqlalchemy import String, Numeric, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base_class import Base


class PackingList(Base):
    __tablename__ = "packing_lists"

    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String, default="Pending", nullable=False)
    packed_by: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    order = relationship("Order")
    items = relationship("PackingListItem", back_populates="packing_list", cascade="all, delete-orphan")


class PackingListItem(Base):
    __tablename__ = "packing_items"

    packing_list_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("packing_lists.id"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"), nullable=False)
    quantity_requested: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity_packed: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False)
    is_packed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    packing_list = relationship("PackingList", back_populates="items")
    product = relationship("Product")
