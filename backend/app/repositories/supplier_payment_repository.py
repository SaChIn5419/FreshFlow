import uuid
from typing import List, Tuple
from sqlalchemy.orm import Session
from app.models.supplier_payment import SupplierPayment


class SupplierPaymentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, skip: int = 0, limit: int = 100) -> Tuple[List[SupplierPayment], int]:
        query = self.db.query(SupplierPayment)
        total = query.count()
        items = query.order_by(SupplierPayment.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def get_by_id(self, payment_id: uuid.UUID) -> SupplierPayment | None:
        return self.db.query(SupplierPayment).filter(SupplierPayment.id == payment_id).first()

    def get_by_supplier(self, supplier_id: uuid.UUID) -> List[SupplierPayment]:
        return (
            self.db.query(SupplierPayment)
            .filter(SupplierPayment.supplier_id == supplier_id)
            .order_by(SupplierPayment.payment_date.asc())
            .all()
        )
