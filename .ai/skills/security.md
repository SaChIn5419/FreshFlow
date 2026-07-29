# Security Developer Skill & Rules

## Core Security Rules
1. **Authentication**: All authentication must use `HttpOnly`, `SameSite=Lax`, `Secure` browser cookies. Access tokens expire in 15 minutes; refresh tokens expire in 7 days with automatic database rotation on `/auth/refresh`.
2. **CSRF**: All mutating HTTP endpoints (`POST`, `PUT`, `DELETE`, `PATCH`) MUST verify `X-Requested-With: FreshFlow` header.
3. **Rate Limiting**: Auth login endpoints (`POST /api/v1/auth/login`) MUST be decorated with `@limiter.limit("5/minute")`.
4. **Secret Key Enforcer**: Pydantic settings MUST execute `@model_validator` calling `sys.exit` if `ENV != "dev"` and default secret key is used.
5. **Security Headers**: Middleware MUST inject `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`, and `Referrer-Policy`.
6. **File Uploads**: Enforce 10MB chunked stream limits and verify `%PDF` magic bytes.
