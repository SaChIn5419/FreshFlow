import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.schemas.customer import Customer, CustomerCreate, CustomerUpdate
from app.services import CustomerService
from app.repositories import CustomerRepository, UserRepository, ProductRepository
from app.core.exceptions import CustomerNotFound
from app.api.v1.customers.templates.router import router as templates_router

router = APIRouter()
router.include_router(templates_router, prefix="")

def get_customer_service(db: Session = Depends(deps.get_db)) -> CustomerService:
    repo = CustomerRepository(db)
    user_repo = UserRepository(db)
    product_repo = ProductRepository(db)
    return CustomerService(repo, user_repo, product_repo)

@router.get("/", response_model=List[Customer])
def read_customers(
    svc: CustomerService = Depends(get_customer_service),
    current_user = Depends(deps.get_current_active_user)
):
    return svc.get_all_customers()

@router.post("/", response_model=Customer)
def create_customer(
    data: CustomerCreate,
    svc: CustomerService = Depends(get_customer_service),
    current_user = Depends(deps.get_current_active_admin)
):
    return svc.create_customer(data)

@router.get("/{id}", response_model=Customer)
def read_customer(
    id: uuid.UUID,
    svc: CustomerService = Depends(get_customer_service),
    current_user = Depends(deps.get_current_active_user)
):
    customer = svc.get_customer(id)
    if not customer:
        raise CustomerNotFound()
    return customer

@router.put("/{id}", response_model=Customer)
def update_customer(
    id: uuid.UUID,
    data: CustomerUpdate,
    svc: CustomerService = Depends(get_customer_service),
    current_user = Depends(deps.get_current_active_admin)
):
    customer = svc.update_customer(id, data)
    if not customer:
        raise CustomerNotFound()
    return customer

@router.delete("/{id}")
def deactivate_customer(
    id: uuid.UUID,
    svc: CustomerService = Depends(get_customer_service),
    current_user = Depends(deps.get_current_active_admin)
):
    if not svc.deactivate_customer(id):
        raise CustomerNotFound()
    return {"status": "success"}

from app.models.invoice import Invoice, InvoiceItem
from sqlalchemy import desc

@router.get("/{id}/prices")
def get_customer_latest_prices(
    id: uuid.UUID,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
):
    # Find latest invoice for this customer
    # For each product, get the latest unit_price they were charged.
    # Group by product_id or just get latest invoice items.
    
    # Efficient approach: get all invoices for customer, sort by date desc, 
    # collect first price found for each product name.
    invoices = db.query(Invoice).filter(Invoice.customer_id == id).order_by(desc(Invoice.created_at)).all()
    
    prices = {}
    for inv in invoices:
        for item in inv.items:
            prod_name = item.product_name
            if prod_name not in prices:
                prices[prod_name] = float(item.unit_price)
    
    return prices

