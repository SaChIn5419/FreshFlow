from datetime import timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.invoice import Invoice
from app.core import security
from app.core.security import get_password_hash

def test_dashboard_stats_data_accuracy(client: TestClient, db: Session) -> None:
    # 1. Create admin user
    user = User(email="admin_dash_acc@example.com", password_hash=get_password_hash("password"), role="ADMIN")
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # 2. Create customer and product
    customer = Customer(user_id=user.id, restaurant_name="Dashboard Test Rest", is_active=True)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    product = Product(name="Test Veggie", unit="KG", category="Veg", default_price=50.0, is_active=True)
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # 3. Create an order and invoice for today
    order = Order(customer_id=customer.id, payment_status="Pending")
    db.add(order)
    db.commit()
    db.refresh(order)
    
    order_item = OrderItem(
        order_id=order.id, product_id=product.id, 
        quantity=Decimal("9999.0"), unit="KG"
    )
    db.add(order_item)
    
    invoice = Invoice(
        order_id=order.id, customer_id=customer.id, invoice_number="INV-DASH-1", 
        subtotal=Decimal("100.0"), gst=Decimal("0.0"), grand_total=Decimal("100.0"), 
        balance_due=Decimal("100.0"), payment_status="Unpaid"
    )
    db.add(invoice)
    db.commit()

    # 4. Get token and hit endpoint
    token = security.create_access_token(user.id, expires_delta=timedelta(minutes=15))
    response = client.get("/api/v1/dashboard/stats", cookies={"access_token": token})
    
    # 5. Assert 200 OK and data accuracy
    assert response.status_code == 200
    data = response.json()
    
    # Check that our created data is reflected (using >= because test DB has pre-seeded data)
    assert data["orders_today"] >= 1, "Should count today's order"
    assert data["revenue_today"] >= 100.0, "Should sum today's invoice revenue"
    assert data["total_receivables"] >= 100.0, "Should sum unpaid invoice balances"
    assert data["active_customers"] >= 1, "Should count active customers"
    assert data["total_products"] >= 1, "Should count active products"
    
    # Check top products structure
    top_products = data["top_products"]
    assert len(top_products) > 0, "Should return top products"
    
    # Ensure our product was counted in the top products aggregation
    found = any(p["id"] == str(product.id) and p["total_quantity"] >= 9999.0 for p in top_products)
    assert found, "The aggregated top products should include our tested order item quantity"
