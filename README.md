# 🏆 MSC PRPCEM Quiz & Technical Assessment Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B%20LTS-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18%2B%20Vite-61dafb.svg)](https://reactjs.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8%2B-010101.svg)](https://socket.io)
[![Azure Blob Storage](https://img.shields.io/badge/Storage-Azure%20Blob-0078d4.svg)](https://azure.microsoft.com)
[![Status](https://img.shields.io/badge/Security%20Audit-100%25%20Verified-success.svg)](report.md)

An enterprise-grade, dual-mode real-time testing, event registration, and credentialing ecosystem engineered for the **Microsoft Student Club (MSC PRPCEM)**. Supports high-concurrency synchronized live multiplayer competitions, formal proctored scheduled certifications, public event registration with deadline controls, an email dispatch broadcast hub, and centralized Single Sign-On (SSO / OIDC).

---

## 🌟 Key Platform Capabilities

### 1. ⚡ Dual-Mode Assessment Engines
- **Mode A: Real-Time Live Quiz (Host-Driven)**: Sub-50ms WebSocket room synchronization. Admins control question releases, countdown timers, instant answer reveals, and dynamic top-podium rankings.
- **Mode B: Scheduled Self-Paced Exam (Candidate-Driven)**: Window-based availability (`valid_from` to `valid_until`), independent timers, auto-save on selection, negative marking, attempt limits, and automated submission upon expiry.

### 2. 📅 Flagship Event Management & Public Registration
- Create, schedule, and configure events with start/end datetimes, registration deadlines, and seat capacity limits.
- Public registration gateway ([`/register/:slug`](file:///d:/Quiz-platform/frontend/src/pages/EventRegister.jsx)) with live countdown timers and instant email confirmations.
- Automatic transition of ended events into the **Completed / Past Events** archive.
- High-performance poster uploads backed by **Azure Blob Storage**.

### 3. 📧 Email Dispatch & Broadcast Hub
- Targeted student email broadcasts filtered by event registrants, quiz participants, or student directory.
- Dynamic placeholder merge-tags (`{name}`, `{college}`, `{quiz_title}`, `{score}`, `{join_code}`, `{status}`).
- Production-ready SMTP transport with responsive Microsoft Fluent HTML email templates.

### 4. 🔑 Centralized SSO & OAuth 2.0 / OpenID Connect Provider
- Seamless Single Sign-On bridge across the MSC community ecosystem.
- Secure authorization code grant flow with cryptographic PKCE verification and `/oauth/userinfo` profile endpoints.

### 5. 🛡️ Client-Side & Server-Side Anti-Cheating Suite
- Enforced fullscreen lockdown with focus-loss and tab-switch violation listeners.
- Randomized question ordering (`shuffle_questions`) and option shuffling (`shuffle_answers`).
- Server-side answer isolation to prevent inspection leakages.

### 6. 📊 Analytics, Leaderboards & Excel Data Pipelines
- Real-time leaderboard calculations weighting speed and accuracy.
- Visualized score distributions, difficulty indexes, and question accuracy metrics.
- Complete `.xlsx` and `.csv` exports for attendance, scores, and question-by-question responses.

---

## 🏗️ Architectural Topology

```
Quiz-platform/
├── backend/
│   ├── src/
│   │   ├── config/               # Database connection (PostgreSQL / SQLite)
│   │   ├── middleware/           # Strict JWT authentication & rate limiting
│   │   ├── models/               # Sequelize models (User, Quiz, Event, Question, etc.)
│   │   ├── routes/               # Modular Express API endpoints
│   │   │   ├── analytics.js      # Public & Admin statistics
│   │   │   ├── auth.js           # Admin login & verification
│   │   │   ├── branding.js       # Dynamic chapter branding & theme config
│   │   │   ├── emailDispatch.js  # Targeted mass email broadcasting
│   │   │   ├── eventsApi.js      # Flagship event lifecycle & registration
│   │   │   ├── export.js         # Excel / CSV data pipelines
│   │   │   ├── quiz.js           # Synchronized Live Quiz operations
│   │   │   ├── scheduledQuiz.js  # Asynchronous Scheduled Quiz operations
│   │   │   ├── sso.js            # OAuth 2.0 / OIDC identity provider
│   │   │   ├── studentSync.js    # Student authentication, OTPs & certificates
│   │   │   └── userDirectory.js  # Admin user management & directory
│   │   ├── services/             # Azure Blob Storage, Email, Socket.IO handlers
│   │   └── server.js             # Express app entry & auto-migrations
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/           # Navbar, Footer, AdminLayout, EventSelector, Modals
│   │   ├── context/              # AuthContext (SSO session) & SocketContext
│   │   ├── pages/                # Client & Admin page views
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminEvents.jsx
│   │   │   ├── AdminEmailDispatch.jsx
│   │   │   ├── AdminUsers.jsx
│   │   │   ├── CreateScheduledQuiz.jsx
│   │   │   ├── EventRegister.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── LiveQuiz.jsx
│   │   │   ├── QuizManagement.jsx
│   │   │   ├── ScheduledQuizDetails.jsx
│   │   │   ├── ScheduledQuizTake.jsx
│   │   │   └── WaitingRoom.jsx
│   │   └── index.css             # Tailwind CSS & Fluent design tokens
│   └── package.json
│
├── report.md                     # Comprehensive security audit & remediation scorecard
├── DESIGN.md                     # Full engineering design & architecture specification
└── README.md
```

---

## 🚀 Quickstart & Installation Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Database**: PostgreSQL (recommended for production) or SQLite (default fallback)
- **Azure Storage** (optional): Connection string for blob poster uploads
- **SMTP Server**: Valid credentials for email OTPs and broadcast notifications

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/mscprpcem/Quiz-platform.git
cd Quiz-platform

# Install root, backend, and frontend dependencies
npm run install-all
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:

```ini
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PUBLIC_QUIZ_URL=http://localhost:5173

# Security & Secrets
JWT_SECRET=your_super_secret_jwt_key_2026
SSO_SHARED_SECRET=your_sso_shared_secret_key_2026

# Database (PostgreSQL or SQLite)
DATABASE_URL=postgresql://user:password@localhost:5432/msc_quiz_db
# Leave blank to automatically use local SQLite storage (dev mode)

# Admin Master Credentials
ADMIN_EMAIL=admin@mscprpcem.tech
ADMIN_PASSWORD=YourSecureAdminPasswordHere

# SMTP Email Configuration
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=no-reply@mscprpcem.tech
SMTP_PASS=YourSmtpPasswordHere
EMAIL_FROM="Microsoft Student Club PRPCEM" <no-reply@mscprpcem.tech>

# Azure Blob Storage (Optional)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER_NAME=events
```

### 3. Launch Development Servers
```bash
# Concurrently start backend (port 5000) and frontend (port 5173)
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🔒 Security & Hardening Highlights

- **100% Remediated Scorecard**: All 19 audited vulnerabilities resolved and verified (see [`report.md`](file:///d:/Quiz-platform/report.md)).
- **Role-Based Access Control**: Strict Bearer JWT validation across all admin management routes (`/api/quizzes`, `/api/scheduled-quizzes`, `/api/events`, `/api/admin/users`, `/api/admin/email-dispatch`).
- **Answer Sanitization**: Plaintext `correct_answer` fields are stripped from all public and candidate-facing payloads until post-quiz review.
- **Brute-Force Protection**: Strict rate limiters on auth and OTP endpoints (10 requests/15min).
- **Cryptographic Randomness**: Secure OTPs and session tokens powered by Node.js `crypto.randomInt` and `crypto.randomBytes`.

---

## 📜 License & Copyright

Distributed under the **MIT License**. Engineered with ❤️ by the **Microsoft Student Club PRPCEM Technical Team**.
