# 🔒 MSC Quiz Platform — API & Security Vulnerability Audit Report

**Audit Date**: 2026-08-13  
**Auditor**: Antigravity Security Scan  
**Scope**: All backend routes, middleware, models, database config, and server setup

---

## Summary

| Severity | Count |
| :--- | :---: |
| 🔴 **CRITICAL** | 4 |
| 🟠 **HIGH** | 4 |
| 🟡 **MEDIUM** | 4 |
| **Total** | **12** |

---

## 🔴 CRITICAL Vulnerabilities

### V-01: Authentication Bypass — Any Password Accepted for Admin Login

> [!CAUTION]
> **Severity**: CRITICAL — Anyone can log in as admin with common passwords or any email containing "admin"

**File**: [`auth.js`](file:///c:/Quiz-platform/backend/src/routes/auth.js#L33-L74)  
**Lines**: 33–74

**Description**: The login route has multiple layers of fallback that effectively disable authentication:

1. **Line 33–36**: If the entered email doesn't match, it falls back to *any* existing admin account.
2. **Line 39–46**: If *no* admin exists at all, it **creates a new admin** with the attacker's email and password.
3. **Line 56**: Accepts plaintext `password === 'Admin@123'`, `'admin123'`, or `'admin'` as valid — even if bcrypt compare fails.
4. **Line 56**: Accepts login if `cleanEmail.includes('admin')` — meaning `attacker-admin@evil.com` bypasses auth.
5. **Line 69–73**: Ultimate failsafe accepts `Admin@123`, `admin`, `admin123` for *any* account.

```js
// Line 56 — password bypass
if (admin.password === password || password === 'Admin@123' || password === 'admin123' || password === 'admin' || cleanEmail.includes('admin')) {
  isMatch = true; // ← CRITICAL: bypasses bcrypt entirely
```

**Fix**:
- Remove all plaintext password fallbacks (lines 55–74).
- Remove auto-creation of admin accounts on login (lines 39–46).
- Remove email-based admin fallback (lines 34–36).
- Only accept bcrypt-verified passwords.

---

### V-02: Hardcoded JWT Secrets in Source Code

> [!CAUTION]
> **Severity**: CRITICAL — JWT tokens can be forged by anyone who reads the source code

**Files**:
- [`auth.js:9`](file:///c:/Quiz-platform/backend/src/routes/auth.js#L9): `'msc_quiz_secret_key_2026'`
- [`middleware/auth.js:4`](file:///c:/Quiz-platform/backend/src/middleware/auth.js#L4): `'msc_quiz_secret_key_2026'`
- [`studentSync.js:58`](file:///c:/Quiz-platform/backend/src/routes/studentSync.js#L58): `'msc_prpcem_jwt_secret_2026'`
- [`studentSync.js:89`](file:///c:/Quiz-platform/backend/src/routes/studentSync.js#L89): `'msc_prpcem_shared_sso_secret_2026'`

**Description**: All JWT signing secrets are hardcoded as fallback defaults. If `process.env.JWT_SECRET` is not set (common in local/staging), anyone can forge valid admin or student JWT tokens.

**Fix**:
- Remove all hardcoded secret fallbacks.
- Require `JWT_SECRET` to be set via environment variable; crash on startup if missing.
- Use a cryptographically random secret (minimum 256 bits).

---

### V-03: Hardcoded API Keys for Cross-Portal Communication

> [!CAUTION]
> **Severity**: CRITICAL — External API authentication is effectively disabled

**File**: [`studentSync.js`](file:///c:/Quiz-platform/backend/src/routes/studentSync.js#L68-L70)

**Description**: Inter-service API keys are hardcoded:
- Line 68: `'msc_quiz_verification_secret_key_2026'`
- Line 184: `'msc_quiz_api_key_2026'`

These keys are sent to the verification portal and used for API key validation. Anyone with access to the repo or built JS can call these APIs.

**Fix**:
- Move all API keys to environment variables only.
- Do not provide fallback values for API keys.

---

### V-04: CORS Policy Completely Open — All Origins Accepted

> [!CAUTION]
> **Severity**: CRITICAL — Any website can make authenticated API requests on behalf of logged-in admins

**File**: [`server.js`](file:///c:/Quiz-platform/backend/src/server.js#L37-L52)  
**Lines**: 37–52

**Description**: The CORS origin function has a "permissive fallback" on line 51 that returns `callback(null, true)` for **all** origins, even when they don't match the allowlist. This makes the entire CORS configuration meaningless.

```js
} else {
  // Permissive fallback so mobile browsers and preview domains are not blocked
  callback(null, true); // ← CRITICAL: defeats the entire allowlist
}
```

**Fix**:
- Change the fallback to `callback(new Error('CORS not allowed'), false)`.
- Keep the explicit allowlist and wildcard subdomain matching.

---

## 🟠 HIGH Vulnerabilities

### V-05: Rate Limiter Set to 100,000 Requests — Effectively Disabled

> [!WARNING]
> **Severity**: HIGH — No brute-force or DDoS protection

**File**: [`server.js`](file:///c:/Quiz-platform/backend/src/server.js#L102-L110)  
**Line**: 104

**Description**: The rate limiter is configured with `max: 100000` per 15-minute window. This provides essentially zero protection against brute-force password attacks, credential stuffing, or API abuse.

```js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000, // For load testing only ← HIGH: no real protection
```

**Fix**:
- Set `max: 100` for general API endpoints.
- Add a separate stricter limiter for `/api/auth/login` (e.g., `max: 10` per 15 minutes).

---

### V-06: Student Login Requires No Password — Open Account Creation

> [!WARNING]
> **Severity**: HIGH — Anyone can impersonate any student by knowing their email

**File**: [`studentSync.js`](file:///c:/Quiz-platform/backend/src/routes/studentSync.js#L36-L82)

**Description**: The `/api/student/login` endpoint accepts any email with no password verification. It immediately creates a session token and registers the student. An attacker can:
1. Log in as any student by submitting their email.
2. Receive a valid 30-day JWT.
3. Access their certificates and quiz data.

Additionally, it dispatches a cross-portal sync with `password: password || 'student123'` (line 67), potentially creating accounts on the verification portal with a default password.

**Fix**:
- Require email verification (OTP or magic link) before issuing tokens.
- Or at minimum require a password that's validated against a stored hash.

---

### V-07: Certificate Issuance Endpoint Has No Authentication

> [!WARNING]
> **Severity**: HIGH — Anyone can issue fake certificates

**File**: [`studentSync.js`](file:///c:/Quiz-platform/backend/src/routes/studentSync.js#L128-L177)

**Description**: `POST /api/student/issue-certificate` has no `authMiddleware` or API key check. Any unauthenticated HTTP request can issue an official-looking certificate with any name, email, score, and title. Certificates are stored in-memory and have auto-generated IDs.

**Fix**:
- Add `authMiddleware` (admin-only) or validate a student JWT token.
- Verify that the student actually completed the quiz with the claimed score before issuing.

---

### V-08: Account Data Endpoint API Key Validation is Optional

> [!WARNING]
> **Severity**: HIGH — Student data can be queried without authentication

**File**: [`studentSync.js`](file:///c:/Quiz-platform/backend/src/routes/studentSync.js#L182-L204)

**Description**: `GET /api/student/account-data` checks the API key only if it's provided. If `apiKey` is omitted from the query string entirely, the check is skipped (line 186: `if (apiKey && apiKey !== expectedApiKey)`). Anyone can query certificates for any email.

**Fix**:
- Make the API key check mandatory: `if (!apiKey || apiKey !== expectedApiKey)`.

---

## 🟡 MEDIUM Vulnerabilities

### V-09: SSL Certificate Validation Disabled for PostgreSQL

> [!IMPORTANT]
> **Severity**: MEDIUM — Vulnerable to man-in-the-middle attacks on database connections

**File**: [`database.js`](file:///c:/Quiz-platform/backend/src/config/database.js#L20-L24)

**Description**: `rejectUnauthorized: false` disables SSL certificate verification for the Neon PostgreSQL connection, allowing MITM attacks between the app server and database.

**Fix**:
- Set `rejectUnauthorized: true` and configure the Neon CA certificate.

---

### V-10: Multer File Upload Has No Size Limit

> [!IMPORTANT]
> **Severity**: MEDIUM — Denial of service via large file upload

**File**: [`quiz.js`](file:///c:/Quiz-platform/backend/src/routes/quiz.js#L10-L23)

**Description**: The multer configuration filters file type but sets no `limits.fileSize`. An attacker could upload extremely large files to exhaust server memory (since `memoryStorage` is used).

**Fix**:
- Add `limits: { fileSize: 5 * 1024 * 1024 }` (5 MB max).

---

### V-11: Socket.IO Events Have No Authentication

> [!IMPORTANT]
> **Severity**: MEDIUM — Any connected client can emit admin events

**File**: [`socket.js`](file:///c:/Quiz-platform/backend/src/services/socket.js#L16-L53)

**Description**: Socket.IO events like `admin_join_quiz`, `start_lobby`, `next_question`, `end_quiz` have no token validation. Any client can connect and emit admin-level events to control quiz sessions, skip questions, or end quizzes.

**Fix**:
- Add a Socket.IO middleware that verifies JWT from the handshake auth header.
- Check `req.user.role === 'admin'` before processing admin events.

---

### V-12: Inconsistent JWT Secrets Between Admin and Student Tokens

> [!IMPORTANT]
> **Severity**: MEDIUM — Different secrets may allow cross-context token confusion

**Files**:
- Admin JWT: `'msc_quiz_secret_key_2026'` ([`auth.js:9`](file:///c:/Quiz-platform/backend/src/routes/auth.js#L9))
- Student JWT: `'msc_prpcem_jwt_secret_2026'` ([`studentSync.js:58`](file:///c:/Quiz-platform/backend/src/routes/studentSync.js#L58))
- SSO JWT: `'msc_prpcem_shared_sso_secret_2026'` ([`studentSync.js:89`](file:///c:/Quiz-platform/backend/src/routes/studentSync.js#L89))

**Description**: Three different hardcoded secrets are used for different token contexts. If env vars are not set consistently, admin tokens could be verified with student secrets or vice versa, potentially granting unauthorized access.

**Fix**:
- Use a single `JWT_SECRET` env variable for all token operations.
- Differentiate token types via claims (e.g., `role: 'admin'` vs `role: 'student'`) rather than separate secrets.

---

## Proposed Fix Priority

| Order | ID | Fix | Impact |
| :---: | :---: | :--- | :--- |
| 1 | V-01 | Remove all auth bypass / password fallbacks | Blocks unauthorized admin access |
| 2 | V-04 | Fix CORS to actually reject unknown origins | Prevents cross-origin attacks |
| 3 | V-05 | Set real rate limits (100 req/15min general, 10/15min for login) | Blocks brute-force |
| 4 | V-02 | Crash on missing `JWT_SECRET` env var, remove hardcoded secrets | Prevents token forgery |
| 5 | V-07 | Add auth to certificate issuance endpoint | Prevents fake certificates |
| 6 | V-06 | Add password or OTP to student login | Prevents student impersonation |
| 7 | V-08 | Make API key check mandatory on account-data | Protects student data |
| 8 | V-03 | Remove hardcoded API keys | Secures inter-service auth |
| 9 | V-11 | Add JWT auth to Socket.IO connection | Secures live quiz control |
| 10 | V-10 | Add multer file size limit | Prevents DoS |
| 11 | V-09 | Enable SSL cert validation for Postgres | Prevents MITM |
| 12 | V-12 | Unify JWT secret management | Prevents cross-context confusion |

---

> [!IMPORTANT]
> **Ready to proceed?** Approve this report and I will fix each vulnerability in order, starting from V-01 (the most critical admin auth bypass).
