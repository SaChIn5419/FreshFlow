import uuid
from typing import List, Optional
from decimal import Decimal
from datetime import date
from sqlalchemy.orm import Session
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.order import Order, OrderStatus
from app.models.supplier import Supplier, ProductSupplier
from app.models.stock_ledger import StockLedger
from app.repositories.purchase_order_repository import PurchaseOrderRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.supplier_repository import SupplierRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderItemUpdate


class PurchaseOrderService:
    def __init__(self, db: Session):
        self.db = db
        self.po_repo = PurchaseOrderRepository(db)
        self.order_repo = OrderRepository(db)
        self.supplier_repo = SupplierRepository(db)
        self.product_repo = ProductRepository(db)

    def get_purchase_order(self, id: uuid.UUID) -> Optional[PurchaseOrder]:
        return self.po_repo.get_by_id(id)

    def get_all_purchase_orders(self) -> List[PurchaseOrder]:
        return self.po_repo.get_all()

    def get_purchase_orders_by_order(self, order_id: uuid.UUID) -> List[PurchaseOrder]:
        return self.po_repo.get_by_order(order_id)

    def get_purchase_orders_by_supplier(self, supplier_id: uuid.UUID) -> List[PurchaseOrder]:
        return self.po_repo.get_by_supplier(supplier_id)

    def create_purchase_order(self, data: PurchaseOrderCreate) -> PurchaseOrder:
        po = PurchaseOrder(
            supplier_id=data.supplier_id,
            triggered_by_order_id=data.triggered_by_order_id,
            expected_delivery=data.expected_delivery,
            status=PurchaseOrderStatus.DRAFT.value,
            total_cost=Decimal("0.00")
        )
        return self.po_repo.create(po)

    def update_purchase_order(self, id: uuid.UUID, data: PurchaseOrderUpdate) -> Optional[PurchaseOrder]:
        po = self.po_repo.get_by_id(id)
        if not po:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(po, key, val)
            
        return self.po_repo.update(po)

    def update_po_item(self, item_id: uuid.UUID, data: PurchaseOrderItemUpdate) -> Optional[PurchaseOrderItem]:
        item = self.po_repo.get_item_by_id(item_id)
        if not item:
            return None
            
        prev_qty = item.quantity_received or Decimal("0.00")
        
        if data.quantity_received is not None:
            item.quantity_received = data.quantity_received
        if data.is_received is not None:
            item.is_received = data.is_received
            
        updated = self.po_repo.update_item(item)

        # Automatically increment product stock by newly received quantity delta
        new_qty = item.quantity_received or Decimal("0.00")
        delta = new_qty - prev_qty
        if delta != 0:
            product = self.product_repo.get_by_id(item.product_id)
            if product:
                ledger_entry = StockLedger(
                    product_id=item.product_id,
                    quantity_change=delta,
                    reference_type="PO_RECEIPT",
                    reference_id=po.id if po else item.purchase_order_id,
                )
                self.db.add(ledger_entry)

                product.stock_quantity = (product.stock_quantity or Decimal("0.00")) + delta
                self.product_repo.update(product)
        
        # Check if all items in the PO are received
        po = self.po_repo.get_by_id(item.purchase_order_id)
        if po:
            all_received = all(i.is_received for i in po.items)
            any_received = any(i.is_received for i in po.items)
            if all_received:
                po.status = PurchaseOrderStatus.RECEIVED.value
            elif any_received:
                po.status = PurchaseOrderStatus.PARTIALLY_RECEIVED.value
            self.po_repo.update(po)
            
        return updated

    def get_or_create_unassigned_supplier(self) -> Supplier:
        suppliers, _ = self.supplier_repo.get_all(skip=0, limit=10000)
        for s in suppliers:
            if s.name == "Unassigned Products":
                return s
        
        # Create it
        unassigned = Supplier(
            name="Unassigned Products",
            notes="Placeholder for products without a primary supplier"
        )
        return self.supplier_repo.create(unassigned)

    def generate_purchase_orders_for_order(self, order_id: uuid.UUID) -> List[PurchaseOrder]:
        # 1. Fetch Order and items
        order = self.order_repo.get_by_id(order_id)
        if not order:
            raise ValueError("Order not found")

        # Delete existing POs triggered by this order to avoid duplicates on regeneration
        existing_pos = self.po_repo.get_by_order(order_id)
        for po in existing_pos:
            self.db.delete(po)
        self.db.commit()

        # 2. Group order items by supplier
        supplier_items = {}  # supplier_id -> list of (OrderItem, cost_price)
        
        for item in order.items:
            # Find primary supplier for this product
            product_supplier = self.supplier_repo.get_primary_supplier_for_product(item.product_id)
            if product_supplier:
                sup_id = product_supplier.supplier_id
                cost_price = product_supplier.cost_price
            else:
                # Assign to unassigned placeholder
                unassigned_sup = self.get_or_create_unassigned_supplier()
                sup_id = unassigned_sup.id
                # Fallback to product default price or 0.00
                cost_price = item.product.default_price or Decimal("0.00")

            if sup_id not in supplier_items:
                supplier_items[sup_id] = []
            supplier_items[sup_id].append((item, cost_price))

        generated_pos = []

        # 3. Create a PO for each supplier
        for sup_id, items_list in supplier_items.items():
            supplier = self.supplier_repo.get_by_id(sup_id)
            if not supplier:
                continue

            po = PurchaseOrder(
                supplier_id=sup_id,
                triggered_by_order_id=order_id,
                status=PurchaseOrderStatus.DRAFT.value,
                expected_delivery=order.expected_delivery_date or date.today(),
                total_cost=Decimal("0.00")
            )
            self.db.add(po)
            self.db.flush()  # Get PO ID

            total_cost = Decimal("0.00")
            po_items = []

            for order_item, cost_price in items_list:
                item_cost = order_item.quantity * cost_price
                total_cost += item_cost

                po_item = PurchaseOrderItem(
                    purchase_order_id=po.id,
                    product_id=order_item.product_id,
                    quantity_ordered=order_item.quantity,
                    unit=order_item.unit,
                    cost_price_at_time=cost_price,
                    quantity_received=Decimal("0.00"),
                    is_received=False
                )
                self.db.add(po_item)
                po_items.append(po_item)

            po.total_cost = total_cost
            po.items = po_items
            
            # Generate pre-formatted WhatsApp text
            po.whatsapp_message_text = self.generate_whatsapp_text(po, order.customer.restaurant_name)
            self.po_repo.create(po)
            generated_pos.append(po)

        # Update order status to Purchased if it was Submitted
        if order.status == OrderStatus.SUBMITTED.value:
            order.status = OrderStatus.PURCHASED.value
            self.order_repo.update(order)

        return generated_pos

    def generate_whatsapp_text(self, po: PurchaseOrder, restaurant_name: str) -> str:
        supplier_name = po.supplier.name
        delivery_date_str = po.expected_delivery.strftime("%d %b") if po.expected_delivery else "Today"

        lines = [
            f"🟢 *{supplier_name} — Order for FreshFlow*",
            f"Restaurant: {restaurant_name}",
            f"Delivery Date: {delivery_date_str}",
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ]

        for item in po.items:
            # We need to make sure the product name is loaded. Since we did db.add(), it's in the session.
            # Let's retrieve product name using product repository if it is not populated
            product_name = item.product.name if item.product else "Unknown Product"
            if product_name == "Unknown Product":
                product = self.product_repo.get_by_id(item.product_id)
                if product:
                    product_name = product.name
            
            # Format quantity (e.g. 5 or 5.5 depending on decimal)
            qty = float(item.quantity_ordered)
            qty_str = f"{qty:g}" # Format without trailing zeroes
            lines.append(f"• {product_name} — {qty_str} {item.unit}")

        lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        lines.append("Please confirm receipt of this order. Thank you!")
        
        return "\n".join(lines)
