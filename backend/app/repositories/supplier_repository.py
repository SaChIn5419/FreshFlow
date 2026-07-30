import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.supplier import Supplier, ProductSupplier


class SupplierRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: uuid.UUID) -> Optional[Supplier]:
        return self.db.query(Supplier).filter(Supplier.id == id, Supplier.is_active == True).first()

    def get_all(self, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> tuple[List[Supplier], int]:
        query = self.db.query(Supplier).filter(Supplier.is_active == True)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Supplier.name.ilike(search_pattern)) |
                (Supplier.email.ilike(search_pattern)) |
                (Supplier.phone.ilike(search_pattern))
            )
            
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def create(self, supplier: Supplier) -> Supplier:
        self.db.add(supplier)
        self.db.commit()
        self.db.refresh(supplier)
        return supplier

    def update(self, supplier: Supplier) -> Supplier:
        self.db.commit()
        self.db.refresh(supplier)
        return supplier

    def deactivate(self, supplier: Supplier):
        supplier.is_active = False
        self.db.commit()

    def get_product_supplier(self, supplier_id: uuid.UUID, product_id: uuid.UUID) -> Optional[ProductSupplier]:
        return self.db.query(ProductSupplier).filter(
            ProductSupplier.supplier_id == supplier_id,
            ProductSupplier.product_id == product_id
        ).first()

    def add_product_supplier(self, product_supplier: ProductSupplier) -> ProductSupplier:
        # Check if it already exists to avoid duplicates
        existing = self.get_product_supplier(product_supplier.supplier_id, product_supplier.product_id)
        if existing:
            existing.cost_price = product_supplier.cost_price
            existing.is_primary_supplier = product_supplier.is_primary_supplier
            existing.notes = product_supplier.notes
            self.db.commit()
            self.db.refresh(existing)
            return existing
        
        # If set as primary, unset other primaries for the same product
        if product_supplier.is_primary_supplier:
            self.unset_primary_suppliers_for_product(product_supplier.product_id)

        self.db.add(product_supplier)
        self.db.commit()
        self.db.refresh(product_supplier)
        return product_supplier

    def get_suppliers_by_product(self, product_id: uuid.UUID) -> List[ProductSupplier]:
        return self.db.query(ProductSupplier).filter(ProductSupplier.product_id == product_id).all()

    def get_primary_supplier_for_product(self, product_id: uuid.UUID) -> Optional[ProductSupplier]:
        return self.db.query(ProductSupplier).filter(
            ProductSupplier.product_id == product_id,
            ProductSupplier.is_primary_supplier == True
        ).first()

    def unset_primary_suppliers_for_product(self, product_id: uuid.UUID):
        primaries = self.db.query(ProductSupplier).filter(
            ProductSupplier.product_id == product_id,
            ProductSupplier.is_primary_supplier == True
        ).all()
        for p in primaries:
            p.is_primary_supplier = False
        self.db.commit()

    def remove_product_supplier(self, supplier_id: uuid.UUID, product_id: uuid.UUID) -> bool:
        ps = self.get_product_supplier(supplier_id, product_id)
        if ps:
            self.db.delete(ps)
            self.db.commit()
            return True
        return False
