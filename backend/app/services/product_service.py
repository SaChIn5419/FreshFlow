import uuid
from typing import List
from app.repositories import ProductRepository
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate

from app.services.audit_service import AuditService

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

    def create_product(self, data: ProductCreate, user_id: str = "") -> Product:
        product = Product(
            name=data.name,
            category=data.category,
            unit=data.unit,
            default_price=data.default_price
        )
        created = self.repository.create(product)
        AuditService.log_action(
            db=self.repository.db,
            user_id=user_id,
            action="CREATED_PRODUCT",
            entity_type="PRODUCT",
            entity_id=str(created.id),
            details=f"Created product '{created.name}' at ₹{created.default_price}/{created.unit}"
        )
        return created

    def update_product(self, id: uuid.UUID, data: ProductUpdate, user_id: str = "") -> Product | None:
        product = self.repository.get_by_id(id)
        if not product:
            return None
        
        old_price = product.default_price
        if data.default_price is not None:
            product.default_price = data.default_price

        if data.is_active is not None:
            product.is_active = data.is_active
            
        updated = self.repository.update(product)
        AuditService.log_action(
            db=self.repository.db,
            user_id=user_id,
            action="UPDATED_PRODUCT",
            entity_type="PRODUCT",
            entity_id=str(updated.id),
            details=f"Updated product '{updated.name}'. Price: ₹{old_price} → ₹{updated.default_price}"
        )
        return updated

    def deactivate_product(self, id: uuid.UUID, user_id: str = "") -> bool:
        product = self.repository.get_by_id(id)
        if not product:
            return False
        self.repository.deactivate(product)
        AuditService.log_action(
            db=self.repository.db,
            user_id=user_id,
            action="DEACTIVATED_PRODUCT",
            entity_type="PRODUCT",
            entity_id=str(product.id),
            details=f"Deactivated product '{product.name}'"
        )
        return True
