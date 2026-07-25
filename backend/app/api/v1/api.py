from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.customers import router as customers_router
from app.api.v1.products import router as products_router
from app.api.v1.orders import router as orders_router
from app.api.v1.invoices import router as invoices_router
from app.api.v1.settings import router as settings_router
from app.api.v1.suppliers import router as suppliers_router
from app.api.v1.purchase_orders import router as purchase_orders_router
from app.api.v1.packing import router as packing_router
from app.api.v1.finance import router as finance_router
from app.api.v1.audit import router as audit_router

api_router = APIRouter()
api_router.include_router(auth_router.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(customers_router.router, prefix="/customers", tags=["Customers"])
api_router.include_router(products_router.router, prefix="/products", tags=["Products"])
api_router.include_router(orders_router.router, prefix="/orders", tags=["Orders"])
api_router.include_router(invoices_router.router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(settings_router.router, prefix="/settings", tags=["Settings"])
api_router.include_router(suppliers_router.router, prefix="/suppliers", tags=["Suppliers"])
api_router.include_router(purchase_orders_router.router, prefix="/purchase-orders", tags=["Purchase Orders"])
api_router.include_router(packing_router.router, prefix="/packing", tags=["Packing Lists"])
api_router.include_router(finance_router.router, prefix="/finance", tags=["Finance"])
api_router.include_router(audit_router.router, prefix="/audit-logs", tags=["Audit Logs"])
