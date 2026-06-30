import os
from datetime import datetime
from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy.orm import Session
from weasyprint import HTML

from app.models.order import Order, OrderStatus
from app.models.invoice import Invoice, InvoiceItem
from app.models.customer import Customer

INVOICE_DIR = "app/uploads/invoices/"
PACKING_DIR = "app/uploads/packing/"
os.makedirs(INVOICE_DIR, exist_ok=True)
os.makedirs(PACKING_DIR, exist_ok=True)


def generate_html_invoice(invoice: Invoice, customer: Customer, items: list) -> str:
    html = f"""
    <html>
        <head><style>body {{ font-family: sans-serif; }} table {{ width: 100%; border-collapse: collapse; }} th, td {{ border: 1px solid #ddd; padding: 8px; }} </style></head>
        <body>
            <h1>Invoice: {invoice.invoice_number}</h1>
            <p>Date: {invoice.created_at.strftime('%Y-%m-%d')}</p>
            <p>Customer: {customer.restaurant_name}</p>
            <p>GST: {customer.gst_number}</p>
            <table>
                <tr><th>Product</th><th>Quantity</th><th>Unit Price</th><th>GST</th><th>Total</th></tr>
    """
    for item in items:
        html += f"<tr><td>{item.product_name}</td><td>{item.quantity}</td><td>{item.unit_price}</td><td>{item.gst}</td><td>{item.total}</td></tr>"
    html += f"""
            </table>
            <h3>Subtotal: {invoice.subtotal}</h3>
            <h3>GST: {invoice.gst}</h3>
            <h2>Grand Total: {invoice.grand_total}</h2>
        </body>
    </html>
    """
    return html


def generate_html_packing_slip(order: Order, customer: Customer) -> str:
    html = f"""
    <html>
        <head><style>body {{ font-family: sans-serif; }} table {{ width: 100%; border-collapse: collapse; }} th, td {{ border: 1px solid #ddd; padding: 8px; }} </style></head>
        <body>
            <h1>Packing Slip (Order ID: {order.id})</h1>
            <p>Customer: {customer.restaurant_name}</p>
            <table>
                <tr><th>Product</th><th>Quantity</th><th>Unit</th></tr>
    """
    for item in order.items:
        html += f"<tr><td>{item.product.name}</td><td>{item.quantity}</td><td>{item.unit}</td></tr>"
    html += """
            </table>
        </body>
    </html>
    """
    return html


def create_invoice_from_order(db: Session, order_id: int):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status in [
        OrderStatus.INVOICE_GENERATED.value,
        OrderStatus.COMPLETED.value,
    ]:
        raise HTTPException(
            status_code=400, detail="Invoice already generated for this order"
        )

    customer = order.customer
    subtotal = Decimal("0.0")

    invoice_items = []

    for item in order.items:
        product = item.product
        # Using default_price if no specific price was set dynamically
        price = product.default_price or Decimal("0.0")
        qty = item.quantity
        item_total = price * qty
        subtotal += item_total

        # Simple GST calculation logic, configurable later
        gst = item_total * Decimal("0.05")  # 5% GST assume

        inv_item = InvoiceItem(
            product_name=product.name,
            quantity=qty,
            unit_price=price,
            gst=gst,
            total=item_total + gst,
        )
        invoice_items.append(inv_item)

    total_gst = sum(item.gst for item in invoice_items)
    grand_total = subtotal + total_gst

    invoice_number = f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}-{order.id}"

    invoice = Invoice(
        invoice_number=invoice_number,
        order_id=order.id,
        customer_id=customer.id,
        subtotal=subtotal,
        gst=total_gst,
        grand_total=grand_total,
        status="Generated",
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    for inv_item in invoice_items:
        inv_item.invoice_id = invoice.id
        db.add(inv_item)

    order.status = OrderStatus.INVOICE_GENERATED.value
    db.add(order)
    db.commit()
    db.refresh(invoice)

    # Generate PDFs
    inv_html = generate_html_invoice(invoice, customer, invoice_items)
    pack_html = generate_html_packing_slip(order, customer)

    inv_path = os.path.join(INVOICE_DIR, f"{invoice_number}.pdf")
    pack_path = os.path.join(PACKING_DIR, f"PACK-{invoice_number}.pdf")

    HTML(string=inv_html).write_pdf(inv_path)
    HTML(string=pack_html).write_pdf(pack_path)

    return invoice
