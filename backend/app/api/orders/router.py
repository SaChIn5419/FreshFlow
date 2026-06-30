from typing import Any, List
import os
import shutil
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.order import Order, OrderItem, OrderFile, OrderStatus
from app.models.customer import Customer
from app.schemas.order import OrderCreate, OrderUpdate, OrderResponse
from app.api import deps

router = APIRouter()

UPLOAD_DIR = "app/uploads/orders/"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.get("/", response_model=List[OrderResponse])
def read_orders(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role == "ADMIN":
        orders = db.query(Order).offset(skip).limit(limit).all()
    else:
        customer = (
            db.query(Customer).filter(Customer.user_id == current_user.id).first()
        )
        if not customer:
            return []
        orders = (
            db.query(Order)
            .filter(Order.customer_id == customer.id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    return orders


@router.post("/", response_model=OrderResponse)
def create_order(
    *,
    db: Session = Depends(get_db),
    order_in: OrderCreate,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    # Validate customer ownership if not admin
    if current_user.role != "ADMIN":
        customer = (
            db.query(Customer).filter(Customer.id == order_in.customer_id).first()
        )
        if not customer or customer.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    order = Order(
        customer_id=order_in.customer_id,
        remarks=order_in.remarks,
        status=OrderStatus.SUBMITTED.value,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    if order_in.items:
        for item_in in order_in.items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_in.product_id,
                quantity=item_in.quantity,
                unit=item_in.unit,
            )
            db.add(order_item)
        db.commit()
        db.refresh(order)

    return order


@router.post("/{order_id}/upload")
def upload_order_file(
    order_id: int,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role != "ADMIN":
        customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
        if not customer or customer.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    # Save file
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{order_id}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    order_file = OrderFile(order_id=order.id, filename=file.filename, path=file_path)
    db.add(order_file)
    db.commit()

    return {"filename": file.filename, "path": file_path}


@router.get("/{id}", response_model=OrderResponse)
def read_order(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role != "ADMIN":
        customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
        if not customer or customer.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

    return order


@router.put("/{id}", response_model=OrderResponse)
def update_order(
    *,
    db: Session = Depends(get_db),
    id: int,
    order_in: OrderUpdate,
    current_user: Any = Depends(deps.get_current_active_admin),
) -> Any:
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order_in.status:
        order.status = order_in.status
    if order_in.payment_status:
        order.payment_status = order_in.payment_status

    db.add(order)
    db.commit()
    db.refresh(order)
    return order
