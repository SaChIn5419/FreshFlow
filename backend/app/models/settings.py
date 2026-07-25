from sqlalchemy import String, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from app.database.base_class import Base


class Settings(Base):
    __tablename__ = "settings"

    # V1 only — the minimum needed to render an invoice
    company_name: Mapped[str] = mapped_column(String, nullable=False, default="FreshFlow")
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    gstin: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Invoice numbering — kept because InvoiceService uses it
    invoice_prefix: Mapped[str] = mapped_column(String, nullable=False, default="FF")
    invoice_counter: Mapped[int] = mapped_column(Integer, default=1)
    currency: Mapped[str] = mapped_column(String, default="INR")

    # Bank Details
    bank_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    account_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    ifsc_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    upi_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
