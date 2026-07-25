import uuid
import datetime
from decimal import Decimal
from app.database.session import SessionLocal
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.invoice import Invoice
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.settings import Settings
from app.models.supplier import Supplier, ProductSupplier
from app.core.security import get_password_hash

REAL_CUSTOMERS = ['Adarsh', 'FOX DEN', 'Fernway by stories', 'Lavish creative LLP', 'PRAAD ESTATE PRIVATE  LIMITED', 'Stories Bar &  Kitchen (80 Feet Alleyway LLP))', 'Stories Bar & Kitchen (Bistro Blues LLP)', 'Stories Bar & Kitchen (Urbaneat LLP)', 'stories Rajajinagar']

REAL_PRODUCTS = [('Zucchini green', {'category': 'Exotic', 'unit': 'KG', 'price': 120.0}), ('Zucchini  yellow', {'category': 'Exotic', 'unit': 'KG', 'price': 120.0}), ('Green chilli spicy', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Palak/spinach', {'category': 'Leafy', 'unit': 'KG', 'price': 50.0}), ('Peeled garlic', {'category': 'Vegetables', 'unit': 'KG', 'price': 250.0}), ('Carrot', {'category': 'Vegetables', 'unit': 'KG', 'price': 55.0}), ('Beans Haricot', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Red chilli', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Basil Leaves', {'category': 'Exotic', 'unit': 'KG', 'price': 130.0}), ('Potato', {'category': 'Vegetables', 'unit': 'KG', 'price': 30.0}), ('Mushroom button', {'category': 'Exotic', 'unit': 'PAC', 'price': 40.0}), ('Sweet corn', {'category': 'Vegetables', 'unit': 'PCS', 'price': 20.0}), ('Onion', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Tomato jam', {'category': 'Vegetables', 'unit': 'KG', 'price': 30.0}), ('Ginger', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Capsicum  green', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Banana Leaf', {'category': 'Vegetables', 'unit': 'PCS', 'price': 5.0}), ('Capsicum red', {'category': 'Vegetables', 'unit': 'KG', 'price': 125.0}), ('Capsicum  yellow', {'category': 'Vegetables', 'unit': 'KG', 'price': 125.0}), ('Pokkchoy', {'category': 'Vegetables', 'unit': 'KG', 'price': 90.0}), ('Bottle guard', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Long beans', {'category': 'Vegetables', 'unit': 'KG', 'price': 70.0}), ('Cauliflower', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Baby Corn', {'category': 'Exotic', 'unit': 'KG', 'price': 120.0}), ('Coconut pc', {'category': 'Vegetables', 'unit': 'PCS', 'price': 30.0}), ('Curry leaves', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Lemon green', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Mint', {'category': 'Leafy', 'unit': 'KG', 'price': 50.0}), ('Coriander', {'category': 'Leafy', 'unit': 'KG', 'price': 60.0}), ('Pineapple kg', {'category': 'Vegetables', 'unit': 'KG', 'price': 65.0}), ('Lemon  yellow', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Grapefruit', {'category': 'Vegetables', 'unit': 'KG', 'price': 350.0}), ('Spring onion', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Broccoli', {'category': 'Vegetables', 'unit': 'KG', 'price': 130.0}), ('Orange', {'category': 'Vegetables', 'unit': 'KG', 'price': 170.0}), ('Pineapple', {'category': 'Vegetables', 'unit': 'PCS', 'price': 120.0}), ('Red apple', {'category': 'Vegetables', 'unit': 'KG', 'price': 280.0}), ('Baby potato', {'category': 'Exotic', 'unit': 'KG', 'price': 38.0}), ('Cucumber', {'category': 'Vegetables', 'unit': 'KG', 'price': 48.0}), ('Green capsicum', {'category': 'Vegetables', 'unit': 'KG', 'price': 100.0}), ('Ladies finger', {'category': 'Vegetables', 'unit': 'KG', 'price': 49.0}), ('Iceberg lettuce', {'category': 'Leafy', 'unit': 'KG', 'price': 260.0}), ('Red capsicum', {'category': 'Vegetables', 'unit': 'KG', 'price': 240.0}), ('Watermelon pc', {'category': 'Vegetables', 'unit': 'PCS', 'price': 130.0}), ('Blueberry', {'category': 'Vegetables', 'unit': 'BOX', 'price': 200.0}), ('Drumstick', {'category': 'Vegetables', 'unit': 'KG', 'price': 280.0}), ('Pumpkin', {'category': 'Vegetables', 'unit': 'KG', 'price': 20.0}), ('Green  lettuce', {'category': 'Leafy', 'unit': 'KG', 'price': 115.0}), ('Asparagus', {'category': 'Vegetables', 'unit': 'KG', 'price': 300.0}), ('American corn', {'category': 'Vegetables', 'unit': 'KG', 'price': 85.0}), ('Black grapes', {'category': 'Vegetables', 'unit': 'KG', 'price': 400.0}), ('Thyme', {'category': 'Exotic', 'unit': 'KG', 'price': 325.0}), ('Delivery', {'category': 'Vegetables', 'unit': 'KG', 'price': 600.0}), ('Watermelon', {'category': 'Vegetables', 'unit': 'KG', 'price': 25.0}), ('English Cucumber', {'category': 'Vegetables', 'unit': 'KG', 'price': 80.0}), ('Cabbage', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Red cabbage', {'category': 'Vegetables', 'unit': 'KG', 'price': 165.0}), ('Garlic whole', {'category': 'Vegetables', 'unit': 'KG', 'price': 165.0}), ('Parsley', {'category': 'Exotic', 'unit': 'KG', 'price': 180.0}), ('Cherry tomato', {'category': 'Vegetables', 'unit': 'KG', 'price': 320.0}), ('Methi leaf', {'category': 'Leafy', 'unit': 'KG', 'price': 150.0}), ('Sorrel leaves', {'category': 'Vegetables', 'unit': 'KG', 'price': 100.0}), ('Beetroot', {'category': 'Vegetables', 'unit': 'KG', 'price': 50.0}), ('Celery', {'category': 'Exotic', 'unit': 'KG', 'price': 160.0}), ('Pumpkin pc', {'category': 'Vegetables', 'unit': 'PCS', 'price': 95.0}), ('Red lettuce', {'category': 'Leafy', 'unit': 'KG', 'price': 320.0}), ('Pears', {'category': 'Vegetables', 'unit': 'KG', 'price': 380.0}), ('Raw mango', {'category': 'Vegetables', 'unit': 'KG', 'price': 120.0}), ('Green apple', {'category': 'Vegetables', 'unit': 'KG', 'price': 270.0}), ('Pomegranate', {'category': 'Vegetables', 'unit': 'KG', 'price': 240.0}), ('Palak', {'category': 'Leafy', 'unit': 'KG', 'price': 85.0}), ('Rosemary', {'category': 'Exotic', 'unit': 'KG', 'price': 325.0}), ('Strawberry', {'category': 'Vegetables', 'unit': 'BOX', 'price': 150.0}), ('Dragon fruit pink', {'category': 'Vegetables', 'unit': 'PCS', 'price': 120.0}), ('Baby Jack Fruit', {'category': 'Exotic', 'unit': 'KG', 'price': 80.0}), ('Lotus stem', {'category': 'Vegetables', 'unit': 'KG', 'price': 300.0}), ('Chinese cabbage', {'category': 'Vegetables', 'unit': 'KG', 'price': 80.0}), ('Leeks', {'category': 'Vegetables', 'unit': 'KG', 'price': 110.0}), ("LADY'S FINGER", {'category': 'Vegetables', 'unit': 'KG', 'price': 49.0}), ('Radish white', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Bottle gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Egg plant', {'category': 'Vegetables', 'unit': 'KG', 'price': 70.0}), ('Bajji chilli', {'category': 'Vegetables', 'unit': 'KG', 'price': 50.0}), ('Green peas', {'category': 'Vegetables', 'unit': 'KG', 'price': 90.0}), ('Bitter gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Vanilla Ice-cream', {'category': 'Vegetables', 'unit': 'LTR', 'price': 80.0}), ('Pista Ice-cream', {'category': 'Vegetables', 'unit': 'LTR', 'price': 80.0}), ('Point gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Thai Ginger', {'category': 'Vegetables', 'unit': 'KG', 'price': 300.0}), ('snake gaurd', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Lemon grass', {'category': 'Vegetables', 'unit': 'KG', 'price': 110.0}), ('Zucchini yellow', {'category': 'Exotic', 'unit': 'KG', 'price': 120.0}), ('Banana', {'category': 'Vegetables', 'unit': 'KG', 'price': 40.0}), ('Kaffir lime leaves pack', {'category': 'Vegetables', 'unit': 'PAC', 'price': 200.0}), ('papaya pc', {'category': 'Vegetables', 'unit': 'PCS', 'price': 85.0}), ('Kaffir lime leaves', {'category': 'Vegetables', 'unit': 'KG', 'price': 1400.0}), ('Chow chow', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Brinjal', {'category': 'Vegetables', 'unit': 'KG', 'price': 50.0}), ('Cauliflower pc', {'category': 'Vegetables', 'unit': 'PCS', 'price': 30.0}), ('Mango Alphonso', {'category': 'Vegetables', 'unit': 'KG', 'price': 250.0}), ('Mango ripe', {'category': 'Vegetables', 'unit': 'KG', 'price': 120.0}), ('Kiwi fruit', {'category': 'Vegetables', 'unit': 'KG', 'price': 320.0}), ('Avacado impo', {'category': 'Vegetables', 'unit': 'KG', 'price': 530.0}), ('Turmeric', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Sambar onion', {'category': 'Vegetables', 'unit': 'KG', 'price': 70.0}), ('Iceberg', {'category': 'Vegetables', 'unit': 'KG', 'price': 260.0}), ('Ridge gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Capsicum yellow', {'category': 'Vegetables', 'unit': 'KG', 'price': 140.0}), ('Kiwi', {'category': 'Vegetables', 'unit': 'KG', 'price': 280.0}), ('Mushroom', {'category': 'Exotic', 'unit': 'KG', 'price': 200.0}), ('Haricot beans', {'category': 'Vegetables', 'unit': 'KG', 'price': 130.0}), ('Indian cucumber', {'category': 'Vegetables', 'unit': 'KG', 'price': 25.0}), ('Celery stem', {'category': 'Exotic', 'unit': 'KG', 'price': 135.0}), ('Romaine lettuce', {'category': 'Leafy', 'unit': 'KG', 'price': 200.0}), ('maggi  masala', {'category': 'Vegetables', 'unit': 'PAC', 'price': 60.0}), ('Ashirvad atta', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Avacado impo box', {'category': 'Vegetables', 'unit': 'BOX', 'price': 1550.0}), ('Enoki Mushroom', {'category': 'Exotic', 'unit': 'KG', 'price': 1500.0}), ('Bisleri', {'category': 'Vegetables', 'unit': 'BOX', 'price': 190.0}), ('Raspuri mango', {'category': 'Vegetables', 'unit': 'KG', 'price': 150.0}), ('Maggi noodles 850gm', {'category': 'Vegetables', 'unit': 'PAC', 'price': 160.0}), ('Lemon', {'category': 'Vegetables', 'unit': 'KG', 'price': 220.0}), ('TOMATO', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Avocado imported', {'category': 'Exotic', 'unit': 'KG', 'price': 500.0}), ('Green chilly', {'category': 'Vegetables', 'unit': 'KG', 'price': 80.0}), ('Egg', {'category': 'Vegetables', 'unit': 'PCS', 'price': 6.5}), ('Dragon fruit', {'category': 'Vegetables', 'unit': 'PCS', 'price': 80.0}), ('Guava', {'category': 'Vegetables', 'unit': 'KG', 'price': 120.0}), ('Rocket lettuce', {'category': 'Leafy', 'unit': 'KG', 'price': 100.0}), ('Sweet  potato', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Edible flower', {'category': 'Vegetables', 'unit': 'BOX', 'price': 200.0}), ('Dill leaves', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Bisleri 250ml', {'category': 'Vegetables', 'unit': 'BOX', 'price': 110.0}), ('Ash gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 20.0}), ('Raw Banana', {'category': 'Vegetables', 'unit': 'KG', 'price': 33.0}), ('Amaranthus', {'category': 'Vegetables', 'unit': 'KG', 'price': 60.0}), ('Red radish', {'category': 'Vegetables', 'unit': 'KG', 'price': 85.0}), ('Rose  petals', {'category': 'Vegetables', 'unit': 'KG', 'price': 200.0}), ('aragula lettuce', {'category': 'Leafy', 'unit': 'KG', 'price': 120.0}), ('Kiwi fruit box', {'category': 'Vegetables', 'unit': 'BOX', 'price': 165.0}), ('Tender coconut malai', {'category': 'Vegetables', 'unit': 'PCS', 'price': 70.0}), ('Moong Sprouts', {'category': 'Vegetables', 'unit': 'BOX', 'price': 40.0}), ('Figs', {'category': 'Vegetables', 'unit': 'BOX', 'price': 90.0}), ('Saag red', {'category': 'Vegetables', 'unit': 'KG', 'price': 55.0}), ('Arbi', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Malbar Palak', {'category': 'Leafy', 'unit': 'KG', 'price': 70.0}), ('Mustard microgreens', {'category': 'Vegetables', 'unit': 'BOX', 'price': 180.0}), ('Radish microgreens', {'category': 'Vegetables', 'unit': 'BOX', 'price': 180.0}), ('Garlic', {'category': 'Vegetables', 'unit': 'KG', 'price': 156.0}), ('Sweet lime', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Ivy gourd', {'category': 'Vegetables', 'unit': 'KG', 'price': 50.0}), ('Sambar onion peeled', {'category': 'Vegetables', 'unit': 'KG', 'price': 70.0}), ('Avarekai', {'category': 'Vegetables', 'unit': 'KG', 'price': 75.0}), ('Lemon yellow', {'category': 'Vegetables', 'unit': 'KG', 'price': 90.0}), ('Sugarcane', {'category': 'Vegetables', 'unit': 'PCS', 'price': 25.0}), ('Lotus Root ( impo)', {'category': 'Vegetables', 'unit': 'KG', 'price': 1540.0}), ('Avarekai Peeled', {'category': 'Vegetables', 'unit': 'KG', 'price': 400.0}), ('Drumstick leaves', {'category': 'Vegetables', 'unit': 'KG', 'price': 250.0}), ('Orchid flower', {'category': 'Vegetables', 'unit': 'PCS', 'price': 130.0}), ('Dragon fruit white', {'category': 'Vegetables', 'unit': 'PCS', 'price': 90.0}), ('Raspberry', {'category': 'Vegetables', 'unit': 'BOX', 'price': 150.0}), ('Red graphes', {'category': 'Vegetables', 'unit': 'KG', 'price': 300.0}), ('Rosemary petals', {'category': 'Exotic', 'unit': 'KG', 'price': 100.0}), ('Raw papaya pc', {'category': 'Vegetables', 'unit': 'PCS', 'price': 42.0}), ('Avacado Local', {'category': 'Vegetables', 'unit': 'KG', 'price': 200.0}), ('Khol khol', {'category': 'Vegetables', 'unit': 'KG', 'price': 35.0}), ('Green chilly big', {'category': 'Vegetables', 'unit': 'KG', 'price': 70.0}), ('Gaint aurm', {'category': 'Vegetables', 'unit': 'KG', 'price': 45.0}), ('Coconut', {'category': 'Vegetables', 'unit': 'KG', 'price': 80.0})]

def seed_db():
    db = SessionLocal()
    
    # 1. Admin User
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
            print(f"Created admin user: {admin_email}")
        else:
            admin.password_hash = get_password_hash("admin123")
            db.commit()
            print(f"Updated password for admin user: {admin_email}")

    # 2. Settings
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings(
            company_name="FreshFlow Wholesale Produce",
            address="45 Market Yard, Bangalore",
            phone="+919876543200",
            email="support@freshflow.local",
            gstin="29AAACF1234F1Z0",
            invoice_prefix="FF",
            invoice_counter=1000,
            currency="INR",
            bank_name="HDFC Bank",
            account_number="50200012345678",
            ifsc_code="HDFC0001234",
            upi_id="freshflow@hdfc"
        )
        db.add(settings)
        db.commit()
        print("Created business settings.")

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
        chef.password_hash = get_password_hash("chef123")
        db.commit()

    # 4. Customers (All 9 Real Commercial Restaurants)
    created_customers = []
    for idx, c_name in enumerate(REAL_CUSTOMERS):
        cust = db.query(Customer).filter(Customer.restaurant_name == c_name).first()
        if not cust:
            cust = Customer(
                user_id=chef.id if idx == 0 else None,
                restaurant_name=c_name,
                gst_number=f"29ABCDE123{idx}F1Z5",
                phone=f"+91980000000{idx+1}",
                address=f"Building #{10+idx}, Indiranagar, Bangalore",
                credit_days=15
            )
            db.add(cust)
            db.commit()
            db.refresh(cust)
        created_customers.append(cust)
    print(f"Seeded {len(created_customers)} restaurant customers.")

    # 5. Products (169 Real Wholesale Vegetable Items)
    created_products = []
    for name, meta in REAL_PRODUCTS:
        prod = db.query(Product).filter(Product.name == name).first()
        if not prod:
            prod = Product(
                name=name,
                category=meta["category"],
                unit=meta["unit"],
                default_price=Decimal(str(meta["price"])),
                stock_quantity=Decimal("100.0"),
                reorder_level=Decimal("20.0"),
                is_active=True
            )
            db.add(prod)
            db.commit()
            db.refresh(prod)
        created_products.append(prod)
    print(f"Seeded {len(created_products)} real produce items.")

    # 6. Suppliers
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
    print(f"Seeded {len(created_suppliers)} suppliers.")

    # 7. Product Supplier Links
    leaf_sup, exotic_sup, staple_sup = created_suppliers[0], created_suppliers[1], created_suppliers[2]
    for prod in created_products:
        link = db.query(ProductSupplier).filter(ProductSupplier.product_id == prod.id).first()
        if not link:
            if prod.category == "Leafy":
                sup = leaf_sup
                margin = Decimal("0.70")
            elif prod.category == "Exotic":
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
    print("Linked products to suppliers.")

    # 8. Seed Sample Invoices & Purchase Orders for Real Profitability Metrics
    existing_invoices = db.query(Invoice).count()
    if existing_invoices == 0 and created_customers and created_products:
        # Create a sample completed Order & Invoice
        sample_cust = created_customers[0]
        sample_order = Order(
            customer_id=sample_cust.id,
            status="Completed",
            created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2)
        )
        db.add(sample_order)
        db.commit()
        db.refresh(sample_order)

        # Add order items
        total_order_amount = Decimal("0.0")
        for prod in created_products[:5]:
            qty = Decimal("10.0")
            price = prod.default_price
            item_total = qty * price
            total_order_amount += item_total
            db.add(OrderItem(
                order_id=sample_order.id,
                product_id=prod.id,
                quantity=qty,
                unit=prod.unit,
                unit_price=price
            ))
        db.commit()

        # Create Invoice for this order
        inv = Invoice(
            order_id=sample_order.id,
            customer_id=sample_cust.id,
            invoice_number="FF-1001",
            grand_total=total_order_amount,
            paid_amount=total_order_amount,
            balance_due=Decimal("0.0"),
            payment_status="Paid",
            created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2)
        )
        db.add(inv)
        db.commit()

        # Create corresponding Purchase Order for COGS
        sample_po = PurchaseOrder(
            supplier_id=staple_sup.id,
            status="Received",
            total_cost=round(total_order_amount * Decimal("0.75"), 2),
            paid_amount=round(total_order_amount * Decimal("0.75"), 2),
            balance_due=Decimal("0.0"),
            payment_status="Paid",
            created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3)
        )
        db.add(sample_po)
        db.commit()
        print(f"Seeded sample revenue & COGS invoice (Revenue: ₹{total_order_amount}, COGS: ₹{sample_po.total_cost}).")

    db.close()
    print("Full real-data seed complete.")

if __name__ == "__main__":
    seed_db()
