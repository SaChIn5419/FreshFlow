from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base_class import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    gst = Column(Numeric(10, 2), nullable=False)
    grand_total = Column(Numeric(10, 2), nullable=False)
    status = Column(String, default="Generated")  # Basically immutable generated status
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order")
    customer = relationship("Customer")
    items = relationship(
        "InvoiceItem", back_populates="invoice", cascade="all, delete-orphan"
    )


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    product_name = Column(String, nullable=False)
    quantity = Column(Numeric(10, 2), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    gst = Column(Numeric(10, 2), nullable=False)
    total = Column(Numeric(10, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="items")
