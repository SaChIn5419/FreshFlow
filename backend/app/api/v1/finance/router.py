from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.payment import Payment
from app.models.supplier_payment import SupplierPayment
from app.schemas.finance import CustomerPaymentCreate, CustomerPaymentResponse, SupplierPaymentCreate, SupplierPaymentResponse, ProfitabilityMetrics
from app.services.finance_service import FinanceService

router = APIRouter()

@router.post("/customer-payments", response_model=CustomerPaymentResponse)
def record_customer_payment(
    payment_in: CustomerPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return FinanceService.record_customer_payment(db, payment_in, str(current_user.id))

@router.get("/customer-payments", response_model=List[CustomerPaymentResponse])
def get_customer_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Payment).order_by(Payment.created_at.desc()).all()

@router.post("/supplier-payments", response_model=SupplierPaymentResponse)
def record_supplier_payment(
    payment_in: SupplierPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return FinanceService.record_supplier_payment(db, payment_in, str(current_user.id))

@router.get("/supplier-payments", response_model=List[SupplierPaymentResponse])
def get_supplier_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(SupplierPayment).order_by(SupplierPayment.created_at.desc()).all()

@router.get("/profit", response_model=ProfitabilityMetrics)
def get_profitability_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return FinanceService.get_profitability(db)
