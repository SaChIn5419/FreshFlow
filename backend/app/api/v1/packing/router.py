import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.packing_service import PackingService
from app.schemas.packing_list import (
    PackingList,
    PackingListUpdate,
    PackingListItem,
    PackingListItemUpdate,
)

router = APIRouter()


@router.get("/", response_model=List[PackingList])
def list_packing_lists(db: Session = Depends(get_db)):
    service = PackingService(db)
    return service.get_all_packing_lists()


@router.get("/order/{order_id}", response_model=PackingList)
def get_or_create_packing_list_for_order(order_id: uuid.UUID, db: Session = Depends(get_db)):
    service = PackingService(db)
    try:
        return service.get_or_create_packing_list_for_order(order_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{id}", response_model=PackingList)
def get_packing_list(id: uuid.UUID, db: Session = Depends(get_db)):
    service = PackingService(db)
    pl = service.get_packing_list(id)
    if not pl:
        raise HTTPException(status_code=404, detail="Packing list not found")
    return pl


@router.patch("/{id}", response_model=PackingList)
def update_packing_list(
    id: uuid.UUID,
    data: PackingListUpdate,
    db: Session = Depends(get_db),
):
    service = PackingService(db)
    updated = service.update_packing_list(id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Packing list not found")
    return updated


@router.patch("/items/{item_id}", response_model=PackingListItem)
def update_packing_item(
    item_id: uuid.UUID,
    data: PackingListItemUpdate,
    db: Session = Depends(get_db),
):
    service = PackingService(db)
    updated = service.update_packing_item(item_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail="Packing item not found")
    return updated
