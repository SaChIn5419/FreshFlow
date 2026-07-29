# FreshFlow Maintenance & Feature Playbook

This document defines standard operating procedures for recurring maintenance, feature updates, and schema migrations in **FreshFlow**.

---

## 1. Feature Addition Checklist

1. **Database Schema Changes**:
   - Add model class in `backend/app/models/`.
   - Export model in `backend/app/models/__init__.py`.
   - Ensure foreign keys include proper indexes and relationships use `joinedload` (single) or `selectinload` (collections).

2. **Backend API & Service Layer**:
   - Define Pydantic schema in `backend/app/schemas/`.
   - Add repository methods in `backend/app/repositories/`.
   - Implement business logic in `backend/app/services/`.
   - Add API router in `backend/app/api/v1/`.

3. **Frontend Integration**:
   - Define TypeScript interfaces in `frontend/app/services/`.
   - Use `apiClient` with `withCredentials: true` and `X-Requested-With: FreshFlow`.
   - Verify `npx tsc --noEmit` exits with 0 errors.

---

## 2. Automated Regression & Verification

```bash
# Backend Test Suite
cd backend && PYTHONPATH=. .venv/bin/pytest

# Frontend Type Check
cd frontend && npx tsc --noEmit
```
