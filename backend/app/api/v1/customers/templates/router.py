import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.customer_product_template import TemplateAssign, TemplateItem
from app.services.customer_product_template_service import CustomerProductTemplateService
from app.repositories.customer_product_template_repository import CustomerProductTemplateRepository
from app.repositories import CustomerRepository, ProductRepository
from app.core.exceptions import ProductNotFound

router = APIRouter()


def get_template_service(db: Session = Depends(deps.get_db)) -> CustomerProductTemplateService:
    return CustomerProductTemplateService(
        template_repo=CustomerProductTemplateRepository(db),
        customer_repo=CustomerRepository(db),
        product_repo=ProductRepository(db),
    )


@router.get("/{customer_id}/templates", response_model=List[TemplateItem], tags=["Customers"])
def get_customer_templates(
    customer_id: uuid.UUID,
    svc: CustomerProductTemplateService = Depends(get_template_service),
    current_user=Depends(deps.get_current_active_user),
):
    """Get the curated product list for a customer (what they see on the order form)."""
    return svc.get_template(customer_id)


@router.post("/{customer_id}/templates", response_model=TemplateItem, tags=["Customers"])
def assign_product_to_template(
    customer_id: uuid.UUID,
    data: TemplateAssign,
    svc: CustomerProductTemplateService = Depends(get_template_service),
    current_user=Depends(deps.get_current_active_admin),
):
    """Assign a product to a customer's order template."""
    return svc.assign_product(customer_id, data.product_id, data.sort_order)


@router.delete("/{customer_id}/templates/{product_id}", tags=["Customers"])
def remove_product_from_template(
    customer_id: uuid.UUID,
    product_id: uuid.UUID,
    svc: CustomerProductTemplateService = Depends(get_template_service),
    current_user=Depends(deps.get_current_active_admin),
):
    """Remove a product from a customer's order template."""
    if not svc.remove_product(customer_id, product_id):
        raise ProductNotFound()
    return {"status": "removed"}
