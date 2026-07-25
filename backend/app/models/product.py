from sqlalchemy import String, Numeric, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from decimal import Decimal
from app.database.base_class import Base


class Product(Base):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    unit: Mapped[str] = mapped_column(String, nullable=False)
    default_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    stock_quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    reorder_level: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
