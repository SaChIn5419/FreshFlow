import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.customer import Customer

class CustomerRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: uuid.UUID) -> Optional[Customer]:
        return self.db.query(Customer).filter(Customer.id == id, Customer.is_active == True).first()

    def get_all(self, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> tuple[List[Customer], int]:
        query = self.db.query(Customer).filter(Customer.is_active == True)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Customer.restaurant_name.ilike(search_pattern)) |
                (Customer.owner_name.ilike(search_pattern)) |
                (Customer.phone.ilike(search_pattern))
            )
            
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, customer: Customer) -> Customer:
        self.db.add(customer)
        self.db.commit()
        self.db.refresh(customer)
        return customer

    def update(self, customer: Customer) -> Customer:
        self.db.commit()
        self.db.refresh(customer)
        return customer

    def deactivate(self, customer: Customer):
        customer.is_active = False
        self.db.commit()
