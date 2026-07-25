import uuid
from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base_class import Base


class CustomerProductTemplate(Base):
    __tablename__ = "customer_product_templates"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    customer = relationship("Customer", back_populates="product_templates")
    product = relationship("Product")

    @property
    def product_name(self) -> str:
        return self.product.name if self.product else ""

    @property
    def product_unit(self) -> str:
        return self.product.unit if self.product else ""
