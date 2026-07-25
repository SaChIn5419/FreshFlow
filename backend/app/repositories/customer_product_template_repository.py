import uuid
from typing import List
from sqlalchemy.orm import Session
from app.models.customer_product_template import CustomerProductTemplate


class CustomerProductTemplateRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_customer(self, customer_id: uuid.UUID) -> List[CustomerProductTemplate]:
        from sqlalchemy.orm import joinedload
        return (
            self.db.query(CustomerProductTemplate)
            .options(joinedload(CustomerProductTemplate.product))
            .filter(CustomerProductTemplate.customer_id == customer_id)
            .order_by(CustomerProductTemplate.sort_order)
            .all()
        )

    def add(self, template: CustomerProductTemplate) -> CustomerProductTemplate:
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def remove(self, customer_id: uuid.UUID, product_id: uuid.UUID) -> bool:
        row = (
            self.db.query(CustomerProductTemplate)
            .filter(
                CustomerProductTemplate.customer_id == customer_id,
                CustomerProductTemplate.product_id == product_id,
            )
            .first()
        )
        if not row:
            return False
        self.db.delete(row)
        self.db.commit()
        return True
