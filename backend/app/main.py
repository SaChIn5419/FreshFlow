from fastapi import FastAPI
from app.core.config import settings
from app.api.auth.router import router as auth_router
from app.api.customers.router import router as customers_router
from app.api.products.router import router as products_router
from app.api.orders.router import router as orders_router
from app.api.invoices.router import router as invoices_router
from app.api.reports.router import router as reports_router

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(customers_router, prefix="/customers", tags=["customers"])
app.include_router(products_router, prefix="/products", tags=["products"])
app.include_router(orders_router, prefix="/orders", tags=["orders"])
app.include_router(invoices_router, prefix="/invoices", tags=["invoices"])
app.include_router(reports_router, prefix="/reports", tags=["reports"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Wholesale Vegetable API"}
