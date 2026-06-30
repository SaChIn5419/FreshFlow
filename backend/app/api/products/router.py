from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.api import deps

router = APIRouter()


@router.get("/", response_model=List[ProductResponse])
def read_products(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Any = Depends(deps.get_current_active_user),
) -> Any:
    products = (
        db.query(Product)
        .filter(Product.is_active.is_(True))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return products


@router.post("/", response_model=ProductResponse)
def create_product(
    *,
    db: Session = Depends(get_db),
    product_in: ProductCreate,
    current_user: Any = Depends(deps.get_current_active_admin)
) -> Any:
    product = Product(**product_in.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{id}", response_model=ProductResponse)
def read_product(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_user)
) -> Any:
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{id}", response_model=ProductResponse)
def update_product(
    *,
    db: Session = Depends(get_db),
    id: int,
    product_in: ProductUpdate,
    current_user: Any = Depends(deps.get_current_active_admin)
) -> Any:
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{id}", response_model=ProductResponse)
def delete_product(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: Any = Depends(deps.get_current_active_admin)
) -> Any:
    product = db.query(Product).filter(Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
