import uuid
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.packing_list import PackingList, PackingListItem


class PackingRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: uuid.UUID) -> Optional[PackingList]:
        return (
            self.db.query(PackingList)
            .options(
                joinedload(PackingList.items).joinedload(PackingListItem.product),
                joinedload(PackingList.order)
            )
            .filter(PackingList.id == id)
            .first()
        )

    def get_by_order_id(self, order_id: uuid.UUID) -> Optional[PackingList]:
        return (
            self.db.query(PackingList)
            .options(
                joinedload(PackingList.items).joinedload(PackingListItem.product),
                joinedload(PackingList.order)
            )
            .filter(PackingList.order_id == order_id)
            .first()
        )

    def get_all(self) -> List[PackingList]:
        return (
            self.db.query(PackingList)
            .options(
                joinedload(PackingList.items).joinedload(PackingListItem.product),
                joinedload(PackingList.order)
            )
            .order_by(PackingList.created_at.desc())
            .all()
        )

    def create(self, packing_list: PackingList) -> PackingList:
        self.db.add(packing_list)
        self.db.commit()
        self.db.refresh(packing_list)
        return packing_list

    def update(self, packing_list: PackingList) -> PackingList:
        self.db.commit()
        self.db.refresh(packing_list)
        return packing_list

    def get_item_by_id(self, item_id: uuid.UUID) -> Optional[PackingListItem]:
        return (
            self.db.query(PackingListItem)
            .options(joinedload(PackingListItem.product))
            .filter(PackingListItem.id == item_id)
            .first()
        )

    def update_item(self, item: PackingListItem) -> PackingListItem:
        self.db.commit()
        self.db.refresh(item)
        return item
