import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem


class PurchaseOrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: uuid.UUID) -> Optional[PurchaseOrder]:
        return self.db.query(PurchaseOrder).filter(PurchaseOrder.id == id).first()

    def get_all(self) -> List[PurchaseOrder]:
        return self.db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).all()

    def get_by_supplier(self, supplier_id: uuid.UUID) -> List[PurchaseOrder]:
        return self.db.query(PurchaseOrder).filter(PurchaseOrder.supplier_id == supplier_id).order_by(PurchaseOrder.created_at.desc()).all()

    def get_by_order(self, order_id: uuid.UUID) -> List[PurchaseOrder]:
        return self.db.query(PurchaseOrder).filter(PurchaseOrder.triggered_by_order_id == order_id).all()

    def create(self, purchase_order: PurchaseOrder) -> PurchaseOrder:
        self.db.add(purchase_order)
        self.db.commit()
        self.db.refresh(purchase_order)
        return purchase_order

    def update(self, purchase_order: PurchaseOrder) -> PurchaseOrder:
        self.db.commit()
        self.db.refresh(purchase_order)
        return purchase_order

    def get_item_by_id(self, item_id: uuid.UUID) -> Optional[PurchaseOrderItem]:
        return self.db.query(PurchaseOrderItem).filter(PurchaseOrderItem.id == item_id).first()

    def update_item(self, item: PurchaseOrderItem) -> PurchaseOrderItem:
        self.db.commit()
        self.db.refresh(item)
        return item
