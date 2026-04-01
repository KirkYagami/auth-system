# Project: AuthEngine

## Project Overview

A production-ready authentication system built with **FastAPI**, **MongoDB (Beanie ODM)**, and **JWT-based authentication**. Supports email verification, RBAC, password reset, refresh token lifecycle, and optional email-based 2FA.

---

## Tech Stack

| Layer            | Technology                        |
|------------------|-----------------------------------|
| Framework        | FastAPI (Python)                  |
| Database         | MongoDB + Beanie ODM              |
| Auth             | JWT via `python-jose`             |
| Password Hashing | `passlib` (bcrypt / argon2)       |
| Email            | SMTP (Gmail)                      |
| Config           | `python-dotenv` / OS env vars     |

---

## Architecture

Follow clean layered architecture — never mix concerns across layers:

```
app/
├── routers/        # Route definitions (API layer only)
├── services/       # Business logic (no direct DB calls in routes)
├── models/         # Beanie ODM document models
├── schemas/        # Pydantic request/response schemas
├── core/           # Config, security, JWT utilities
└── utils/          # Email sender, hashing helpers, OTP utils
```

---

## Data Models

### User
```
id, email (unique, indexed), first_name, last_name,
password_hash, role, is_active, is_verified,
is_2fa_enabled, created_at
```

### Token / OTP
```
id, user_id, token/otp, type (email_verification | password_reset | 2fa_otp),
expires_at, is_used, created_at
```

### Refresh Token
```
id, user_id, token, expires_at, is_revoked, created_at
```

---

## API Endpoints

```
POST   /auth/register           # Register with email, password, name, role
GET    /auth/verify-email       # ?token=... — activate account
POST   /auth/login              # Returns tokens or triggers 2FA OTP
POST   /auth/refresh            # Exchange refresh token for new access token
POST   /auth/logout             # Revoke refresh token
POST   /auth/forgot-password    # Send OTP/reset token to email
POST   /auth/reset-password     # Validate token, update password
POST   /auth/enable-2fa         # Toggle 2FA on user profile
POST   /auth/verify-2fa         # Submit OTP, receive tokens
```

---

## JWT Strategy

- **Access Token** — short-lived (15 min), contains `user_id`, `role`, `exp`
- **Refresh Token** — long-lived (7–30 days), persisted in DB, supports rotation
- Signing secret and algorithm come from environment variables

---

## Environment Variables

All sensitive config must come from env — never hardcode:

```
MONGO_URI
DATABASE_NAME
JWT_SECRET_KEY
JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
EMAIL_FROM
```

---

## Security Rules

- Hash all passwords with bcrypt or argon2 via `passlib` — never store plaintext
- All OTPs and verification tokens must be **time-bound** and **single-use**
- Refresh tokens must be **stored in DB** and checked on every use
- Enforce rate limiting on login and password reset endpoints (brute-force protection)
- Rotate refresh tokens on each use (optional but preferred)
- Store all secrets in environment variables — never in source code

---

## Key Conventions

- Use `async/await` throughout — this is an async FastAPI app
- All request/response bodies must use **Pydantic schemas** (not raw dicts)
- Business logic lives in **services**, not routers
- New user registrations start with `is_active=False`, `is_verified=False`
- Role defaults to `USER` if not provided at registration
- Supported roles (initial): `USER`, `ADMIN`
- Use route-level dependency injection for role checks (not inline conditionals)
- Log all login attempts, failures, and token operations

---

## OTP / Token Flow Summary

1. **Email Verification** → token sent on register → `GET /auth/verify-email?token=`
2. **Forgot Password** → OTP sent → `POST /auth/reset-password`
3. **2FA Login** → OTP sent after credential check → `POST /auth/verify-2fa`

---

## Out of Scope (Future)

- TOTP (Google Authenticator)
- OAuth (Google / GitHub)
- Fine-grained permissions
- Device/session tracking
- Account lockout
- Email queuing (Celery/Redis)