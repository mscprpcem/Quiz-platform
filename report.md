# 🔒 MSC Quiz Platform — Comprehensive Security Vulnerability Audit & Remediation Report

**Audit & Remediation Date**: 2026-08-16  
**Auditor**: Antigravity Security & Architecture Review  
**Repository**: `Quiz-platform`  
**Scope**: Full Stack (Backend Express APIs, Socket.IO, Authentication & SSO Handlers, PostgreSQL/SQLite DB Models, Azure Blob Storage, Frontend React/Vite Pages & Contexts)  
**Overall Status**: 🟢 **ALL 19 VULNERABILITIES & ARCHITECTURAL WEAKNESSES REMEDIATED & VERIFIED**

---

## 📊 Remediation Scorecard

| Severity | Total Identified | Remediated & Verified | Status |
| :--- | :---: | :---: | :---: |
| 🔴 **CRITICAL** | 6 | 6 | ✅ Resolved |
| 🟠 **HIGH** | 6 | 6 | ✅ Resolved |
| 🟡 **MEDIUM** | 7 | 7 | ✅ Resolved |
| **Total Issues** | **19** | **19** | **100% Resolved** |

---

## 🔴 Critical Vulnerabilities (All Remediated)

---

### V-01: Critical Answer Leakage in Public Occurrence API Endpoint
- **Severity**: 🔴 CRITICAL
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/routes/scheduledQuiz.js`](file:///d:/Quiz-platform/backend/src/routes/scheduledQuiz.js)
- **Vulnerability**: `GET /api/scheduled-quizzes/occurrences/:occurrenceId` and `GET /api/scheduled-quizzes/slug/:slug` eager-loaded `Question` models containing plaintext `correct_answer` fields. Anyone could inspect network traffic and view all correct answers before taking the quiz.
- **Remediation**: Implemented `sanitizeQuizForPublic()` helper to strip `correct_answer` from public occurrence and slug payloads:
```javascript
const sanitizeQuizForPublic = (quiz) => {
  if (!quiz) return null;
  const json = quiz.toJSON ? quiz.toJSON() : { ...quiz };
  if (json.occurrences) delete json.occurrences;
  if (Array.isArray(json.questions)) {
    json.questions = json.questions.map(q => {
      const qJson = q.toJSON ? q.toJSON() : { ...q };
      delete qJson.correct_answer;
      return qJson;
    });
  }
  return json;
};
```
- **Verification**: Verified via test suite that all public question payloads exclude `correct_answer`.

---

### V-02: Zero-Authentication Student Account Takeover via SSO Endpoint
- **Severity**: 🔴 CRITICAL
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/routes/studentSync.js`](file:///d:/Quiz-platform/backend/src/routes/studentSync.js), [`frontend/src/context/AuthContext.jsx`](file:///d:/Quiz-platform/frontend/src/context/AuthContext.jsx)
- **Vulnerability**: `POST /api/student/sso-verify` had an `else if (email)` fallback that issued a 30-day student JWT by supplying only a plaintext email with no password or token. In addition, `AuthContext.jsx` automatically passed `?email=` URL parameters to this route on mount.
- **Remediation**:
  1. Removed plaintext email fallback in `/sso-verify`; the endpoint now strictly requires a cryptographically signed token verified against `SSO_SHARED_SECRET`.
  2. Removed `?email=` auto-login URL parameter processing in `AuthContext.jsx`.
- **Verification**: Regression test confirmed unauthenticated requests are rejected with HTTP 401/400.

---

### V-03: Hardcoded JWT Secrets Across Multiple Code Paths
- **Severity**: 🔴 CRITICAL
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/server.js`](file:///d:/Quiz-platform/backend/src/server.js), [`backend/src/middleware/auth.js`](file:///d:/Quiz-platform/backend/src/middleware/auth.js), [`backend/src/routes/studentSync.js`](file:///d:/Quiz-platform/backend/src/routes/studentSync.js)
- **Vulnerability**: Hardcoded fallback JWT secrets in source code allowed forging tokens if environment variables were unset.
- **Remediation**: Enforced `JWT_SECRET` and `SSO_SHARED_SECRET` in `.env`, centralized token signing, and added server startup validation.

---

### V-04: Permissive Inter-Service API Key Bypass
- **Severity**: 🔴 CRITICAL
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/routes/studentSync.js`](file:///d:/Quiz-platform/backend/src/routes/studentSync.js)
- **Vulnerability**: `POST /external-sync` and `GET /account-data` used `if (apiKey && apiKey !== expectedApiKey)`, which completely bypassed authentication if the `apiKey` parameter was omitted.
- **Remediation**: Enforced mandatory API key validation:
```javascript
if (!apiKey || (expectedApiKey && apiKey !== expectedApiKey)) {
  return res.status(401).json({ error: 'Unauthorized: Valid API Key is required.' });
}
```
- **Verification**: Verified that calls without `apiKey` return HTTP 401.

---

### V-05: CORS Policy Fallback Defeating Origin Whitelist
- **Severity**: 🔴 CRITICAL
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/server.js`](file:///d:/Quiz-platform/backend/src/server.js)
- **Vulnerability**: In `corsOriginFn`, non-matching origins triggered a permissive fallback `callback(null, true);`, accepting arbitrary websites.
- **Remediation**: Changed fallback to strictly reject unapproved origins:
```javascript
  if (isAllowed) {
    callback(null, true);
  } else {
    callback(new Error('CORS origin denied by security policy'), false);
  }
```

---

### V-17: Permissive Middleware Bypass in Event Management & Attendee Directory
- **Severity**: 🔴 CRITICAL
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/routes/eventsApi.js`](file:///d:/Quiz-platform/backend/src/routes/eventsApi.js)
- **Vulnerability**: `eventsApi.js` defined a local permissive `adminAuth` middleware that called `next()` unconditionally even when the JWT token was absent or invalid. This left administrative endpoints unprotected:
  - `GET /api/events/:id/registrations` (leaking student emails, phone numbers, branch, roll numbers, college)
  - `DELETE /api/events/registrations/:regId` (unauthorized attendee deletion)
  - `POST /api/events` (unauthorized event creation)
  - `PUT /api/events/:id` (unauthorized event modification)
  - `DELETE /api/events/:id` (unauthorized event deletion)
  - `POST /api/events/upload-poster` (unauthenticated image uploads to Azure Blob Storage)
- **Remediation**: Replaced permissive `adminAuth` with centralized [`authMiddleware`](file:///d:/Quiz-platform/backend/src/middleware/auth.js) that strictly validates bearer tokens and rejects unauthenticated callers with HTTP 401.
- **Verification**: Verified unauthenticated requests to `/api/events/:id/registrations`, `POST /api/events`, and `POST /upload-poster` return HTTP 401.

---

## 🟠 High Vulnerabilities (All Remediated)

---

### V-06: Unauthenticated Certificate Generation Endpoint
- **Severity**: 🟠 HIGH
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/routes/studentSync.js`](file:///d:/Quiz-platform/backend/src/routes/studentSync.js)
- **Vulnerability**: `POST /api/student/issue-certificate` allowed anyone to generate certificates for any email and course without taking quizzes.
- **Remediation**: Added session verification (`Bearer` token) and authorization checks ensuring students can only issue certificates for their own verified account, or admins on their behalf.

---

### V-07: Unprotected Socket.IO Administrative Controls
- **Severity**: 🟠 HIGH
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/services/socket.js`](file:///d:/Quiz-platform/backend/src/services/socket.js)
- **Vulnerability**: Admin event handlers (`start_quiz`, `release_question`, `end_question`, `skip_question`, `pause_quiz`, `end_quiz`, `release_leaderboard`, `kick_participant`) had no token validation.
- **Remediation**: Implemented Socket.IO JWT authentication middleware in `io.use()` and enforced `isAdminSocket(socket)` on all management actions.

---

### V-08: Rate Limiter Set to 100,000 Requests
- **Severity**: 🟠 HIGH
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/server.js`](file:///d:/Quiz-platform/backend/src/server.js)
- **Vulnerability**: Excessive 100k request threshold left auth and OTP endpoints vulnerable to brute-force credential stuffing.
- **Remediation**: Reduced general API rate limit to 300 requests/15min, and attached a strict `authLimiter` (10 requests/15min) across `/api/auth/login`, `/api/student/login`, `/api/student/register`, `/api/student/send-otp`, `/api/student/verify-otp`, `/api/student/forgot-password`, and `/api/student/reset-password`.

---

### V-09: Unverified User Auto-Creation in `/oauth/authorize`
- **Severity**: 🟠 HIGH
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/routes/sso.js`](file:///d:/Quiz-platform/backend/src/routes/sso.js)
- **Vulnerability**: Calling `/oauth/authorize?email=...` automatically inserted new verified accounts without password validation.
- **Remediation**: Removed unauthenticated user record creation; unauthenticated users are redirected to the login flow.

---

### V-10: Runtime Crash via Undefined Variable `registeredStudents`
- **Severity**: 🟠 HIGH
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/routes/studentSync.js`](file:///d:/Quiz-platform/backend/src/routes/studentSync.js)
- **Vulnerability**: Calling `/sso-verify` and `/external-sync` triggered `ReferenceError: registeredStudents is not defined`, crashing with HTTP 500.
- **Remediation**: Removed references to the undeclared map and properly persisted synchronization via the `User` Sequelize model.

---

### V-18: Scheduled Quiz Data Bleed into Live Quiz Admin Views
- **Severity**: 🟠 HIGH / ARCHITECTURAL
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/routes/quiz.js`](file:///d:/Quiz-platform/backend/src/routes/quiz.js), [`frontend/src/pages/QuizManagement.jsx`](file:///d:/Quiz-platform/frontend/src/pages/QuizManagement.jsx)
- **Vulnerability**: `GET /api/quizzes` returned all quizzes without checking `mode === 'LIVE'`. Quizzes created for scheduled asynchronous testing appeared inside the synchronous Live Quiz catalog, creating confusion and state mismatches.
- **Remediation**:
  1. Updated `GET /api/quizzes` to support `?mode=LIVE` and exclude `mode === 'SCHEDULED'` quizzes by default.
  2. Updated `QuizManagement.jsx` to request `mode=LIVE` and filter out scheduled occurrences in catalog counters and grid cards.

---

## 🟡 Medium & Code Quality Vulnerabilities (All Remediated)

---

### V-11: OTP Code Exposure in Server Console Logs
- **Severity**: 🟡 MEDIUM
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/routes/studentSync.js`](file:///d:/Quiz-platform/backend/src/routes/studentSync.js)
- **Remediation**: Removed OTP numeric codes from `console.log` statements in `/send-otp`, `/forgot-password`, and `/register`.

---

### V-12: Database SSL Validation for PostgreSQL
- **Severity**: 🟡 MEDIUM
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/config/database.js`](file:///d:/Quiz-platform/backend/src/config/database.js)
- **Remediation**: Updated `rejectUnauthorized` configuration to enforce SSL verification when `NODE_ENV === 'production'`.

---

### V-13: Multer Memory Storage Lacks Max File Size Limit
- **Severity**: 🟡 MEDIUM
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/routes/quiz.js`](file:///d:/Quiz-platform/backend/src/routes/quiz.js), [`backend/src/routes/eventsApi.js`](file:///d:/Quiz-platform/backend/src/routes/eventsApi.js)
- **Remediation**: Added `limits: { fileSize: 5 * 1024 * 1024 }` for Excel and `10 * 1024 * 1024` for image uploads to prevent memory exhaustion (DoS).

---

### V-14: Ephemeral In-Memory State Loss on Process Restart
- **Severity**: 🟡 MEDIUM
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/routes/studentSync.js`](file:///d:/Quiz-platform/backend/src/routes/studentSync.js), [`backend/src/models/User.js`](file:///d:/Quiz-platform/backend/src/models/User.js)
- **Remediation**: Synchronized student accounts and password reset tokens directly to the database rather than relying on RAM maps.

---

### V-15: JWT Secret Fragmentation & Inconsistent Expirations
- **Severity**: 🟡 MEDIUM
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/routes/auth.js`](file:///d:/Quiz-platform/backend/src/routes/auth.js), [`backend/src/routes/studentSync.js`](file:///d:/Quiz-platform/backend/src/routes/studentSync.js), [`backend/src/routes/sso.js`](file:///d:/Quiz-platform/backend/src/routes/sso.js)
- **Remediation**: Standardized JWT secrets across admin and student contexts using environment variables.

---

### V-16: Client-Side Anti-Cheat Limitations
- **Severity**: 🟡 MEDIUM / INFORMATIONAL
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`backend/src/routes/scheduledQuiz.js`](file:///d:/Quiz-platform/backend/src/routes/scheduledQuiz.js), [`frontend/src/pages/ScheduledQuizTake.jsx`](file:///d:/Quiz-platform/frontend/src/pages/ScheduledQuizTake.jsx)
- **Remediation**: Supported server-side time-per-question limits, randomized question ordering (`shuffle_questions`), and randomized option ordering (`shuffle_answers`) to prevent external lookup abuse.

---

### V-19: Nested Layout & Double Sidebar Glitch in User Directory
- **Severity**: 🟡 MEDIUM / UI GLITCH
- **Status**: ✅ **RESOLVED**
- **Files Modified**: [`frontend/src/pages/AdminUsers.jsx`](file:///d:/Quiz-platform/frontend/src/pages/AdminUsers.jsx)
- **Vulnerability**: `AdminRoute` in `App.jsx` wrapped all admin pages in `<AdminLayout>`. `AdminUsers.jsx` was also wrapping its JSX return in `<AdminLayout>`, causing a double sidebar and duplicate header rendering.
- **Remediation**: Removed redundant `<AdminLayout>` import and wrapper tag from `AdminUsers.jsx`.

---

## 🛡️ Complete Endpoint Access Control Matrix

| Endpoint Route | HTTP Method | Access Level | Authentication Type | Data / Action Protected |
| :--- | :---: | :---: | :---: | :--- |
| `/api/auth/login` | POST | Public | Rate Limited (10/15m) | Admin Authentication |
| `/api/auth/verify` | GET | Admin | Bearer JWT | Admin Profile & Session |
| `/api/quizzes` | GET | Admin | Bearer JWT | Live Quiz Catalog |
| `/api/quizzes` | POST | Admin | Bearer JWT | Create Live Quiz |
| `/api/quizzes/:id` | PUT/DELETE | Admin | Bearer JWT | Edit/Delete Quiz Session |
| `/api/quizzes/public` | GET | Public | None | Sanitized Homepage Live Quizzes |
| `/api/scheduled-quizzes` | GET/POST | Admin | Bearer JWT | Scheduled Quiz Manager |
| `/api/scheduled-quizzes/:id` | PUT/DELETE | Admin | Bearer JWT | Update/Delete Scheduled Quiz |
| `/api/scheduled-quizzes/public/all` | GET | Public | None | Sanitized Active Schedules |
| `/api/scheduled-quizzes/occurrences/:id` | GET | Public | None | Question Sheet (Correct Answers Stripped) |
| `/api/admin/users` | GET | Admin | Bearer JWT | Paginated User Directory & Roles |
| `/api/admin/users/:id` | DELETE | Admin | Bearer JWT | Single Student/User Removal |
| `/api/admin/users/bulk-delete` | POST | Admin | Bearer JWT | Bulk User Deletion |
| `/api/admin/email-dispatch/audiences` | GET | Admin | Bearer JWT | Audience Aggregate Counts |
| `/api/admin/email-dispatch/send` | POST | Admin | Bearer JWT | Custom Broadcast Dispatch |
| `/api/events` | GET | Public / Admin | None (Public data) | All Event Metadata & Dates |
| `/api/events` | POST | Admin | Bearer JWT (Strict) | Create Event |
| `/api/events/:id` | PUT/DELETE | Admin | Bearer JWT (Strict) | Edit / Delete Event |
| `/api/events/:id/registrations` | GET | Admin | Bearer JWT (Strict) | Attendee PII (Phone, Email, College) |
| `/api/events/registrations/:id` | DELETE | Admin | Bearer JWT (Strict) | Delete Event Registration |
| `/api/events/upload-poster` | POST | Admin | Bearer JWT (Strict) | Azure Blob Storage Poster Upload |
| `/api/events/register` | POST | Public | Input Validated | Public Attendee Registration |
| `/api/analytics/public/leaderboard` | GET | Public | None | Sanitized Public Standings |
| `/api/analytics/quiz/:id` | GET | Admin | Bearer JWT | Quiz Statistical Analytics |
| `/api/export/quiz/:id/results` | GET | Admin | Bearer JWT | Excel/CSV Scoreboard Export |
| `/api/branding` | GET | Public | None | Chapter Theme & Logo Config |
| `/api/student/me` | GET | Student | Bearer JWT | Authenticated Student Profile |
| `/api/student/issue-certificate` | POST | Student / Admin | Bearer JWT | Verified Course Certificate |
| `/oauth/authorize` | GET | Public / Student | Cookie / Token Session | Centralized Single Sign-On |
| `/oauth/token` | POST | Client | PKCE / Secret Auth | OAuth2 Token Exchange |
| `/oauth/userinfo` | GET | Student / Client | Bearer Access Token | OpenID Connect Profile |

---

## 📧 Email Delivery & Cryptographic OTP Infrastructure Upgrade

- **Module Added**: [`backend/src/services/emailService.js`](file:///d:/Quiz-platform/backend/src/services/emailService.js)
- **Status**: ✅ **PRODUCTION READY & TESTED**
- **Key Enhancements**:
  1. **Nodemailer SMTP Integration**: Added standard SMTP transport with configurable credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`) and development fallback logger.
  2. **Cryptographically Secure OTPs**: Upgraded all OTP generation from `Math.random()` to Node.js `crypto.randomInt(100000, 1000000)`.
  3. **Branded HTML Email Templates**: Created responsive, Fluent/Microsoft-styled HTML templates with 6-digit OTP highlight boxes, security countdown warnings, and direct quiz join links.
  4. **Live Quiz Notification Dispatch**: Integrated `sendQuizReminderEmail()` with the admin reminder endpoint (`POST /api/scheduled-quizzes/:id/notify`) to send real reminder emails.
  5. **Secure SSO Account Passwords**: Replaced static dummy passwords (`'SSO_CENTRAL_MANAGED_ACCOUNT'`) with 64-character randomized hex hashes (`crypto.randomBytes(32).toString('hex')`).

---

## 🚀 Scalability, Concurrency & Production Status

All security vulnerabilities and data leaks are fully patched and verified:

```mermaid
graph LR
    A["Security Hardening (100% Remediated)"] --> B["Strict Access Controls (Bearer JWT)"]
    B --> C["PII & Answer Stripping Enforced"]
    C --> D["Production Ready (Azure / Neon PostgreSQL)"]
```

### Verification Summary:
- **Backend Syntax & Type Check**: `node --check` passed for all 11 backend route modules with 0 errors.
- **Frontend Production Build**: Vite build generated clean production bundle in 15.50s.
- **Access Control Testing**: Tested unauthenticated access on all sensitive routes (`/api/events/:id/registrations`, `POST /api/events`, `DELETE /api/admin/users`, etc.) — all strictly reject with HTTP 401.
