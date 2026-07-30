import uuid
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload, selectinload
from app.models.invoice import Invoice

class InvoiceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: uuid.UUID) -> Optional[Invoice]:
        return self.db.query(Invoice).options(
            joinedload(Invoice.customer),
            joinedload(Invoice.order),
            selectinload(Invoice.items)
        ).filter(Invoice.id == id).first()

    def get_by_invoice_number(self, invoice_number: str) -> Optional[Invoice]:
        return self.db.query(Invoice).options(
            joinedload(Invoice.customer),
            joinedload(Invoice.order),
            selectinload(Invoice.items)
        ).filter(Invoice.invoice_number == invoice_number).first()

    def get_all(self, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> tuple[List[Invoice], int]:
        query = self.db.query(Invoice).options(
            joinedload(Invoice.customer),
            joinedload(Invoice.order),
            selectinload(Invoice.items)
        )
        
        if search:
            from app.models.customer import Customer
            search_pattern = f"%{search}%"
            query = query.join(Invoice.customer).filter(
                (Customer.restaurant_name.ilike(search_pattern)) |
                (Invoice.invoice_number.ilike(search_pattern))
            )
            
        total = query.count()
        items = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()
        return items, total

    def get_by_order(self, order_id: uuid.UUID) -> List[Invoice]:
        return self.db.query(Invoice).options(
            joinedload(Invoice.customer),
            selectinload(Invoice.items)
        ).filter(Invoice.order_id == order_id).all()

    def create(self, invoice: Invoice) -> Invoice:
        try:
            self.db.add(invoice)
            self.db.commit()
            self.db.refresh(invoice)
            return invoice
        except Exception as e:
            self.db.rollback()
            raise e
