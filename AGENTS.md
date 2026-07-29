# FreshFlow System Constitution & AI Agent Instructions (`AGENTS.md`)

This document serves as the authoritative, non-negotiable constitution for AI agents and developer tools working on the **FreshFlow** B2B procurement repository.

---

## 1. System Identity & Architecture Overview

**FreshFlow** (formerly Opalessence) is a production-grade B2B wholesale vegetable procurement system serving restaurants, hotels, and institutional buyers.

- **Backend Architecture**: Python 3.13 + FastAPI + SQLAlchemy 2.0 (SQLite local / PostgreSQL production) + Pydantic V2 + Alembic.
- **Frontend Architecture**: Next.js 15 App Router + React 19 + TypeScript + TailwindCSS + Axios + React Query (TanStack) + Lucide Icons + Shadcn UI + Sonner.

---

## 2. Non-Negotiable System Principles & Security Requirements

### A. Authentication & Session Security (Cookie-Based)
1. **HttpOnly Cookie Auth Only**: Never store JWT tokens, access tokens, or refresh tokens in `localStorage` or `sessionStorage`. All auth state is managed via `HttpOnly`, `SameSite=Lax`, `Secure` browser cookies (`access_token` 15 min, `refresh_token` 7 days).
2. **Production Secret Key Protection**: Server startup **must abort (`sys.exit`)** in non-dev environments (`ENV != "dev"`) if `SECRET_KEY` is set to default fallback strings.
3. **Login Rate Limiting**: All authentication login endpoints (`POST /api/v1/auth/login`) MUST be protected by `@limiter.limit("5/minute")` via `slowapi`.
4. **CSRF Protection**: All mutating HTTP requests (`POST`, `PUT`, `DELETE`, `PATCH`) MUST include the custom header `X-Requested-With: FreshFlow`.
5. **Security Headers**: Every HTTP response MUST include security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'self'`, `Referrer-Policy: strict-origin-when-cross-origin`).
6. **File Upload Guards**: PDF upload endpoints MUST enforce a 10MB maximum payload limit via stream-chunking and verify `%PDF` magic bytes prior to processing.

### B. Reliability, Database & Resilience Guardrails
1. **Idempotent Order Creation**: Orders MUST require or accept a client-generated `request_id` (UUID). The backend MUST check for pre-existing `request_id` records and handle DB `IntegrityError` collisions gracefully by returning the existing order instead of failing with HTTP 500.
2. **Database Outage Fail-Safe**: Catch SQLAlchemy `OperationalError`, `DatabaseError`, `DBAPIError`, and `DisconnectionError` at the API boundary, returning a clean `HTTP 503 Service Unavailable` JSON response.
3. **N+1 Query Prevention**: Always specify `joinedload` for single relations (`Order.customer`, `Invoice.customer`, `Invoice.order`) and `selectinload` for collection relations (`Order.items`, `Invoice.items`, `Order.files`).

### C. Type Safety & Testing Standard
1. **Frontend Zero-Error Constraint**: Every frontend edit MUST pass `npx tsc --noEmit` with 0 errors.
2. **Backend Automated Testing**: Every backend route/service edit MUST maintain 100% test pass rate on `PYTHONPATH=. .venv/bin/pytest`.

---

## 3. Core Directory Layout

```text
FreshFlow/
├── AGENTS.md                  # Root AI System Constitution
├── CLAUDE.md                  # Claude / AI Assistant Rules & Shortcuts
├── .ai/                       # AI Agent Skill Docs & Domain Knowledge
│   ├── business_rules.md      # Pricing, credit limits, GST & PO logic
│   ├── architecture.md        # DB schemas, models, and data flows
│   ├── api_contracts.md       # API routes and request/response contracts
│   ├── maintenance.md         # Maintenance playbook & feature updates
│   └── skills/                # Domain-specific developer skills
│       ├── security.md
│       ├── fullstack.md
│       ├── finance.md
│       ├── wholesale_ops.md
│       └── qa.md
├── backend/                   # FastAPI Backend
│   ├── app/
│   │   ├── api/               # API endpoints & routers
│   │   ├── core/              # Config, security, exception handlers
│   │   ├── models/            # SQLAlchemy database models
│   │   ├── repositories/      # Data access layer
│   │   ├── schemas/           # Pydantic validation schemas
│   │   └── services/          # Business logic services
│   └── tests/                 # Pytest automated test suite
└── frontend/                  # Next.js 15 Frontend
    ├── app/                   # App Router pages & API services
    ├── components/            # UI components (Shadcn, Badge, ErrorBoundary)
    └── lib/                   # Axios client & helpers
```
