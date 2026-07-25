import sys
import os
import pandas as pd
import math

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.database.session import SessionLocal
from app.models.product import Product
from app.models.customer import Customer
from app.models.customer_product_template import CustomerProductTemplate

def run():
    db = SessionLocal()
    file_path = "../EVO Elevated Price Quotation.xlsx"
    df = pd.read_excel(file_path)
    
    # We have 3 column groups:
    # Group 1: Items=Unnamed: 2, Unit=Unnamed: 3, Rate=Unnamed: 4
    # Group 2: Items=Unnamed: 6, Unit=Unnamed: 7, Rate=Unnamed: 8
    # Group 3: Items=Unnamed: 10, Unit=Unnamed: 11, Rate=Unnamed: 12
    
    groups = [
        ("Unnamed: 2", "Unnamed: 3", "Unnamed: 4"),
        ("Unnamed: 6", "Unnamed: 7", "Unnamed: 8"),
        ("Unnamed: 10", "Unnamed: 11", "Unnamed: 12"),
    ]
    
    new_products = []
    
    for items_col, unit_col, rate_col in groups:
        for idx, row in df.iterrows():
            if idx < 7: # skip headers
                continue
                
            item_name = row.get(items_col)
            unit = row.get(unit_col)
            rate = row.get(rate_col)
            
            if pd.isna(item_name) or str(item_name).strip() == "" or str(item_name).strip().lower() == "items":
                continue
                
            item_name = str(item_name).strip()
            unit = str(unit).strip().lower() if not pd.isna(unit) else "kg"
            if unit == "nan": unit = "kg"
            
            # Map unit to allowed units in our system: kg, bunch, pc, pkt, etc
            if "pac" in unit or "box" in unit:
                unit = "pkt"
            
            try:
                rate_val = float(rate) if not pd.isna(rate) else 0.0
            except ValueError:
                rate_val = 0.0
                
            # Check if product exists
            existing = db.query(Product).filter(Product.name.ilike(item_name)).first()
            if not existing:
                p = Product(
                    name=item_name,
                    category="Vegetables",
                    unit=unit,
                    default_price=rate_val,
                    is_active=True
                )
                db.add(p)
                db.commit()
                db.refresh(p)
                print(f"Added {item_name} ({unit})")
    
    print("Assigning all products to all customers...")
    all_products = db.query(Product).all()
    customers = db.query(Customer).all()
    
    for c in customers:
        existing_template_ids = {t.product_id for t in db.query(CustomerProductTemplate).filter(CustomerProductTemplate.customer_id == c.id).all()}
        
        for idx, p in enumerate(all_products):
            if p.id not in existing_template_ids:
                new_t = CustomerProductTemplate(
                    customer_id=c.id,
                    product_id=p.id,
                    sort_order=len(existing_template_ids) + idx
                )
                db.add(new_t)
        db.commit()
        
    print("Done!")

if __name__ == "__main__":
    run()
