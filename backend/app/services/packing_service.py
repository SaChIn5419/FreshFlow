import uuid
from typing import List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.packing_list import PackingList, PackingListItem
from app.models.order import Order, OrderStatus
from app.repositories.packing_repository import PackingRepository
from app.repositories.order_repository import OrderRepository
from app.schemas.packing_list import PackingListUpdate, PackingListItemUpdate


class PackingService:
    def __init__(self, db: Session):
        self.db = db
        self.packing_repo = PackingRepository(db)
        self.order_repo = OrderRepository(db)

    def get_packing_list(self, id: uuid.UUID) -> Optional[PackingList]:
        return self.packing_repo.get_by_id(id)

    def get_packing_list_by_order(self, order_id: uuid.UUID) -> Optional[PackingList]:
        return self.packing_repo.get_by_order_id(order_id)

    def get_all_packing_lists(self) -> List[PackingList]:
        return self.packing_repo.get_all()

    def get_or_create_packing_list_for_order(self, order_id: uuid.UUID) -> PackingList:
        existing = self.packing_repo.get_by_order_id(order_id)
        if existing:
            return existing

        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")

        packing_list = PackingList(
            order_id=order_id,
            status="Pending"
        )
        self.db.add(packing_list)
        self.db.flush()

        items = []
        for order_item in order.items:
            p_item = PackingListItem(
                packing_list_id=packing_list.id,
                product_id=order_item.product_id,
                quantity_requested=order_item.quantity,
                quantity_packed=Decimal("0.00"),
                unit=order_item.unit,
                is_packed=False
            )
            self.db.add(p_item)
            items.append(p_item)

        packing_list.items = items
        return self.packing_repo.create(packing_list)

    def update_packing_item(self, item_id: uuid.UUID, data: PackingListItemUpdate) -> Optional[PackingListItem]:
        item = self.packing_repo.get_item_by_id(item_id)
        if not item:
            return None

        if data.quantity_packed is not None:
            item.quantity_packed = data.quantity_packed
        if data.is_packed is not None:
            item.is_packed = data.is_packed
            if data.is_packed and (data.quantity_packed is None or data.quantity_packed == Decimal("0.00")):
                item.quantity_packed = item.quantity_requested

        updated_item = self.packing_repo.update_item(item)

        # Check packing list completion status
        packing_list = self.packing_repo.get_by_id(item.packing_list_id)
        if packing_list:
            all_packed = all(i.is_packed for i in packing_list.items)
            any_packed = any(i.is_packed or i.quantity_packed > 0 for i in packing_list.items)

            if all_packed:
                packing_list.status = "Packed"
                # Automatically advance customer Order status to "Packed"
                order = self.order_repo.get_by_id(packing_list.order_id)
                if order:
                    order.status = OrderStatus.PACKED.value
                    self.order_repo.update(order)
            elif any_packed:
                packing_list.status = "In Progress"

            self.packing_repo.update(packing_list)

        return updated_item

    def update_packing_list(self, id: uuid.UUID, data: PackingListUpdate) -> Optional[PackingList]:
        packing_list = self.packing_repo.get_by_id(id)
        if not packing_list:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(packing_list, key, val)

        return self.packing_repo.update(packing_list)
