# Fullstack Developer Skill & Rules

## Codebase Standards
1. **Frontend Zero-Error Constraint**: Every edit in `frontend/` MUST pass `npx tsc --noEmit` with 0 errors.
2. **Backend Test Constraint**: Every edit in `backend/` MUST pass `PYTHONPATH=. .venv/bin/pytest` with 100% passing tests.
3. **Axios Client**: Always use `apiClient` from `@/app/lib/axios` with `withCredentials: true` and `X-Requested-With: FreshFlow`.
4. **Idempotency**: Pass `request_id` (UUID) on order submission payloads. Backend handles `IntegrityError` collisions by returning existing order.
5. **UI/UX**: Use TailwindCSS, Lucide icons, Shadcn UI components, Sonner toasts, and wrap root layouts with `ErrorBoundary`.
