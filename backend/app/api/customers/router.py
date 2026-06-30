from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.api import deps

router = APIRouter()


@router.get("/", response_model=List[CustomerResponse])
def read_customers(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    if current_user.role == "ADMIN":
        customers = db.query(Customer).offset(skip).limit(limit).all()
    else:
        customers = db.query(Customer).filter(Customer.user_id == current_user.id).all()
    return customers


@router.post("/", response_model=CustomerResponse)
def create_customer(
    *,
    db: Session = Depends(get_db),
    customer_in: CustomerCreate,
    current_user: Any = Depends(deps.get_current_active_user)
) -> Any:
    if current_user.role != "ADMIN" and customer_in.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    customer = Customer(**customer_in.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{id}", response_model=CustomerResponse)
def read_customer(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user)
) -> Any:
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if current_user.role != "ADMIN" and customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return customer


@router.put("/{id}", response_model=CustomerResponse)
def update_customer(
    *,
    db: Session = Depends(get_db),
    id: int,
    customer_in: CustomerUpdate,
    current_user: Any = Depends(deps.get_current_active_user)
) -> Any:
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    if current_user.role != "ADMIN" and customer.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_data = customer_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)

    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{id}", response_model=CustomerResponse)
def delete_customer(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_admin)
) -> Any:
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()
    return customer
