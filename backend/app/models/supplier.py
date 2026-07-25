import uuid
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import String, Integer, Boolean, Numeric, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database.base_class import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    whatsapp_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    credit_days: Mapped[int] = mapped_column(Integer, default=0)
    average_lead_time: Mapped[int] = mapped_column(Integer, default=0)
    current_balance: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    products: Mapped[List["ProductSupplier"]] = relationship(
        "ProductSupplier", back_populates="supplier", cascade="all, delete-orphan"
    )


class ProductSupplier(Base):
    __tablename__ = "product_suppliers"

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    supplier_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)
    cost_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    is_primary_supplier: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    supplier = relationship("Supplier", back_populates="products")
    product = relationship("Product")
