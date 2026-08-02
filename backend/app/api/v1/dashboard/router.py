from datetime import datetime, date, time
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import uuid

from app.api.deps import get_db, get_current_active_admin
from app.models.order import Order, OrderItem
from app.models.invoice import Invoice
from app.models.customer import Customer
from app.models.product import Product

router = APIRouter()


class TopProductStat(BaseModel):
    id: str
    name: str
    category: str
    total_quantity: float
    unit: str


class DashboardStatsResponse(BaseModel):
    orders_today: int
    revenue_today: float
    total_orders: int
    total_revenue: float
    total_receivables: float
    active_customers: int
    total_products: int
    top_products: List[TopProductStat]


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_admin)
):
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)

    # 1. Orders today & total orders
    orders_today = db.query(Order).filter(
        Order.created_at >= today_start,
        Order.created_at <= today_end
    ).count()
    total_orders = db.query(Order).count()

    # 2. Revenue today & total revenue
    today_invoices = db.query(Invoice).filter(
        Invoice.created_at >= today_start,
        Invoice.created_at <= today_end
    ).all()
    revenue_today = float(sum(inv.grand_total for inv in today_invoices))

    all_invoices = db.query(Invoice).all()
    total_revenue = float(sum(inv.grand_total for inv in all_invoices))

    # 3. Total outstanding receivables
    unpaid_invoices = db.query(Invoice).filter(Invoice.payment_status != "Paid").all()
    total_receivables = float(sum(inv.balance_due for inv in unpaid_invoices))

    # 4. Active customers
    active_customers = db.query(Customer).filter(Customer.is_active == True).count()

    # 5. Total active products
    total_products = db.query(Product).filter(Product.is_active == True).count()

    # 6. Top selling products
    order_items = db.query(OrderItem).all()
    product_totals: Dict[str, float] = {}
    for item in order_items:
        pid = str(item.product_id)
        product_totals[pid] = product_totals.get(pid, 0.0) + float(item.quantity)

    # Sort top 5 products
    sorted_pids = sorted(product_totals.items(), key=lambda x: x[1], reverse=True)[:5]
    top_products = []
    
    if sorted_pids:
        top_product_ids = [uuid.UUID(pid) for pid, _ in sorted_pids]
        products = db.query(Product).filter(Product.id.in_(top_product_ids)).all()
        product_map = {str(p.id): p for p in products}

        for pid, qty in sorted_pids:
            product = product_map.get(pid)
            if product:
                top_products.append(
                    TopProductStat(
                        id=str(product.id),
                        name=product.name,
                        category=product.category or "General",
                        total_quantity=round(qty, 2),
                        unit=product.unit or "KG"
                    )
                )

    return DashboardStatsResponse(
        orders_today=orders_today,
        revenue_today=round(revenue_today, 2),
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        total_receivables=round(total_receivables, 2),
        active_customers=active_customers,
        total_products=total_products,
        top_products=top_products
    )
