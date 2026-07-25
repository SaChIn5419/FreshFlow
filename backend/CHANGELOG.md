# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-06-30

### Added
- Complete API routing for Customers, Products, Orders, and Invoices (`/api/v1`).
- Implemented Service/Repository architecture for all domains.
- Structured Domain Exceptions (`CustomerNotFound`, `OrderEmpty`, etc.) with global exception handling.
- Swagger UI enhancements (Capitalized Tags, Request Examples).
- Backup utility script (`scripts/test_backup.sh`).
- Performance test script (`scripts/test_performance.py`).

### Changed
- Replaced `passlib` with native `bcrypt` to resolve Python 3.13 compatibility issues.
- Migrated all primary keys to `uuid.UUID` from integers.
- Refactored entire test suite to cover new V1 routes and pass 100%.
- Improved `InvoiceService` with safety checks (existence checks, idempotency rules).

### Removed
- Removed incomplete `reports` module entirely (Feature Freeze).
- Cleaned up unused imports and variables across the project.
