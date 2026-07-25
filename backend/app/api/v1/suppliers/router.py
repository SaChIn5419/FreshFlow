import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.supplier import Supplier, SupplierCreate, SupplierUpdate, ProductSupplier, ProductSupplierCreate
from app.services.supplier_service import SupplierService
from app.core.exceptions import ProductNotFound

router = APIRouter()

def get_supplier_service(db: Session = Depends(deps.get_db)) -> SupplierService:
    return SupplierService(db)

@router.get("/", response_model=List[Supplier])
def read_suppliers(
    svc: SupplierService = Depends(get_supplier_service),
    current_user = Depends(deps.get_current_active_user)
):
    return svc.get_all_suppliers()

@router.post("/", response_model=Supplier)
def create_supplier(
    data: SupplierCreate,
    svc: SupplierService = Depends(get_supplier_service),
    current_user = Depends(deps.get_current_active_admin)
):
    return svc.create_supplier(data)

@router.get("/{id}", response_model=Supplier)
def read_supplier(
    id: uuid.UUID,
    svc: SupplierService = Depends(get_supplier_service),
    current_user = Depends(deps.get_current_active_user)
):
    supplier = svc.get_supplier(id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier

@router.put("/{id}", response_model=Supplier)
def update_supplier(
    id: uuid.UUID,
    data: SupplierUpdate,
    svc: SupplierService = Depends(get_supplier_service),
    current_user = Depends(deps.get_current_active_admin)
):
    supplier = svc.update_supplier(id, data)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier

@router.delete("/{id}")
def delete_supplier(
    id: uuid.UUID,
    svc: SupplierService = Depends(get_supplier_service),
    current_user = Depends(deps.get_current_active_admin)
):
    if not svc.delete_supplier(id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return {"status": "success"}

@router.post("/{id}/products", response_model=ProductSupplier)
def link_product_to_supplier(
    id: uuid.UUID,
    data: ProductSupplierCreate,
    svc: SupplierService = Depends(get_supplier_service),
    current_user = Depends(deps.get_current_active_admin)
):
    supplier = svc.get_supplier(id)
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return svc.link_product_to_supplier(id, data)

@router.delete("/{id}/products/{product_id}")
def unlink_product_from_supplier(
    id: uuid.UUID,
    product_id: uuid.UUID,
    svc: SupplierService = Depends(get_supplier_service),
    current_user = Depends(deps.get_current_active_admin)
):
    if not svc.unlink_product_from_supplier(id, product_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    return {"status": "success"}

@router.get("/products/{product_id}", response_model=List[ProductSupplier])
def get_product_suppliers(
    product_id: uuid.UUID,
    svc: SupplierService = Depends(get_supplier_service),
    current_user = Depends(deps.get_current_active_user)
):
    return svc.get_suppliers_for_product(product_id)
