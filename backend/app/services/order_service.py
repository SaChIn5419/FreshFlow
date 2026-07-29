import uuid
from typing import List
from app.repositories import OrderRepository, ProductRepository
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate
from app.services.audit_service import AuditService

class OrderService:
    def __init__(self, order_repo: OrderRepository, product_repo: ProductRepository):
        self.order_repo = order_repo
        self.product_repo = product_repo

    def get_order(self, id: uuid.UUID) -> Order | None:
        return self.order_repo.get_by_id(id)

    def get_all_orders(self) -> List[Order]:
        return self.order_repo.get_all()
        
    def get_orders_by_customer(self, customer_id: uuid.UUID) -> List[Order]:
        return self.order_repo.get_by_customer(customer_id)

    def create_order(self, data: OrderCreate, user_id: str) -> Order:
        if data.request_id:
            existing = self.order_repo.get_by_request_id(data.request_id)
            if existing:
                return existing

        order = Order(
            customer_id=data.customer_id,
            request_id=data.request_id,
            remarks=data.remarks,
            status=data.status,
            payment_status=data.payment_status
        )
        
        # Smart duplication prevention: merge items with duplicate product_ids
        merged_items = {}
        for item_data in data.items:
            pid = item_data.product_id
            if pid in merged_items:
                merged_items[pid]["quantity"] += item_data.quantity
            else:
                merged_items[pid] = {
                    "quantity": item_data.quantity,
                    "unit": item_data.unit
                }

        for pid, val in merged_items.items():
            product = self.product_repo.get_by_id(pid)
            if not product:
                raise ValueError(f"Product {pid} not found")
            
            order.items.append(OrderItem(
                product_id=pid,
                quantity=val["quantity"],
                unit=val["unit"]
            ))
        from sqlalchemy.exc import IntegrityError
        try:
            created_order = self.order_repo.create(order)
        except IntegrityError:
            if data.request_id:
                existing = self.order_repo.get_by_request_id(data.request_id)
                if existing:
                    return existing
            raise

        AuditService.log_action(
            db=self.order_repo.db,
            user_id=user_id,
            action="CREATED_ORDER",
            entity_type="ORDER",
            entity_id=str(created_order.id),
            details=f"Created order with {len(merged_items)} unique products"
        )
        return created_order

    def update_order_status(self, id: uuid.UUID, status: str, user_id: str) -> Order | None:
        order = self.order_repo.get_by_id(id)
        if not order:
            return None
        updated_order = self.order_repo.update_status(order, status)
        AuditService.log_action(
            db=self.order_repo.db,
            user_id=user_id,
            action="UPDATED_ORDER_STATUS",
            entity_type="ORDER",
            entity_id=str(updated_order.id),
            details=f"Updated order status to {status}"
        )
        return updated_order

    def update_item_price(self, order_id: uuid.UUID, item_id: uuid.UUID, price: float, user_id: str) -> Order | None:
        order = self.order_repo.get_by_id(order_id)
        if not order:
            return None
            
        item = next((i for i in order.items if i.id == item_id), None)
        if not item:
            raise ValueError("Item not found in order")
            
        item.unit_price = price
        updated_order = self.order_repo.update(order)
        
        # We might not want to spam the audit log for every single keystroke if autosaving,
        # but since this is an explicit save, it's okay for now, or we can just log a bulk event later.
        # For now, let's keep it simple.
        
        return updated_order
