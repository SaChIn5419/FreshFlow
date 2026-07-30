import uuid
import enum
from decimal import Decimal
from datetime import date
from typing import Optional, List
from sqlalchemy import String, Numeric, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database.base_class import Base


class OrderStatus(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    REVIEWED = "Reviewed"
    PURCHASED = "Purchased"
    PACKED = "Packed"
    DISPATCHED = "Dispatched"
    DELIVERED = "Delivered"
    INVOICE_GENERATED = "Invoice Generated"
    INVOICED = "Invoiced"
    PAID = "Paid"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class PaymentStatus(str, enum.Enum):
    PENDING = "Pending"
    PARTIALLY_PAID = "Partially Paid"
    PAID = "Paid"


class Order(Base):
    __tablename__ = "orders"

    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False, index=True)
    request_id: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    status: Mapped[str] = mapped_column(String, default=OrderStatus.SUBMITTED.value)
    payment_status: Mapped[str] = mapped_column(String, default=PaymentStatus.PENDING.value)
    remarks: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    expected_delivery_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    delivery_notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    internal_notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    customer = relationship("Customer")
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    files: Mapped[List["OrderFile"]] = relationship(
        "OrderFile", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False)
    unit_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class OrderFile(Base):
    __tablename__ = "order_files"

    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    path: Mapped[str] = mapped_column(String, nullable=False)

    order = relationship("Order", back_populates="files")
