import os
import sys
import uuid
from datetime import datetime
import pandas as pd
from sqlalchemy import text

# Ensure backend directory is in path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.models.user import User
from app.models.customer import Customer
from app.models.order import Order
from app.models.invoice import Invoice, InvoiceItem
from app.core.security import get_password_hash

def import_legacy_sales():
    db = SessionLocal()
    
    file_path = "../Sale_Report_01-01-2026_to_30-06-2026.xls"
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
        
    print(f"Reading legacy sales report from {file_path}...")
    df = pd.read_excel(file_path, skiprows=3)
    
    # Drop rows that don't have a valid Date or Party Name
    df = df.dropna(subset=["Date", "Party Name"])
    
    print(f"Found {len(df)} sales records to import.")
    
    # 1. Ensure all Customers and Users exist
    unique_parties = df["Party Name"].unique()
    party_to_customer_id = {}
    
    # Fetch existing customers
    existing_customers = db.query(Customer).all()
    for c in existing_customers:
        party_to_customer_id[c.restaurant_name] = c.id
        
    # Get standard password hash for dummy users
    pwd_hash = get_password_hash("password123")
    
    print("Checking customer records...")
    for party in unique_parties:
        if party in party_to_customer_id:
            continue
            
        print(f"Creating new customer record for: {party}")
        # Create a dummy user first
        slug = "".join(c for c in party.lower() if c.isalnum())[:20]
        email = f"{slug}@freshflow.local"
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                password_hash=pwd_hash,
                role="CUSTOMER"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        # Create customer
        customer = Customer(
            user_id=user.id,
            restaurant_name=party,
            is_active=True
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        
        party_to_customer_id[party] = customer.id

    # 2. Import Orders & Invoices
    print("\nImporting invoices...")
    success_count = 0
    skip_count = 0
    
    for idx, row in df.iterrows():
        date_val = row["Date"]
        party_name = row["Party Name"]
        invoice_no = str(row["Invoice No."]).split(".")[0].strip() # convert to string, remove decimals
        total_amount = float(str(row["Total Amount"]).replace(",", ""))
        balance_amount = float(str(row["Balance Amount"]).replace(",", "")) if not pd.isna(row["Balance Amount"]) else 0.0
        
        # Parse date
        if isinstance(date_val, datetime):
            parsed_date = date_val
        else:
            try:
                parsed_date = datetime.strptime(str(date_val).strip(), "%d/%m/%Y")
            except ValueError:
                try:
                    parsed_date = datetime.strptime(str(date_val).strip(), "%Y-%m-%d %H:%M:%S")
                except ValueError as e:
                    print(f"Row {idx}: Failed to parse date '{date_val}': {e}")
                    continue
                    
        # Check if invoice already exists
        existing_invoice = db.query(Invoice).filter(Invoice.invoice_number == invoice_no).first()
        if existing_invoice:
            skip_count += 1
            continue
            
        customer_id = party_to_customer_id[party_name]
        
        # Create Order
        order_status = "DELIVERED"
        payment_status = "PAID" if balance_amount == 0.0 else "PENDING"
        
        order = Order(
            customer_id=customer_id,
            status=order_status,
            payment_status=payment_status,
            remarks="Legacy imported sale",
            created_at=parsed_date,
            updated_at=parsed_date
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        
        # Create Invoice
        invoice = Invoice(
            invoice_number=invoice_no,
            order_id=order.id,
            customer_id=customer_id,
            subtotal=total_amount,
            gst=0.0,
            grand_total=total_amount,
            status="Paid" if balance_amount == 0.0 else "Generated"
        )
        # Set created_at explicitly (SQLAlchemy interceptor might set it to now, so we override or set it manually)
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        
        # Override the created_at using raw SQL to bypass SQLAlchemy automatic default on creation if necessary
        db.execute(
            text("UPDATE invoices SET created_at = :dt WHERE id = :id"),
            {"dt": parsed_date.strftime("%Y-%m-%d %H:%M:%S.%f"), "id": str(invoice.id).replace("-", "")}
        )
        db.commit()
        
        # Create InvoiceItem (Mock)
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            product_name="Legacy Vegetables Sales",
            quantity=1.0,
            unit="Order",
            unit_price=total_amount,
            gst=0.0,
            total=total_amount
        )
        db.add(invoice_item)
        db.commit()
        
        success_count += 1
        if success_count % 100 == 0:
            print(f"  Imported {success_count} invoices...")
            
    print(f"\nLegacy Sales Import Completed!")
    print(f"Successfully imported: {success_count} records")
    print(f"Skipped (already exists): {skip_count} records")
    db.close()

if __name__ == "__main__":
    import_legacy_sales()
