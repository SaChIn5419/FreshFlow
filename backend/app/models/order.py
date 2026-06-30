from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database.base_class import Base


class OrderStatus(str, enum.Enum):
    DRAFT = "Draft"
    SUBMITTED = "Submitted"
    REVIEWED = "Reviewed"
    INVOICE_GENERATED = "Invoice Generated"
    PACKED = "Packed"
    DELIVERED = "Delivered"
    COMPLETED = "Completed"


class PaymentStatus(str, enum.Enum):
    PENDING = "Pending"
    PARTIALLY_PAID = "Partially Paid"
    PAID = "Paid"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status = Column(String, default=OrderStatus.SUBMITTED.value)
    payment_status = Column(String, default=PaymentStatus.PENDING.value)
    remarks = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    customer = relationship("Customer")
    items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )
    files = relationship(
        "OrderFile", back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class OrderFile(Base):
    __tablename__ = "order_files"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    filename = Column(String, nullable=False)
    path = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="files")
