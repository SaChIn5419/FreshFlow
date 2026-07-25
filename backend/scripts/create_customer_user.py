import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.database.session import SessionLocal
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.customer_product_template import CustomerProductTemplate
from app.core.security import get_password_hash

db = SessionLocal()
chef = db.query(User).filter(User.email == "chef@demo.com").first()
if not chef:
    chef = User(email="chef@demo.com", password_hash=get_password_hash("chef123"), role="CUSTOMER")
    db.add(chef)
    db.commit()
    db.refresh(chef)

customer = db.query(Customer).filter(Customer.restaurant_name == "Demo Restaurant").first()
if customer:
    customer.user_id = chef.id
    db.commit()

# assign template products
products = db.query(Product).limit(5).all()
for idx, p in enumerate(products):
    if not db.query(CustomerProductTemplate).filter_by(customer_id=customer.id, product_id=p.id).first():
        db.add(CustomerProductTemplate(customer_id=customer.id, product_id=p.id, sort_order=idx))
db.commit()
print("Chef user and templates created.")
