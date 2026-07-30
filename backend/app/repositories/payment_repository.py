import uuid
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate

class PaymentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100) -> Tuple[List[Payment], int]:
        query = self.db.query(Payment)
        total = query.count()
        items = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def get_by_id(self, payment_id: uuid.UUID) -> Payment | None:
        return self.db.query(Payment).filter(Payment.id == payment_id).first()

    def get_by_customer(self, customer_id: uuid.UUID) -> List[Payment]:
        return self.db.query(Payment).filter(Payment.customer_id == customer_id).order_by(Payment.payment_date.asc()).all()

    def add(self, data: PaymentCreate) -> Payment:
        payment = Payment(
            customer_id=data.customer_id,
            amount=data.amount,
            payment_date=data.payment_date,
            method=data.method,
            notes=data.notes
        )
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment
