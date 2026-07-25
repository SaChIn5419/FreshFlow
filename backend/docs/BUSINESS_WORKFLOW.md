# FreshFlow Business Workflow

This document outlines the core business lifecycle for wholesale vegetable procurement, from the moment a customer logs in to the final payment. This operational flow dictates the state machine of the `Order` and `Invoice` entities.

## 1. Restaurant Logs In
- Customers (Restaurants) authenticate and receive a JWT token.
- They are presented with a product catalog.
- **Customization:** Certain products are displayed first based on their `CustomerProduct` preferences (favorites/display order).

## 2. Creates Order
- The customer selects items, units, and quantities.
- The order is saved with `status = "Draft"` initially, then moved to `status = "Submitted"` once finalized by the customer.

## 3. Admin Reviews
- The Admin logs into the system and reviews submitted orders.
- Admin checks inventory or procurement feasibility.
- Admin changes the status to `status = "Reviewed"`.

## 4. Price Edit
- Since vegetable prices fluctuate daily, the Admin edits the final prices for the items before generating an invoice.
- Any remarks or quantity adjustments are also made during this phase.

## 5. Invoice Generation
- The Admin locks the prices and generates the invoice.
- The Order status changes to `status = "Invoice Generated"`.
- An `Invoice` entity is created, locking in the `grand_total`, `gst`, and `subtotal`.
- A PDF is generated (via `PDFService`) and stored in `uploads/orders/YYYY/MM/customer_name/`.

## 6. Packing
- The physical goods are picked and packed based on the locked Invoice quantities.
- Order status changes to `status = "Packed"`.

## 7. Delivery
- The goods are dispatched.
- Upon successful delivery to the restaurant, Order status changes to `status = "Delivered"`.

## 8. Payment
- Payment is collected (immediate or credit based on the customer's `credit_days`).
- The Order `payment_status` is updated from `Pending` -> `Partially Paid` -> `Paid`.
- Order status changes to `status = "Completed"`.
