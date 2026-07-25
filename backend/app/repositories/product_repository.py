import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.product import Product

class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: uuid.UUID) -> Optional[Product]:
        return self.db.query(Product).filter(Product.id == id, Product.is_active == True).first()

    def get_all(self) -> List[Product]:
        return self.db.query(Product).filter(Product.is_active == True).all()

    def create(self, product: Product) -> Product:
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product: Product) -> Product:
        self.db.commit()
        self.db.refresh(product)
        return product

    def deactivate(self, product: Product):
        product.is_active = False
        self.db.commit()
