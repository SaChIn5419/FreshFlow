# QA & Quality Assurance Skill

## Quality Assurance Playbook
1. **Backend Tests**: Run `PYTHONPATH=. .venv/bin/pytest`. All test modules (`test_auth.py`, `test_cookie_auth.py`, `test_day1_security.py`, `test_day4_resilience.py`, `test_customers.py`, `test_invoices.py`, `test_orders.py`, `test_products.py`) MUST pass.
2. **Frontend Type Safety**: Run `npx tsc --noEmit` from `frontend/` directory. Must exit with code 0.
3. **Security Audit**: Verify rate limiting (5/min), CORS headers, HttpOnly cookies, CSRF `X-Requested-With` checks, and PDF upload magic byte validation.
