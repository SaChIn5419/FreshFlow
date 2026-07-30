from typing import List, Optional
import uuid
from sqlalchemy.orm import Session, joinedload, selectinload
from app.models.order import Order, OrderItem

class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: uuid.UUID) -> Optional[Order]:
        return self.db.query(Order).options(
            joinedload(Order.customer),
            selectinload(Order.items).joinedload(OrderItem.product)
        ).filter(Order.id == id).first()

    def get_by_request_id(self, request_id: str) -> Optional[Order]:
        return self.db.query(Order).options(
            joinedload(Order.customer),
            selectinload(Order.items).joinedload(OrderItem.product)
        ).filter(Order.request_id == request_id).first()

    def get_all(self, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> tuple[List[Order], int]:
        query = self.db.query(Order).options(
            joinedload(Order.customer),
            selectinload(Order.items).joinedload(OrderItem.product)
        )

        if search:
            from app.models.customer import Customer
            search_pattern = f"%{search}%"
            query = query.join(Order.customer).filter(
                (Customer.restaurant_name.ilike(search_pattern)) |
                (Order.id.cast(str).ilike(search_pattern))
            )

        total = query.count()
        items = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def get_by_customer(self, customer_id: uuid.UUID) -> List[Order]:
        return self.db.query(Order).options(
            joinedload(Order.customer),
            selectinload(Order.items).joinedload(OrderItem.product)
        ).filter(Order.customer_id == customer_id).order_by(Order.created_at.desc()).all()

    def create(self, order: Order) -> Order:
        try:
            self.db.add(order)
            self.db.commit()
            self.db.refresh(order)
            return order
        except Exception as e:
            self.db.rollback()
            raise e

    def update(self, order: Order) -> Order:
        try:
            self.db.commit()
            self.db.refresh(order)
            return order
        except Exception as e:
            self.db.rollback()
            raise e

    def update_status(self, order: Order, status: str) -> Order:
        try:
            order.status = status
            self.db.commit()
            self.db.refresh(order)
            return order
        except Exception as e:
            self.db.rollback()
            raise e
