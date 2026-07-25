import uuid
from typing import List
from app.repositories import ProductRepository
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate

class ProductService:
    def __init__(self, repository: ProductRepository):
        self.repository = repository

    def get_product(self, id: uuid.UUID) -> Product | None:
        return self.repository.get_by_id(id)

    def get_all_products(self) -> List[Product]:
        return self.repository.get_all()

    def create_product(self, data: ProductCreate) -> Product:
        product = Product(
            name=data.name,
            category=data.category,
            unit=data.unit,
            default_price=data.default_price
        )
        return self.repository.create(product)

    def update_product(self, id: uuid.UUID, data: ProductUpdate) -> Product | None:
        product = self.repository.get_by_id(id)
        if not product:
            return None
        
        if data.is_active is not None:
            product.is_active = data.is_active
            
        return self.repository.update(product)

    def deactivate_product(self, id: uuid.UUID) -> bool:
        product = self.repository.get_by_id(id)
        if not product:
            return False
        self.repository.deactivate(product)
        return True
