import uuid
import enum
from decimal import Decimal
from datetime import date
from typing import Optional, List
from sqlalchemy import String, Numeric, ForeignKey, Boolean, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database.base_class import Base


class PurchaseOrderStatus(str, enum.Enum):
    DRAFT = "Draft"
    SENT = "Sent"
    PARTIALLY_RECEIVED = "Partially Received"
    RECEIVED = "Received"
    CANCELLED = "Cancelled"


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    supplier_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)
    triggered_by_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, default=PurchaseOrderStatus.DRAFT.value)
    expected_delivery: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    whatsapp_message_text: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    balance_due: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    payment_status: Mapped[str] = mapped_column(String, default="Unpaid")

    supplier = relationship("Supplier")
    triggered_by_order = relationship("Order")
    items: Mapped[List["PurchaseOrderItem"]] = relationship(
        "PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan"
    )


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    purchase_order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity_ordered: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False)
    cost_price_at_time: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity_received: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    is_received: Mapped[bool] = mapped_column(Boolean, default=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")
