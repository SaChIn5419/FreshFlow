from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.user import User
from app.models.settings import Settings
from app.models.customer import Customer
from app.models.product import Product
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

    # 5. Products (20 examples)
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

    # 6. Suppliers and Product-Supplier mappings
    from app.models.supplier import Supplier, ProductSupplier
    
    suppliers_data = [
        {"name": "Leaf Supplier", "phone": "+919876543201", "whatsapp_number": "+919876543201", "email": "leaf@flow.com", "credit_days": 7, "average_lead_time": 1, "notes": "Supplies all leafy greens and herbs"},
        {"name": "Exotic Veggies Corp", "phone": "+919876543202", "whatsapp_number": "+919876543202", "email": "exotics@corp.com", "credit_days": 15, "average_lead_time": 2, "notes": "Supplies imported and greenhouse exotic vegetables"},
        {"name": "Global Mandi Suppliers", "phone": "+919876543203", "whatsapp_number": "+919876543203", "email": "mandi@global.com", "credit_days": 30, "average_lead_time": 1, "notes": "Supplies local mandi staples like potato, onion, tomato"},
    ]

    for s in suppliers_data:
        existing = db.query(Supplier).filter(Supplier.name == s["name"]).first()
        if not existing:
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
    print("Seeded suppliers.")

    # Link products to suppliers
    leaf_sup = db.query(Supplier).filter(Supplier.name == "Leaf Supplier").first()
    exotic_sup = db.query(Supplier).filter(Supplier.name == "Exotic Veggies Corp").first()
    veggie_sup = db.query(Supplier).filter(Supplier.name == "Global Mandi Suppliers").first()

    all_db_products = db.query(Product).all()
    for prod in all_db_products:
        # Check if already linked
        existing_link = db.query(ProductSupplier).filter(ProductSupplier.product_id == prod.id).first()
        if not existing_link:
            # Categorize
            if prod.category == "Herbs" or prod.category == "Leafy" or prod.name in ["Basil", "Parsley", "Coriander", "Mint", "Spinach"]:
                assigned_sup = leaf_sup
                cost_margin = 0.70 # Herbs have higher margin
            elif prod.category == "Exotic" or prod.name in ["Broccoli", "Capsicum Red", "Capsicum Yellow", "Mushroom Button"]:
                assigned_sup = exotic_sup
                cost_margin = 0.80 # Exotics cost more
            else:
                assigned_sup = veggie_sup
                cost_margin = 0.75 # Mandi goods

            if assigned_sup and prod.default_price:
                import decimal
                cost_margin_dec = decimal.Decimal(str(cost_margin))
                cost_price = prod.default_price * cost_margin_dec
                cost_decimal = decimal.Decimal(str(round(float(cost_price), 2)))
                link = ProductSupplier(
                    product_id=prod.id,
                    supplier_id=assigned_sup.id,
                    cost_price=cost_decimal,
                    is_primary_supplier=True
                )
                db.add(link)
    db.commit()
    print("Linked products to primary suppliers.")

    db.close()
    print("Seed complete.")
