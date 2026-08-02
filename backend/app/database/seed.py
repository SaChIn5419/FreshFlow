import uuid
import datetime
import os
import openpyxl
import pandas as pd
from decimal import Decimal
from sqlalchemy.orm import Session

from app.database.session import engine, SessionLocal
from app.database.base_class import Base
import app.models
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.invoice import Invoice
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.settings import Settings
from app.models.supplier import Supplier, ProductSupplier
from app.core.security import get_password_hash


def parse_evo_quotation():
    """Parses produce catalog from EVO Elevated Price Quotation.xlsx"""
    file_path = "EVO Elevated Price Quotation.xlsx"
    if not os.path.exists(file_path):
        file_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "EVO Elevated Price Quotation.xlsx")

    products_dict = {}
    if os.path.exists(file_path):
        wb = openpyxl.load_workbook(file_path, data_only=True)
        sheet = wb["Sheet1"]
        for row in sheet.iter_rows(values_only=True):
            for offset in [0, 4, 8]:
                if len(row) >= offset + 4:
                    s_no, name, unit, rate = row[offset:offset+4]
                    if name and not str(name).startswith("OPAL") and not str(name).startswith("EXOTIC Fresh") and not str(name).startswith("*") and not str(name).startswith("NAGARBHAVI") and not str(name).startswith("Phone") and not str(name).startswith("Sl.") and not str(name).startswith("TOTAL") and not str(name).startswith("THANK") and not str(name).startswith("Payment") and not str(name).startswith("EXOTIC") and not str(name).startswith("OTHER") and not str(name).startswith("INDIAN"):
                        name_str = str(name).strip().title()
                        unit_str = str(unit).strip().upper() if unit else "KG"
                        if unit_str in ["PAC", "PACKET"]:
                            unit_str = "Packet"
                        elif unit_str == "BOX":
                            unit_str = "Box"
                        elif unit_str in ["PC", "PIECE"]:
                            unit_str = "Piece"
                        else:
                            unit_str = "KG"

                        rate_val = 100.0
                        try:
                            if rate is not None and str(rate).strip() not in ["MR", "RB", "NAN", "None", ""]:
                                rate_val = float(rate)
                        except Exception:
                            pass

                        cat = "Vegetables"
                        name_upper = name_str.upper()
                        if any(k in name_upper for k in ["LETTUCE", "SPINACH", "LEAF", "ARAGULA", "KALE", "CABBAGE", "CHARDS", "PALAK"]):
                            cat = "Leafy"
                        elif any(k in name_upper for k in ["MUSHROOM", "ZUCCHINI", "EXOTIC", "BROCCOLI", "ASPRAGUS", "ARTICHOKE", "BERRY", "SPROUTS", "BABYCORN"]):
                            cat = "Exotic"
                        elif any(k in name_upper for k in ["BASIL", "CHIVES", "OREGANO", "PARSLEY", "ROSEMARY", "SAGE", "THYME", "LEMONGRASS", "HERB", "MINT", "CORIANDER"]):
                            cat = "Herbs"
                        elif any(k in name_upper for k in ["APPLE", "BANANA", "MANGO", "GRAPES", "ORANGE", "AVACADO", "PINEAPPLE", "MELON", "PAPAYA", "FRUIT", "GUAVA", "PEARS", "PLUM", "FIG", "CHERRY", "STRAWBERRY", "POMEGRANATE"]):
                            cat = "Fruits"

                        if name_str not in products_dict:
                            products_dict[name_str] = {"category": cat, "unit": unit_str, "price": rate_val}

    return products_dict


def parse_sales_report():
    """Parses 757 historical sales transactions from Sale_Report_01-01-2026_to_30-06-2026.xls"""
    file_path = "Sale_Report_01-01-2026_to_30-06-2026.xls"
    if not os.path.exists(file_path):
        file_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "Sale_Report_01-01-2026_to_30-06-2026.xls")

    if not os.path.exists(file_path):
        return []

    df_sales = pd.read_excel(file_path, skiprows=3)
    df_sales_clean = df_sales.dropna(subset=["Party Name", "Total Amount"])
    
    invoices = []
    for _, row in df_sales_clean.iterrows():
        try:
            raw_date = str(row["Date"]).strip()
            date_obj = datetime.datetime.strptime(raw_date, "%d/%m/%Y").replace(tzinfo=datetime.timezone.utc)
        except Exception:
            date_obj = datetime.datetime.now(datetime.timezone.utc)

        party = str(row["Party Name"]).strip()
        inv_num_raw = str(row["Invoice No."]).replace(".0", "").strip()
        inv_number = f"INV-{inv_num_raw.zfill(4)}" if inv_num_raw.isdigit() else f"INV-{inv_num_raw}"

        total_amt = Decimal(str(round(float(row["Total Amount"]), 2)))
        recv_amt = Decimal(str(round(float(row["Received Amount"]) if pd.notna(row["Received Amount"]) else 0.0, 2)))
        bal_amt = Decimal(str(round(float(row["Balance Amount"]) if pd.notna(row["Balance Amount"]) else float(total_amt), 2)))
        pay_status = "Paid" if bal_amt <= 0 else ("Partially Paid" if recv_amt > 0 else "Unpaid")

        invoices.append({
            "date": date_obj,
            "party": party,
            "invoice_number": inv_number,
            "total_amount": total_amt,
            "received_amount": recv_amt,
            "balance_due": bal_amt,
            "payment_status": pay_status
        })

    return invoices


def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. System Admin User
    for admin_email in ["admin@freshflow.local", "admin@freshflow.com"]:
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                password_hash=get_password_hash("admin123"),
                role="ADMIN"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        else:
            admin.password_hash = get_password_hash("admin123")
            db.commit()

    # 2. System Settings
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings(
            company_name="FreshFlow Wholesale Produce",
            address="45 Market Yard, Bangalore",
            phone="+919876543200",
            email="support@freshflow.local",
            gstin="29AAACF1234F1Z0",
            invoice_prefix="INV-",
            invoice_counter=1000,
            currency="INR",
            bank_name="HDFC Bank",
            account_number="50200012345678",
            ifsc_code="HDFC0001234",
            upi_id="freshflow@hdfc"
        )
        db.add(settings)
        db.commit()

    # 3. Seed Products from EVO Elevated Price Quotation Excel
    evo_products = parse_evo_quotation()
    created_products = []
    for name, meta in evo_products.items():
        prod = db.query(Product).filter(Product.name == name).first()
        if not prod:
            prod = Product(
                name=name,
                category=meta["category"],
                unit=meta["unit"],
                default_price=Decimal(str(meta["price"])),
                stock_quantity=Decimal("1000.0"),
                reorder_level=Decimal("20.0"),
                is_active=True
            )
            db.add(prod)
            db.commit()
            db.refresh(prod)
        else:
            prod.default_price = Decimal(str(meta["price"]))
            prod.unit = meta["unit"]
            prod.category = meta["category"]
            db.commit()
        created_products.append(prod)
    print(f"Seeded {len(created_products)} produce items from EVO Excel catalog.")

    # 4. Suppliers
    suppliers_data = [
        {"name": "Leafy & Herbs Mandi", "phone": "+919876543201", "whatsapp_number": "+919876543201", "email": "herbs@mandi.com", "credit_days": 7, "average_lead_time": 1, "notes": "Supplies fresh spinach, cilantro, basil & mint"},
        {"name": "Exotic Greenhouse Produce", "phone": "+919876543202", "whatsapp_number": "+919876543202", "email": "exotics@greenhouse.com", "credit_days": 15, "average_lead_time": 2, "notes": "Supplies zucchini, mushrooms, bell peppers"},
        {"name": "Global Vegetable Staples", "phone": "+919876543203", "whatsapp_number": "+919876543203", "email": "staples@global.com", "credit_days": 30, "average_lead_time": 1, "notes": "Supplies onion, potato, tomato, garlic"},
    ]
    created_suppliers = []
    for s in suppliers_data:
        sup = db.query(Supplier).filter(Supplier.name == s["name"]).first()
        if not sup:
            sup = Supplier(
                name=s["name"],
                phone=s["phone"],
                whatsapp_number=s["whatsapp_number"],
                email=s["email"],
                credit_days=s["credit_days"],
                average_lead_time=s["average_lead_time"],
                notes=s["notes"]
            )
            db.add(sup)
            db.commit()
            db.refresh(sup)
        created_suppliers.append(sup)

    # 5. Product Suppliers Mapping
    leaf_sup, exotic_sup, staple_sup = created_suppliers[0], created_suppliers[1], created_suppliers[2]
    for prod in created_products:
        link = db.query(ProductSupplier).filter(ProductSupplier.product_id == prod.id).first()
        if not link:
            if prod.category in ["Leafy", "Herbs"]:
                sup = leaf_sup
                margin = Decimal("0.70")
            elif prod.category in ["Exotic", "Fruits"]:
                sup = exotic_sup
                margin = Decimal("0.80")
            else:
                sup = staple_sup
                margin = Decimal("0.75")

            cost = round(prod.default_price * margin, 2)
            link = ProductSupplier(
                product_id=prod.id,
                supplier_id=sup.id,
                cost_price=cost,
                is_primary_supplier=True
            )
            db.add(link)
    db.commit()

    # 6. Seed Customers & 757 Invoices from Sales Report Excel
    sales_invoices = parse_sales_report()
    if sales_invoices:
        customer_map = {}
        unique_parties = list(set(inv["party"] for inv in sales_invoices))

        for idx, party_name in enumerate(sorted(unique_parties)):
            cust = db.query(Customer).filter(Customer.restaurant_name == party_name).first()
            if not cust:
                clean_slug = party_name.lower().replace(" ", "").replace("&", "").replace("(", "").replace(")", "").replace(".", "")[:15]
                email = f"chef.{clean_slug}@freshflow.com"
                user = db.query(User).filter(User.email == email).first()
                if not user:
                    user = User(
                        email=email,
                        password_hash=get_password_hash("chef123"),
                        role="CUSTOMER"
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)

                cust = Customer(
                    user_id=user.id,
                    restaurant_name=party_name,
                    gst_number=f"29AAACB{str(idx).zfill(4)}F1Z5",
                    phone=f"+91980000{str(idx).zfill(4)}",
                    address=f"Premises #{100+idx}, Koramangala / Indiranagar, Bangalore",
                    credit_days=30
                )
                db.add(cust)
                db.commit()
                db.refresh(cust)

            customer_map[party_name] = cust

        print(f"Seeded {len(customer_map)} unique customer restaurant accounts.")

        # Seed Invoices and Orders
        seeded_invoices_count = 0
        default_prod = created_products[0] if created_products else None

        for inv_data in sales_invoices:
            existing_inv = db.query(Invoice).filter(Invoice.invoice_number == inv_data["invoice_number"]).first()
            if not existing_inv:
                cust = customer_map.get(inv_data["party"])
                if not cust:
                    continue

                order = Order(
                    customer_id=cust.id,
                    status="Completed",
                    created_at=inv_data["date"]
                )
                db.add(order)
                db.commit()
                db.refresh(order)

                # OrderItem line item
                if default_prod:
                    db.add(OrderItem(
                        order_id=order.id,
                        product_id=default_prod.id,
                        quantity=Decimal("1.0"),
                        unit=default_prod.unit,
                        unit_price=inv_data["total_amount"]
                    ))
                    db.commit()

                inv = Invoice(
                    order_id=order.id,
                    customer_id=cust.id,
                    invoice_number=inv_data["invoice_number"],
                    subtotal=inv_data["total_amount"],
                    gst=Decimal("0.00"),
                    grand_total=inv_data["total_amount"],
                    paid_amount=inv_data["received_amount"],
                    balance_due=inv_data["balance_due"],
                    status="Generated",
                    payment_status=inv_data["payment_status"],
                    created_at=inv_data["date"]
                )
                db.add(inv)
                db.commit()
                seeded_invoices_count += 1

        print(f"Seeded {seeded_invoices_count} historical sales invoices from Excel report.")

    db.close()
    print("Full Excel dataset seed complete.")


if __name__ == "__main__":
    seed_db()
