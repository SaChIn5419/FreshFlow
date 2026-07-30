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

    def get_all_products(self, skip: int = 0, limit: int = 100, search: str | None = None) -> dict:
        items, total = self.repository.get_all(skip=skip, limit=limit, search=search)
        return {
            "items": items,
            "total": total,
            "page": (skip // limit) + 1 if limit > 0 else 1,
            "size": limit,
            "pages": (total + limit - 1) // limit if limit > 0 else 1
        }

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
