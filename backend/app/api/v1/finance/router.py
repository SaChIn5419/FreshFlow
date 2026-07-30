from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.finance import (
    CustomerPaymentCreate,
    CustomerPaymentResponse,
    SupplierPaymentCreate,
    SupplierPaymentResponse,
    ProfitabilityMetrics,
)
from app.schemas.pagination import PaginatedResponse
from app.services.finance_service import FinanceService

router = APIRouter()


def get_finance_service(db: Session = Depends(get_db)) -> FinanceService:
    return FinanceService(db)


@router.post("/customer-payments", response_model=CustomerPaymentResponse)
def record_customer_payment(
    payment_in: CustomerPaymentCreate,
    svc: FinanceService = Depends(get_finance_service),
    current_user: User = Depends(get_current_user),
):
    return FinanceService.record_customer_payment(svc.db, payment_in, str(current_user.id))


@router.get("/customer-payments", response_model=PaginatedResponse[CustomerPaymentResponse])
def get_customer_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    svc: FinanceService = Depends(get_finance_service),
    current_user: User = Depends(get_current_user),
):
    return svc.get_customer_payments(skip=skip, limit=limit)


@router.post("/supplier-payments", response_model=SupplierPaymentResponse)
def record_supplier_payment(
    payment_in: SupplierPaymentCreate,
    svc: FinanceService = Depends(get_finance_service),
    current_user: User = Depends(get_current_user),
):
    return FinanceService.record_supplier_payment(svc.db, payment_in, str(current_user.id))


@router.get("/supplier-payments", response_model=PaginatedResponse[SupplierPaymentResponse])
def get_supplier_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    svc: FinanceService = Depends(get_finance_service),
    current_user: User = Depends(get_current_user),
):
    return svc.get_supplier_payments(skip=skip, limit=limit)


@router.get("/profit", response_model=ProfitabilityMetrics)
def get_profitability_metrics(
    svc: FinanceService = Depends(get_finance_service),
    current_user: User = Depends(get_current_user),
):
    return FinanceService.get_profitability(svc.db)
