import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.supplier import Supplier, ProductSupplier
from app.repositories.supplier_repository import SupplierRepository
from app.schemas.supplier import SupplierCreate, SupplierUpdate, ProductSupplierCreate


class SupplierService:
    def __init__(self, db: Session):
        self.db = db
        self.supplier_repo = SupplierRepository(db)

    def get_supplier(self, id: uuid.UUID) -> Optional[Supplier]:
        return self.supplier_repo.get_by_id(id)

    def get_all_suppliers(self, skip: int = 0, limit: int = 100, search: str | None = None) -> dict:
        items, total = self.supplier_repo.get_all(skip=skip, limit=limit, search=search)
        return {
            "items": items,
            "total": total,
            "page": (skip // limit) + 1 if limit > 0 else 1,
            "size": limit,
            "pages": (total + limit - 1) // limit if limit > 0 else 1
        }

    def create_supplier(self, data: SupplierCreate) -> Supplier:
        supplier = Supplier(
            name=data.name,
            phone=data.phone,
            whatsapp_number=data.whatsapp_number,
            email=data.email,
            address=data.address,
            credit_days=data.credit_days,
            average_lead_time=data.average_lead_time,
            notes=data.notes
        )
        return self.supplier_repo.create(supplier)

    def update_supplier(self, id: uuid.UUID, data: SupplierUpdate) -> Optional[Supplier]:
        supplier = self.supplier_repo.get_by_id(id)
        if not supplier:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(supplier, key, val)
            
        return self.supplier_repo.update(supplier)

    def delete_supplier(self, id: uuid.UUID) -> bool:
        supplier = self.supplier_repo.get_by_id(id)
        if not supplier:
            return False
        self.supplier_repo.deactivate(supplier)
        return True

    def link_product_to_supplier(self, supplier_id: uuid.UUID, data: ProductSupplierCreate) -> ProductSupplier:
        ps = ProductSupplier(
            product_id=data.product_id,
            supplier_id=supplier_id,
            cost_price=data.cost_price,
            is_primary_supplier=data.is_primary_supplier,
            notes=data.notes
        )
        return self.supplier_repo.add_product_supplier(ps)

    def get_suppliers_for_product(self, product_id: uuid.UUID) -> List[ProductSupplier]:
        return self.supplier_repo.get_suppliers_by_product(product_id)

    def unlink_product_from_supplier(self, supplier_id: uuid.UUID, product_id: uuid.UUID) -> bool:
        return self.supplier_repo.remove_product_supplier(supplier_id, product_id)
