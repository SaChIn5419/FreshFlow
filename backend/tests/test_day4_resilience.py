import uuid
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order
from app.core.security import get_password_hash, create_access_token

def test_idempotent_order_submission(client: TestClient, db: Session) -> None:
    # 1. Setup user & customer & product
    user = User(
        email="idempotent_test@example.com",
        password_hash=get_password_hash("password123"),
        role="CUSTOMER"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    customer = Customer(user_id=user.id, restaurant_name="Idempotent Rest")
    db.add(customer)
    db.commit()
    db.refresh(customer)

    product = Product(name="Idempotent Potato", unit="KG", category="Veg", default_price=30.0)
    db.add(product)
    db.commit()
    db.refresh(product)

    token = create_access_token(user.id)
    request_id = f"req_{uuid.uuid4()}"

    payload = {
        "customer_id": str(customer.id),
        "request_id": request_id,
        "remarks": "Deliver before noon",
        "items": [
            {
                "product_id": str(product.id),
                "quantity": 10.0,
                "unit": "KG"
            }
        ]
    }

    # First attempt: Order created
    res1 = client.post(
        "/api/v1/orders/",
        headers={"Authorization": f"Bearer {token}", "X-Requested-With": "FreshFlow"},
        json=payload
    )
    assert res1.status_code == 200
    data1 = res1.json()
    order_id_1 = data1["id"]

    # Second attempt with identical request_id: Idempotent return existing order
    res2 = client.post(
        "/api/v1/orders/",
        headers={"Authorization": f"Bearer {token}", "X-Requested-With": "FreshFlow"},
        json=payload
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["id"] == order_id_1


def test_concurrent_idempotent_order_submissions(db: Session) -> None:
    import concurrent.futures
    from app.database.session import SessionLocal
    from app.repositories import OrderRepository, ProductRepository
    from app.services import OrderService
    from app.schemas.order import OrderCreate

    user = User(
        email="concurrent_test@example.com",
        password_hash=get_password_hash("password123"),
        role="CUSTOMER"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    customer = Customer(user_id=user.id, restaurant_name="Concurrent Rest")
    db.add(customer)
    db.commit()
    db.refresh(customer)

    product = Product(name="Concurrent Onion", unit="KG", category="Veg", default_price=25.0)
    db.add(product)
    db.commit()
    db.refresh(product)

    shared_request_id = f"concurrent_req_{uuid.uuid4()}"
    user_id_str = str(user.id)

    payload = {
        "customer_id": str(customer.id),
        "request_id": shared_request_id,
        "remarks": "Concurrent order attempt",
        "items": [
            {
                "product_id": str(product.id),
                "quantity": 5.0,
                "unit": "KG"
            }
        ]
    }

    def post_with_session():
        session = SessionLocal()
        try:
            repo = OrderRepository(session)
            p_repo = ProductRepository(session)
            svc = OrderService(repo, p_repo)
            order_data = OrderCreate(**payload)
            created = svc.create_order(order_data, user_id_str)
            return str(created.id)
        finally:
            session.close()

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(post_with_session)
        f2 = executor.submit(post_with_session)
        id1 = f1.result()
        id2 = f2.result()

    assert id1 == id2
