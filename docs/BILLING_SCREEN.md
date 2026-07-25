# Billing Screen Specification

> **This is the most important page in FreshFlow.**
> Your billing operator will stare at it 8 hours a day.
> Optimize for speed, not appearance.

---

## URL
`/admin/orders/[id]/billing`

## Layout
Full-width desktop table. No sidebars stealing horizontal space. Left nav collapses to icons only when on this page.

---

## Header
```
← Back to Orders     Stories Restobar — Billing          [Generate Invoice ▶]
                      Order #abc123 · 6 items · 30 Jun 2026
```

---

## The Table

| Column | Editable? | Notes |
|--------|-----------|-------|
| # | No | Row index |
| Product | No | From order |
| Qty | **Yes** | From order — editable |
| Unit | No | KG / Bunch etc. |
| Price (₹) | **Yes** | Empty by default — admin fills this |
| Total (₹) | No | Auto: Qty × Price, re-calculates on change |

### Rules:
- Price column starts **empty** — admin must type each price
- Total auto-updates on every keystroke (no save button needed for totals)
- Rows with no price entered show `—` in the Total column
- If ANY row has no price → "Generate Invoice" button is **disabled** with tooltip "Fill in all prices"

---

## Keyboard Navigation (Critical)

| Key | Action |
|-----|--------|
| `Enter` | Move focus to **Price** field of next row |
| `Tab` | Move to next editable cell (Qty → Price → next row Qty) |
| `Shift+Tab` | Move backwards |
| `↑` / `↓` | Move between Price cells vertically |
| `Escape` | Cancel edit, restore previous value |
| `Delete` | Clear current cell |

**Why this matters:** An admin processing 20 orders per day, each with 6 items, enters 120 prices. With proper keyboard nav, this takes 2 minutes. Without it — 10 minutes.

---

## Totals Section (Bottom Right)

```
                    Subtotal    ₹775.00
                    GST         ₹0.00
                    ──────────────────
                    Grand Total ₹775.00
```

- Updates live as prices are typed
- Grand Total in larger, bold text
- If subtotal is ₹0 (no prices filled), show totals as `—`

---

## Generate Invoice Button

- Appears TWICE: top-right (always visible) and bottom-right (after totals)
- **Disabled** (grayed out) if any price field is empty
- On click: POST to `/api/v1/invoices/` with current table data
- On success: Navigate to `/admin/invoices/[id]` (preview page)
- On error: Show inline toast "Failed to generate invoice: [error message]"

---

## Mark Delivered / Mark Paid

Below the table, two simple buttons:

```
[Mark as Delivered]    [Mark as Paid]
```

These update order status. No confirmation dialog. Just instant update with a toast.

---

## What This Page Does NOT Have

❌ No product search  
❌ No add/remove items  
❌ No discount fields  
❌ No notes section  
❌ No email button  
❌ No save draft button  

The order was placed. The admin only edits Qty and adds Prices. Then generates the invoice.

---

## Mobile

**Admin uses desktop only.** This page is not designed for mobile. If screen < 768px, show a banner: "Please use a desktop browser for billing."

---

## Component Breakdown

```
BillingPage
├── BillingHeader       (breadcrumb + order meta + top Generate button)
├── BillingTable        (the main editable table)
│   └── BillingRow[]    (each product row — handles keyboard nav)
├── BillingTotals       (live subtotal/GST/grand total)
└── BillingActions      (Generate Invoice + Mark Delivered/Paid)
```
