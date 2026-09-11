# 🚀 Building and Running MSC Quiz Platform on Neon Serverless Postgres

<div align="center">
  <a href="https://neon.com" target="_blank">
    <img src="assets/neon-logo.svg" alt="Neon Serverless Postgres" width="340" />
  </a>
  <br />
  <p><strong>Official Deployment and Architecture Guide for MSC Quiz & Technical Assessment Platform</strong></p>
  <p>
    <a href="https://neon.com">
      <img src="https://img.shields.io/badge/Database-Neon%20Serverless%20Postgres-00E599?logo=postgresql&logoColor=white" alt="Neon Database" />
    </a>
    <img src="https://img.shields.io/badge/Sequelize%20ORM-v6-blue.svg" alt="Sequelize ORM" />
    <img src="https://img.shields.io/badge/Connection-PgBouncer%20Pooled-orange.svg" alt="PgBouncer Pooled" />
    <img src="https://img.shields.io/badge/Status-Production%20Ready-success.svg" alt="Production Ready" />
  </p>
</div>

---

## 📌 Executive Summary

The **MSC PRPCEM Quiz & Technical Assessment Platform** is an enterprise-grade, dual-mode evaluation platform engineered for live multiplayer quiz competitions and self-paced proctored examinations.

Because live technical quiz tournaments experience **extreme traffic spikes** (e.g., hundreds or thousands of students submitting answers within the same 500-millisecond window), traditional monolithic databases either suffer connection exhaustion or incur high idle costs when no competitions are active.

**[Neon Serverless Postgres](https://neon.com)** is the ideal database solution for this architecture:
- ⚡ **Auto-Scaling Compute**: Automatically scales up compute resources during intense live quiz rounds and scales down to zero when idle between campus events.
- 🏊 **Built-in PgBouncer Connection Pooling**: Allows thousands of simultaneous WebSocket clients and API workers to share a pool of database connections without dropping packets.
- 🌿 **Instant Database Branching**: Enables zero-copy staging branches to test upcoming quiz sets, automated grading logic, and schema updates without touching live event data.
- 🔒 **Enterprise SSL by Default**: Enforces high-grade TLS encryption over all database transactions.

---

## 🏗️ Architectural Topology

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT TIER                             │
│  React 18 + Vite + Tailwind CSS (Desktop / Mobile Browsers) │
└──────────────┬───────────────────────────────┬──────────────┘
               │ HTTP / REST                   │ WebSockets (Socket.IO)
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION TIER                        │
│             Node.js + Express + Socket.IO Server            │
│         - Live Lobby Engine (sub-50ms sync)                 │
│         - Candidate Timer & Violation Guard                 │
│         - Auto-Schema Migration Service                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Sequelize ORM (Connection Pool)
                               │ SSL / TLS (sslmode=require)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE TIER                           │
│             NEON SERVERLESS POSTGRESQL                      │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │   Neon PgBouncer Connection Pooler (:5432)          │   │
│   │   - Absorbs high-concurrency answer bursts          │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              ▼                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │   Serverless Postgres Engine (PostgreSQL 16)        │   │
│   │   - Quizzes, Questions, Participants, Answers       │   │
│   │   - Events, Registrations, Anti-Cheat Violations    │   │
│   │   - Auto-scaling vCPU / RAM                         │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              │                              │
│   ┌──────────────────────────┴──────────────────────────┐   │
│   │   Branching Engine (Main / Staging / Test)          │   │
│   │   - Instant copy-on-write database clones           │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

Before beginning, ensure you have:
1. **Node.js**: `v18.0.0` or higher installed ([Download Node.js](https://nodejs.org)).
2. **Git**: Installed and configured on your machine.
3. **Neon Account**: A free account at [https://neon.com](https://neon.com).
4. **npm** or **pnpm**: Standard package managers bundled with Node.js.

---

## 🛠️ Step 1: Provision a Neon Serverless Postgres Database

1. Navigate to the **[Neon Console](https://console.neon.tech)** and sign in.
2. Click **"New Project"**.
3. Configure your project:
   - **Project name**: `msc-quiz-platform` (or your preferred name).
   - **Postgres version**: `PostgreSQL 16` (recommended) or `15`.
   - **Region**: Choose the region closest to your application hosting provider (e.g., `AWS us-east-1`, `eu-central-1`, or `ap-southeast-1`).
4. Click **"Create Project"**.

### Retrieving Your Pooled Connection String

Neon will display your database connection details:

> [!IMPORTANT]
> **Always use the Pooled Connection String** for web applications and WebSocket services! The pooled connection endpoint contains `-pooler` in the host name. This directs queries through Neon's built-in **PgBouncer**, preventing connection exhaustion when hundreds of concurrent students submit responses simultaneously.

Your connection string format:
```text
postgresql://[user]:[password]@ep-[endpoint-id]-pooler.[region].neon.tech/[dbname]?sslmode=require
```

Example:
```text
postgresql://alex:AbCdEf123456@ep-cool-feather-a5x1yz-pooler.us-east-1.neon.tech/msc_quiz?sslmode=require
```

---

## ⚙️ Step 2: Configure Environment Variables

1. In your cloned repository, copy the example environment file into `backend/.env`:
   ```bash
   cp .env.example backend/.env
   ```

2. Open `backend/.env` and update the database configuration:

   ```ini
   # =====================================================================
   # BACKEND CONFIGURATION
   # =====================================================================
   PORT=5000
   NODE_ENV=production

   # Neon Serverless Postgres Connection (Use the POOLED connection string)
   DATABASE_URL=postgresql://alex:AbCdEf123456@ep-cool-feather-a5x1yz-pooler.us-east-1.neon.tech/msc_quiz?sslmode=require
   DB_SSL_REJECT_UNAUTHORIZED=true

   # Security & Session Authentication
   JWT_SECRET=generate_a_secure_256_bit_random_key_here
   SSO_SHARED_SECRET=msc_prpcem_shared_sso_secret_2026

   # Initial Seed Admin Account (Automatically created on fresh Neon DB)
   ADMIN_EMAIL=admin@mscprpcem.tech
   ADMIN_PASSWORD=YourSecureAdminPassword123!
   ADMIN_NAME="MSC Admin"

   # Allowed CORS Origins
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://quiz.mscprpcem.tech
   ```

3. Configure `frontend/.env`:
   ```ini
   VITE_API_URL=http://localhost:5000
   ```

---

## 🚀 Step 3: Install Dependencies & Run the Platform

### 1. Install All Dependencies
From the repository root:
```bash
npm run install-all
```
*This installs dependencies across the root, `backend/`, and `frontend/` folders in a single step.*

### 2. Verify Database Connection
The platform contains built-in driver support for PostgreSQL (`pg` and `pg-hstore`) and an intelligent connection manager in `backend/src/config/database.js`.

When `DATABASE_URL` contains a PostgreSQL URI, the platform automatically selects the PostgreSQL dialect, configures TLS/SSL certificates, and establishes the Sequelize connection pool:

```javascript
// backend/src/config/database.js
sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    pool: {
        max: 40,        // Sized for PgBouncer pooled concurrency
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : (process.env.NODE_ENV === 'production')
        }
    }
});
```

### 3. Launch Development Servers
Run backend and frontend concurrently:
```bash
npm run dev
```

Watch the terminal output. You should observe:
```text
Using Neon PostgreSQL
Connecting to PostgreSQL via Sequelize...
✅ Database connection established successfully!
Running auto-schema migrations on Neon PostgreSQL...
✅ Schema migrations applied cleanly.
✅ Initial Admin Account Initialized: admin@mscprpcem.tech
🌱 Seeding starter quiz data...
✅ Starter quiz data seeded successfully!
=================================
🚀 Server Running
Port : 5000
Environment : production
=================================
```

4. Open your browser and navigate to **`http://localhost:5173`**.
5. Log in to the Admin Dashboard using your configured `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

---

## 🔍 Step 4: Verify Tables in the Neon Console

Once the backend starts, open the **[Neon Console](https://console.neon.tech)** to inspect your database:

1. Click on **"SQL Editor"** in the sidebar.
2. Verify all auto-migrated tables by running:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   You will see:
   - `Admins`
   - `Quizzes`
   - `Questions`
   - `Participants`
   - `Answers`
   - `Events`
   - `EventRegistrations`
   - `Violations`
   - `ScheduledOccurrences`
   - `QuizAttempts`
   - `AttemptAnswers`
   - `AttemptViolations`
   - `Subscribers`

3. Inspect the automatically seeded quizzes:
   ```sql
   SELECT id, title, join_code, mode, status FROM "Quizzes";
   ```

---

## 🌟 Step 5: High-Impact Neon Features for Quiz Platforms

### 1. Zero-Copy Database Branching for Safe Testing
One of Neon's best features is **Instant Database Branching** (powered by copy-on-write technology at the storage layer).

#### Use Case: Pre-Tournament Dry Run
Before running an official university examination or live coding tournament:
1. In Neon Console, go to **Branches** -> **"Create Branch"**.
2. Name it `staging-tournament-dryrun` with the parent as `main`.
3. Copy the new branch's connection string into your staging server's `.env`.
4. Run a simulated 500-user stress test or test newly authored questions.
5. Once verified, simply discard the branch or test results without risking or cluttering the production `main` branch.

```bash
# Example Neon CLI branching workflow
neon branches create --name staging-dryrun
neon connection-string staging-dryrun --pooled
```

### 2. Built-in PgBouncer for Peak Concurrency
During a live quiz event:
- 500+ students join a room with Socket.IO.
- The host clicks **"Next Question"**.
- 500+ answers are posted in the span of 1–2 seconds.
- Without a connection pooler, opening 500 raw Postgres connections causes memory exhaustion and crashes standard databases.
- With Neon's `-pooler` connection, thousands of transactions are queued and processed rapidly through a persistent pool of server connections with low overhead and minimal latency.

### 3. Auto-Suspend and Scale-to-Zero
Between events (e.g., overnight or on weekdays between scheduled quiz tournaments), Neon automatically scales compute down to zero:
- **Cost Savings**: Incur zero compute costs when no quizzes are running.
- **Instant Wake-Up**: When a user registers or an admin opens the dashboard, Neon wakes up within milliseconds and serves the request seamlessly.

---

## 🐳 Step 6: Production Deployment Guide

### Option A: Docker Deployment with Neon

Create a `Dockerfile` in `backend/`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Run with your Neon `DATABASE_URL`:
```bash
docker build -t msc-quiz-backend ./backend
docker run -d -p 5000:5000 \
  -e DATABASE_URL="postgresql://[user]:[pass]@ep-[endpoint]-pooler.[region].neon.tech/[dbname]?sslmode=require" \
  -e DB_SSL_REJECT_UNAUTHORIZED="true" \
  -e JWT_SECRET="your_production_secret" \
  --name quiz-backend msc-quiz-backend
```

### Option B: Cloud Hosting (Render, Railway, Fly.io, Azure App Service)
1. Push your repository to GitHub.
2. In your cloud provider dashboard:
   - Create a **Web Service** pointing to the `backend/` directory.
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add Environment Variables:
     - `DATABASE_URL`: Your pooled Neon connection string.
     - `DB_SSL_REJECT_UNAUTHORIZED`: `true`
     - `NODE_ENV`: `production`
     - `PORT`: `5000` (or provider standard)
     - `ALLOWED_ORIGINS`: Your frontend production domain (e.g. `https://quiz.mscprpcem.tech`).
3. Deploy the Vite frontend to **Azure Static Web Apps**, **Vercel**, or **Netlify** with:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - `VITE_API_URL`: Your backend cloud URL.

---

## 🔧 Step 7: Troubleshooting & FAQ

### Q1: I get `self signed certificate in certificate chain` or SSL handshake error.
**Cause**: Some corporate networks, proxies, or older Node environments intercept TLS traffic.  
**Fix**: In `backend/.env`, set:
```ini
DB_SSL_REJECT_UNAUTHORIZED=false
```
This retains SSL transport encryption (`sslmode=require`) while tolerating custom root certificates.

### Q2: What is the difference between Direct and Pooled connection in Neon?
| Feature | Direct Endpoint (`ep-xyz.neon.tech`) | Pooled Endpoint (`ep-xyz-pooler.neon.tech`) |
| :--- | :--- | :--- |
| **Port** | `5432` | `5432` |
| **Tool** | Direct Postgres Daemon | PgBouncer Proxy |
| **Best For** | Heavy DDL migrations, LISTEN/NOTIFY | **Web API requests, WebSockets, Quiz answer submissions** |
| **Concurrent Clients** | Up to 100-300 | **Thousands of simultaneous connections** |

> **Recommendation**: Always use the **Pooled Endpoint** for the Quiz Platform's `DATABASE_URL`.

### Q3: How do I switch back to local SQLite for offline development?
Simply comment out `DATABASE_URL` in `backend/.env`:
```ini
# DATABASE_URL=postgresql://...
```
The platform will automatically fall back to local `backend/database.sqlite`.

---

## 🤝 Sponsorship & Acknowledgement

The **MSC PRPCEM Quiz Platform** is proudly supported by the **[Neon Open Source Program](https://neon.com)**.

Neon powers our production database tier, providing high availability, auto-scaling compute, and seamless database branching for educational and technical competitions.

<div align="center">
  <br />
  <a href="https://neon.com" target="_blank">
    <img src="assets/neon-logo.svg" alt="Neon Logo" width="280" />
  </a>
  <p><em>Serverless Postgres designed for the modern web.</em></p>
  <a href="https://neon.com">Explore Neon &rarr;</a>
</div>
