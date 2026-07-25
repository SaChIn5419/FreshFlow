import uuid
from typing import List
from sqlalchemy.orm import Session
from app.models.customer_product import CustomerProduct

class CustomerProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_customer(self, customer_id: uuid.UUID) -> List[CustomerProduct]:
        return self.db.query(CustomerProduct).filter(CustomerProduct.customer_id == customer_id).order_by(CustomerProduct.display_order).all()

    def set_favorites(self, customer_id: uuid.UUID, products_data: List[dict]):
        # Clear existing
        self.db.query(CustomerProduct).filter(CustomerProduct.customer_id == customer_id).delete()
        
        # Add new
        for pd in products_data:
            cp = CustomerProduct(
                customer_id=customer_id,
                product_id=pd["product_id"],
                display_order=pd.get("display_order", 0),
                favorite=pd.get("favorite", False)
            )
            self.db.add(cp)
        self.db.commit()
