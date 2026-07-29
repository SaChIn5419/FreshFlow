# Finance & Invoicing Developer Skill

## Invoicing & Credit Rules
1. **Invoice Numbering**: Sequential format `INV-YYYY-XXXXX` managed in `Settings` counter.
2. **Customer Overrides**: Invoice calculations MUST check `CustomerProduct` price before falling back to `Product.default_price`.
3. **GST Calculation**: Exempt fresh produce (0% GST). Apply category GST for processed items.
4. **Credit Checks**: Validate customer `credit_limit` and `payment_terms_days` against outstanding unpaid invoices.
