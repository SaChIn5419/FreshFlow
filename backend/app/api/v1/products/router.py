import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.product import Product, ProductCreate, ProductUpdate
from app.services import ProductService
from app.repositories import ProductRepository
from app.core.exceptions import ProductNotFound

router = APIRouter()

def get_product_service(db: Session = Depends(deps.get_db)) -> ProductService:
    repo = ProductRepository(db)
    return ProductService(repo)

@router.get("/", response_model=List[Product])
def read_products(
    svc: ProductService = Depends(get_product_service),
    current_user = Depends(deps.get_current_active_user)
):
    return svc.get_all_products()

@router.post("/", response_model=Product)
def create_product(
    data: ProductCreate,
    svc: ProductService = Depends(get_product_service),
    current_user = Depends(deps.get_current_active_admin)
):
    return svc.create_product(data)

@router.get("/{id}", response_model=Product)
def read_product(
    id: uuid.UUID,
    svc: ProductService = Depends(get_product_service),
    current_user = Depends(deps.get_current_active_user)
):
    product = svc.get_product(id)
    if not product:
        raise ProductNotFound()
    return product

@router.put("/{id}", response_model=Product)
def update_product(
    id: uuid.UUID,
    data: ProductUpdate,
    svc: ProductService = Depends(get_product_service),
    current_user = Depends(deps.get_current_active_admin)
):
    product = svc.update_product(id, data)
    if not product:
        raise ProductNotFound()
    return product

@router.delete("/{id}")
def deactivate_product(
    id: uuid.UUID,
    svc: ProductService = Depends(get_product_service),
    current_user = Depends(deps.get_current_active_admin)
):
    if not svc.deactivate_product(id):
        raise ProductNotFound()
    return {"status": "success"}
