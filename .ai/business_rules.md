# FreshFlow Business Rules & Domain Logic

This document specifies the core domain rules governing pricing, customer credit, purchase orders, packing lists, and GST calculations in **FreshFlow**.

---

## 1. Pricing & Customer Overrides

1. **Base Price vs. Customer Custom Price**:
   - Each product has a default price (`Product.default_price`).
   - Customers can have custom negotiated prices stored in `CustomerProduct` table (`customer_id`, `product_id`, `custom_price`).
   - When generating an invoice or order calculation, if a `CustomerProduct` price exists, it **overrides** `Product.default_price`.

2. **Unit Conversion**:
   - Supported standard units: `KG`, `GRAM`, `BUNDLE`, `CRATE`, `PIECE`, `BOX`, `BAG`.
   - Prices are stored per standard base unit (`KG` or `PIECE`).

---

## 2. Customer Credit & Payment Terms

1. **Credit Limits & Credit Days**:
   - Each customer record has `credit_limit` (numeric amount in INR) and `payment_terms_days` (integer days, e.g. 7, 14, 30 days).
   - Outstanding balance = sum of unpaid invoice totals - sum of pending payments.
   - If outstanding balance exceeds `credit_limit`, admin warning alerts are raised during order submission.

---

## 3. Automated Purchase Order (PO) Generation

1. **Primary Supplier Mapping**:
   - Each product can have multiple suppliers (`ProductSupplier`), with one supplier marked as `is_primary = True`.
2. **Bulk Order Aggregation**:
   - When an order reaches status `REVIEWED` or `PURCHASED`, calling `POST /api/v1/orders/{id}/generate-purchase-orders` aggregates order items by primary supplier.
   - A distinct `PurchaseOrder` is created per primary supplier, populated with `PurchaseOrderItem` rows.

---

## 4. Invoicing & Tax Calculations

1. **Invoice Numbering**:
   - Invoices follow sequential numbering `INV-YYYY-XXXXX` managed by `Settings` counter.
2. **GST Calculation**:
   - Fresh vegetables are exempted (0% GST). Packaged/processed goods are subject to standard 5% or 12% GST as defined by product category.
