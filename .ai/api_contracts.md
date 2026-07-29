# FreshFlow API Contracts & Route Specifications

All API routes are prefixed under `/api/v1`.

---

## 1. Authentication Endpoints (`/api/v1/auth`)

| Endpoint | Method | Rate Limit | Description |
| :--- | :--- | :--- | :--- |
| `/auth/login` | `POST` | `5/minute` | Authenticates credentials, sets `access_token` and `refresh_token` HttpOnly cookies. |
| `/auth/refresh` | `POST` | — | Reads refresh cookie, rotates refresh token, and updates cookies. |
| `/auth/logout` | `POST` | — | Revokes refresh token in DB and clears auth cookies. |
| `/auth/me` | `GET` | — | Returns current authenticated user profile. |

---

## 2. Order Management (`/api/v1/orders`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/orders/` | `GET` | All | Lists orders (all orders for `ADMIN`, customer-scoped for `CUSTOMER`). |
| `/orders/` | `POST` | All | Creates order idempotently using `request_id`. |
| `/orders/{id}` | `GET` | All | Fetches specific order details. |
| `/orders/{id}/packing-slip` | `GET` | All | Renders HTML packing slip. |
| `/orders/{id}/packing-slip/pdf` | `GET` | All | Downloads PDF packing slip. |
| `/orders/{id}/status` | `POST` | `ADMIN` | Updates order workflow status. |
| `/orders/{id}/generate-purchase-orders` | `POST` | `ADMIN` | Generates supplier POs from order. |

---

## 3. Invoicing & Billing (`/api/v1/invoices`)

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/invoices/` | `GET` | All | Lists invoices. |
| `/invoices/generate` | `POST` | `ADMIN` | Generates B2B invoice from completed order. |
| `/invoices/{id}/preview` | `GET` | All | Renders HTML invoice preview. |
| `/invoices/{id}/pdf` | `GET` | All | Downloads B2B PDF invoice. |
