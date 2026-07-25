# FreshFlow v1.0 Architecture

## Overview
FreshFlow uses a classic N-Tier architecture (Controller -> Service -> Repository -> Database) to decouple HTTP routing from business logic, and business logic from data access.

## Layers

### 1. Routers (`app/api/`)
- Handle HTTP requests and responses.
- Define input validation using Pydantic schemas.
- Route logic directly to Services.
- **Rule:** No raw database queries or complex business logic belongs here.

### 2. Services (`app/services/`)
- The brain of the application.
- Orchestrates business rules, validation, and domain exception throwing (e.g., `CustomerNotFound`).
- Uses Repositories for data operations.

### 3. Repositories (`app/repositories/`)
- Encapsulates all SQLAlchemy queries and database interactions.
- Provides standard CRUD operations and domain-specific queries.

### 4. Database Models (`app/models/`)
- SQLAlchemy declarative base models mapping to database tables.

### 5. Schemas (`app/schemas/`)
- Pydantic models for validation and serialization.

## Exception Handling
All core business exceptions inherit from `BaseAppException` found in `app/core/exceptions/base.py`. These are globally caught by FastAPI in `main.py` and returned as consistent JSON error responses with an `error_id`.
