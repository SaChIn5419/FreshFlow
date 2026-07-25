import os
import sys

# Ensure backend directory is in path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.models.user import User
from app.models.settings import Settings
from app.models.customer import Customer
from app.models.product import Product
from app.models.customer_product_template import CustomerProductTemplate
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    
    # 1. Admin User
    admin = db.query(User).filter(User.email == "admin@freshflow.local").first()
    if not admin:
        admin = User(
            email="admin@freshflow.local",
            password_hash=get_password_hash("admin123"),
            role="ADMIN"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("Created admin user.")
    else:
        print("Admin user already exists.")

    # 2. Settings
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings(
            company_name="FreshFlow",
            address="",
            phone="",
            email="",
            gstin="",
            invoice_prefix="FF",
            invoice_counter=1000,
            currency="INR",
            bank_name="",
            account_number="",
            ifsc_code="",
            upi_id=""
        )
        db.add(settings)
        db.commit()
        print("Created business settings.")
    else:
        print("Settings already exist.")

    # 3. Chef User
    chef = db.query(User).filter(User.email == "chef@demo.com").first()
    if not chef:
        chef = User(
            email="chef@demo.com",
            password_hash=get_password_hash("chef123"),
            role="CUSTOMER"
        )
        db.add(chef)
        db.commit()
        db.refresh(chef)
        print("Created chef user.")
    else:
        print("Chef user already exists.")

    # 4. Demo Restaurant
    customer = db.query(Customer).filter(Customer.restaurant_name == "Demo Restaurant").first()
    if not customer:
        customer = Customer(
            user_id=chef.id,  # Tie to the chef user
            restaurant_name="Demo Restaurant",
            gst_number="29ABCDE1234F2Z5",
            phone="9988776655",
            address="456 High Street, Bangalore",
            credit_days=15
        )
        db.add(customer)
        db.commit()
        print("Created demo restaurant.")
    else:
        print("Demo restaurant already exists.")

    # 4. Products (20 examples)
    products_data = [
        ("Tomato", "Vegetables", "KG", 40.00),
        ("Onion", "Vegetables", "KG", 35.00),
        ("Potato", "Vegetables", "KG", 25.00),
        ("Carrot", "Vegetables", "KG", 60.00),
        ("Broccoli", "Exotic", "KG", 150.00),
        ("Basil", "Herbs", "Bunch", 20.00),
        ("Parsley", "Herbs", "Bunch", 25.00),
        ("Garlic", "Vegetables", "KG", 120.00),
        ("Ginger", "Vegetables", "KG", 90.00),
        ("Coriander", "Herbs", "Bunch", 15.00),
        ("Mint", "Herbs", "Bunch", 10.00),
        ("Capsicum Green", "Vegetables", "KG", 50.00),
        ("Capsicum Red", "Exotic", "KG", 180.00),
        ("Capsicum Yellow", "Exotic", "KG", 180.00),
        ("Mushroom Button", "Exotic", "Packet", 45.00),
        ("Spinach", "Leafy", "Bunch", 20.00),
        ("Cabbage", "Vegetables", "KG", 30.00),
        ("Cauliflower", "Vegetables", "Piece", 40.00),
        ("Green Chilli", "Vegetables", "KG", 60.00),
        ("Lemon", "Vegetables", "Piece", 5.00),
    ]

    existing_count = db.query(Product).count()
    if existing_count < 20:
        for p in products_data:
            existing = db.query(Product).filter(Product.name == p[0]).first()
            if not existing:
                db.add(Product(name=p[0], category=p[1], unit=p[2], default_price=p[3]))
        db.commit()
        print(f"Seeded {len(products_data)} products.")
    else:
        print("Products already seeded.")

    db.close()
    print("Seed complete.")

if __name__ == "__main__":
    seed_db()
