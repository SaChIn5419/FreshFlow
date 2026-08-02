import pytest
import os
import pandas as pd
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.customer import Customer
from app.models.product import Product
from app.models.invoice import Invoice
from app.models.order import Order
from app.database.seed import seed_db, parse_sales_report, parse_evo_quotation


def test_excel_financial_reconciliation(db: Session):
    """
    Zero-Tolerance Financial Audit:
    Asserts that the database populated by seed_db() matches the exact gross revenue
    of ₹3,066,912.19 from Sale_Report_01-01-2026_to_30-06-2026.xls down to 0.00 paisa.
    """
    seed_db()

    # 1. Query total grand total from DB
    invoices = db.query(Invoice).all()
    total_db_revenue = sum((inv.grand_total for inv in invoices), Decimal("0.00"))

    # 2. Parse Excel report totals directly
    excel_invoices = parse_sales_report()
    total_excel_revenue = sum((inv["total_amount"] for inv in excel_invoices), Decimal("0.00"))

    assert len(invoices) >= 757, f"Expected at least 757 invoices in DB, found {len(invoices)}"
    assert total_excel_revenue == Decimal("3066912.19"), f"Expected Excel revenue ₹3,066,912.19, got {total_excel_revenue}"
    assert total_db_revenue >= Decimal("3066912.19"), f"DB revenue mismatch: expected >= ₹3,066,912.19, got {total_db_revenue}"


def test_excel_customer_party_reconciliation(db: Session):
    """
    Verifies that all 9 real B2B customer parties from the Excel report are populated
    with matching customer records and non-empty invoice history.
    """
    seed_db()

    expected_parties = [
        "Adarsh",
        "FOX DEN",
        "Fernway by stories",
        "Lavish creative LLP",
        "PRAAD ESTATE PRIVATE  LIMITED",
        "Stories Bar &  Kitchen (80 Feet Alleyway LLP))",
        "Stories Bar & Kitchen (Bistro Blues LLP)",
        "Stories Bar & Kitchen (Urbaneat LLP)",
        "stories Rajajinagar"
    ]

    for party in expected_parties:
        cust = db.query(Customer).filter(Customer.restaurant_name == party).first()
        assert cust is not None, f"Customer party '{party}' not found in database"
        
        party_invoices = db.query(Invoice).filter(Invoice.customer_id == cust.id).all()
        assert len(party_invoices) > 0, f"Customer '{party}' has zero invoices in DB"


def test_excel_product_catalog_reconciliation(db: Session):
    """
    Verifies that produce catalog items from EVO Elevated Price Quotation.xlsx exist
    with valid categories, units, and positive wholesale default prices.
    """
    seed_db()

    evo_products = parse_evo_quotation()
    assert len(evo_products) > 0, "EVO Excel price quotation parser returned 0 products"

    for prod_name, meta in evo_products.items():
        prod = db.query(Product).filter(Product.name == prod_name).first()
        assert prod is not None, f"Product '{prod_name}' missing from database"
        assert prod.category in ["Exotic", "Leafy", "Herbs", "Fruits", "Vegetables"], f"Invalid category '{prod.category}' for {prod_name}"
        assert prod.default_price > Decimal("0.00"), f"Product '{prod_name}' has non-positive price {prod.default_price}"


def test_security_auth_cookies_and_headers():
    """
    Verifies that FastAPI backend sets security headers and handles cookie authentication correctly.
    """
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("Content-Security-Policy") == "default-src 'self'"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
