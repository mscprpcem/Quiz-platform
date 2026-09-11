# 🚀 Building and Running MSC Quiz Platform on Neon Serverless Postgres

<div align="center">
  <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 820px; width: 100%;">
    <tr>
      <td align="center" style="background: linear-gradient(180deg, #161616 0%, #0d0d0d 100%); border: 1px solid #27272a; border-radius: 16px; padding: 32px 24px; box-shadow: 0 10px 30px rgba(0, 229, 153, 0.08);">
        <a href="https://neon.com" target="_blank" rel="noopener noreferrer">
          <img src="assets/neon-logo.svg" alt="Neon Serverless Postgres" width="380" />
        </a>
        <br /><br />
        <p style="font-size: 16px; color: #ffffff; margin: 4px 0 8px 0; font-weight: 700;">
          Official Deployment, Architecture &amp; Scaling Guide
        </p>
        <p style="font-size: 13px; color: #a1a1aa; max-width: 640px; line-height: 1.6; margin: 0 auto 16px auto;">
          Complete engineering reference for running the Microsoft Student Club (MSC PRPCEM) Live Quiz &amp; Technical Assessment Platform on <strong>Neon Serverless Postgres</strong>.
        </p>
        <div>
          <a href="https://neon.com" target="_blank">
            <img src="https://img.shields.io/badge/Neon-Serverless%20Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=white" alt="Neon Database" />
          </a>
          &nbsp;
          <a href="https://neon.com" target="_blank">
            <img src="https://img.shields.io/badge/PgBouncer-Pooled%20Concurrency-orange?style=for-the-badge" alt="PgBouncer" />
          </a>
          &nbsp;
          <a href="https://sequelize.org" target="_blank">
            <img src="https://img.shields.io/badge/Sequelize-ORM%20v6-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white" alt="Sequelize" />
          </a>
        </div>
      </td>
    </tr>
  </table>
</div>

---

## 📑 Table of Contents

- [1. ⚡ Architectural Overview & Motivation](#1-architectural-overview--motivation)
- [2. 🏗️ Multi-Tier Topology & Real-Time Data Flow](#2-multi-tier-topology--real-time-data-flow)
- [3. 📊 Benchmark Comparison: Traditional vs. Neon Postgres](#3-benchmark-comparison-traditional-vs-neon-postgres)
- [4. 🛠️ Step 1: Provisioning a Neon Serverless Database](#4-step-1-provisioning-a-neon-serverless-database)
- [5. ⚙️ Step 2: Configuring Environment Variables](#5-step-2-configuring-environment-variables)
- [6. 🚀 Step 3: Building & Running Locally](#6-step-3-building--running-locally)
- [7. 🧪 Step 4: Built-in Neon Diagnostic Verification](#7-step-4-built-in-neon-diagnostic-verification)
- [8. 🌿 Step 5: Advanced Capabilities for Live Competitions](#8-step-5-advanced-capabilities-for-live-competitions)
  - [8.1 Instant Database Branching for Safe Pre-Tournament Dry Runs](#81-instant-database-branching-for-safe-pre-tournament-dry-runs)
  - [8.2 PgBouncer Connection Pooling Under High Concurrency](#82-pgbouncer-connection-pooling-under-high-concurrency)
  - [8.3 Compute Autoscaling & Scale-to-Zero Efficiency](#83-compute-autoscaling--scale-to-zero-efficiency)
- [9. 🐳 Step 6: Production Deployment Recipes](#9-step-6-production-deployment-recipes)
- [10. 🔧 Troubleshooting & Frequently Asked Questions](#10-troubleshooting--frequently-asked-questions)
- [11. 🤝 Open Source Sponsorship & Credits](#11-open-source-sponsorship--credits)

---

## 1. ⚡ Architectural Overview & Motivation

The **MSC PRPCEM Quiz & Assessment Platform** supports two distinct operational modes:
1. **Mode A (Host-Driven Synchronized Live Quizzes)**: Sub-50ms WebSocket room synchronization where admins release questions simultaneously to hundreds of contestants.
2. **Mode B (Candidate-Driven Scheduled Exams)**: Proctored certification testing with anti-cheating full-screen enforcement, negative marking, and independent countdown timers.

### Why Neon Serverless Postgres?

During live tournaments, database workloads experience **intense, bursty write spikes**:
- 500+ contestants submit answers in the final 2 seconds of a question timer.
- Traditional monolithic Postgres instances crash or throw `FATAL: remaining connection slots are reserved for non-replication superuser connections`.
- Monolithic cloud databases stay active 24/7, accumulating idle hosting fees between events.

**[Neon](https://neon.com)** solves these fundamental challenges through a decoupled compute-and-storage architecture:

| Capability | What It Solves for Quiz Platform |
| :--- | :--- |
| **Built-in PgBouncer Pooling** | Absorbs massive answer submission spikes across WebSocket rooms without dropping connections. |
| **Decoupled Serverless Storage** | Separates WAL and database pages onto resilient cloud storage, providing sub-millisecond point-in-time recovery. |
| **Instant Database Branching** | Create an exact staging clone of production data in &lt;1 second to test new questions or conduct dry runs. |
| **Autoscaling &amp; Scale-to-Zero** | Dynamically provisions vCPU/RAM during live competitions and pauses compute when idle to eliminate cloud waste. |

---

## 2. 🏗️ Multi-Tier Topology & Real-Time Data Flow

### Real-Time Quiz Answer Flow (Mermaid Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Contestant as 👩‍💻 Live Contestant
    participant Socket as ⚡ Node.js Socket.IO Room
    participant Backend as 🛡️ Express API Gateway
    participant PgBouncer as 🏊 Neon PgBouncer Pooler (:5432)
    participant NeonCompute as 🐘 Neon Serverless Postgres Compute
    participant NeonStorage as 💾 Decoupled Cloud Storage

    Contestant->>Socket: Emit 'submit_answer' with Question ID & Option
    Socket->>Backend: Validate Session, Timer & Violation Token
    Backend->>PgBouncer: INSERT into "Answers" (Pooled connection checkout)
    PgBouncer->>NeonCompute: Forward query over persistent backend socket
    NeonCompute->>NeonStorage: Stream WAL delta to multi-AZ page servers
    NeonCompute-->>PgBouncer: Query OK (Affected Rows: 1)
    PgBouncer-->>Backend: Return result & immediate connection release
    Backend-->>Socket: Calculate Dynamic Speed/Accuracy Score
    Socket-->>Contestant: Push Real-Time Leaderboard Update (<50ms)
```

### Complete System Topology

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                                │
│        React 18 + Vite + Tailwind CSS + Lucide Icons (SPA Client)       │
└────────────────────┬───────────────────────────────┬────────────────────┘
                     │ REST API (HTTPS)              │ WebSockets (WSS)
                     ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION TIER                              │
│              Node.js + Express Gateway + Socket.IO Cluster              │
│       - Sub-50ms Question Synchronizer      - Auto-Schema Migration     │
│       - Fullscreen Anti-Cheating Guardian   - JWT / SSO / PKCE Provider │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Sequelize ORM (Connection Pool)
                                     │ TLS 1.3 / SSL (sslmode=require)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE TIER                                 │
│                     NEON SERVERLESS POSTGRESQL                          │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │   Neon PgBouncer Connection Pooler (:5432)                      │   │
│   │   - Absorbs 1,000+ simultaneous submissions                     │   │
│   │   - Reusable server sessions, zero client queuing bottlenecks   │   │
│   └────────────────────────────────┬────────────────────────────────┘   │
│                                    ▼                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │   Neon Serverless Compute (PostgreSQL 16)                       │   │
│   │   - Automatic CPU/RAM autoscaling during tournament rounds      │   │
│   │   - Auto-suspend to 0 CU during inactive campus hours           │   │
│   └────────────────────────────────┬────────────────────────────────┘   │
│                                    ▼                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │   Copy-on-Write Branching Storage Engine                        │   │
│   │   - [main] Production Tournament Database                       │   │
│   │   - [staging] Zero-risk clone for question preview and rehearsals│  │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 📊 Benchmark Comparison: Traditional vs. Neon Postgres

| Benchmark Dimension | Traditional Self-Hosted / Managed Postgres | Neon Serverless Postgres |
| :--- | :--- | :--- |
| **Connection Capacity** | Limited (typically 50–150 without custom PgBouncer setup) | **Thousands** via built-in PgBouncer pooler (`-pooler`) |
| **Spike Response Time** | High latency under burst (connection negotiation delays) | **Sub-50ms** persistent pool reuse |
| **Database Clones** | Hours (full `pg_dump` and `pg_restore`) | **&lt;1 second** instant copy-on-write branching |
| **Idle Cost** | Incurs fixed 24/7 compute fees | **$0** when scale-to-zero is active between competitions |
| **Maintenance Overhead** | Manual OS patches, backup scripts, disk expansion | **Zero maintenance**; automatic storage expansion &amp; updates |

---

## 4. 🛠️ Step 1: Provisioning a Neon Serverless Database

1. Sign up or log in at **[https://neon.com](https://neon.com)**.
2. Click **"New Project"** in the Neon Console.
3. Configure your project parameters:
   - **Name**: `msc-quiz-platform`
   - **Postgres version**: `PostgreSQL 16`
   - **Cloud region**: Select the region closest to your application server (e.g., `AWS us-east-1`, `eu-central-1`, or `ap-southeast-1`).
4. Click **"Create Project"**.

### Obtaining Your Pooled Connection String

> [!IMPORTANT]
> **Always select the "Pooled connection" toggle** in the Neon Console. A pooled connection string features `-pooler` in the host domain. This routes all queries through Neon's managed PgBouncer layer, which is essential for handling WebSocket traffic.

Your connection string will have the following structure:
```text
postgresql://[user]:[password]@ep-[endpoint-name]-pooler.[region].neon.tech/[database]?sslmode=require
```

---

## 5. ⚙️ Step 2: Configuring Environment Variables

Create or update your `backend/.env` file:

```ini
# =====================================================================
# SERVER & APPLICATION CONFIGURATION
# =====================================================================
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:5173
PUBLIC_QUIZ_URL=http://localhost:5173

# =====================================================================
# NEON SERVERLESS POSTGRESQL (POOLED CONNECTION)
# =====================================================================
DATABASE_URL=postgresql://alex:YourSecurePassword@ep-cool-feather-a5x1yz-pooler.us-east-1.neon.tech/msc_quiz?sslmode=require
DB_SSL_REJECT_UNAUTHORIZED=true

# =====================================================================
# SECURITY & AUTHENTICATION SECRETS
# =====================================================================
JWT_SECRET=your_super_secret_jwt_key_minimum_256_bits
SSO_SHARED_SECRET=your_sso_shared_secret_key_2026

# =====================================================================
# INITIAL SEED ADMIN CREDENTIALS (Auto-created on fresh installation)
# =====================================================================
ADMIN_EMAIL=admin@mscprpcem.tech
ADMIN_PASSWORD=YourSecureAdminPasswordHere
ADMIN_NAME="MSC Admin"

# =====================================================================
# CORS ALLOWED ORIGINS
# =====================================================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://quiz.mscprpcem.tech
```

---

## 6. 🚀 Step 3: Building & Running Locally

### 1. Install All Dependencies
```bash
npm run install-all
```

### 2. Launch Development Servers
```bash
npm run dev
```

### 3. Observe Automated Initialization
On first boot, the platform connects to Neon, applies automatic schema migrations, and seeds the initial admin and sample quizzes:

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

---

## 7. 🧪 Step 4: Built-in Neon Diagnostic Verification

The repository includes a dedicated diagnostic utility to test your Neon connection, measure round-trip handshake latency, and execute a concurrency stress test against Neon's PgBouncer pool.

Run the diagnostic:
```bash
npm run test:neon
```

### Sample Diagnostic Output:
```text
=============================================================
⚡ MSC QUIZ PLATFORM — NEON SERVERLESS POSTGRES DIAGNOSTIC
=============================================================

🔗 Target Host      : ep-cool-feather-a5x1yz-pooler.us-east-1.neon.tech
🎯 Provider         : Neon Serverless Postgres ✅
🏊 Endpoint Type    : PgBouncer Pooled (Recommended for Quizzes) ✅
⏱️  Handshake Time  : 42 ms
🐘 Engine Version   : PostgreSQL 16.3
🗄️  Database Name    : msc_quiz
👤 Active User      : alex

🔄 Testing Concurrency Through Neon PgBouncer...
✅ Completed 10 concurrent queries in 38 ms (Avg: 3.8 ms/query)

=============================================================
🎉 NEON SERVERLESS POSTGRES DIAGNOSTIC: 100% HEALTHY & READY
=============================================================
```

---

## 8. 🌿 Step 5: Advanced Capabilities for Live Competitions

### 8.1 Instant Database Branching for Safe Pre-Tournament Dry Runs

Before hosting a live competition:
1. In the Neon Console, navigate to **Branches** &rarr; **"Create Branch"**.
2. Set the branch name to `staging-pre-tournament` (Parent: `main`).
3. Neon will instantly provision an isolated database clone with zero storage overhead.
4. Update your staging backend's `DATABASE_URL` to point to the new branch.
5. Conduct full load tests or test new questions. Once complete, delete the branch with zero risk to production data!

```mermaid
gitGraph
    commit id: "Production Main"
    branch staging-pre-tournament
    checkout staging-pre-tournament
    commit id: "Upload 50 New DBMS Questions"
    commit id: "Simulate 500 Students Stress Test"
    checkout main
    commit id: "Live Competition Day (Clean Production Data)"
```

### 8.2 PgBouncer Connection Pooling Under High Concurrency

In `backend/src/config/database.js`, the Sequelize pool is pre-configured to maximize throughput:

```javascript
sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    pool: {
        max: 40,        // Sized for PgBouncer concurrency
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' 
                ? false 
                : (process.env.NODE_ENV === 'production')
        }
    }
});
```

### 8.3 Compute Autoscaling & Scale-to-Zero Efficiency

- **Active Tournament**: Neon automatically scales up compute resources (e.g., from 0.5 CU to 4 CU) to ensure rapid response times during high-stakes speed questions.
- **Between Events**: When activity drops to zero, Neon suspends compute automatically. Compute costs drop to **$0**, and the database wakes up automatically in milliseconds upon the next incoming request.

---

## 9. 🐳 Step 6: Production Deployment Recipes

### Option A: Docker Deployment

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

Build and run container:
```bash
docker build -t msc-quiz-backend ./backend
docker run -d -p 5000:5000 \
  -e DATABASE_URL="postgresql://user:pass@ep-xyz-pooler.neon.tech/msc_quiz?sslmode=require" \
  -e DB_SSL_REJECT_UNAUTHORIZED="true" \
  -e JWT_SECRET="your_production_secret" \
  --name quiz-backend msc-quiz-backend
```

### Option B: Cloud Platforms (Render, Railway, Fly.io, Azure App Service)
1. Link your GitHub repository.
2. Configure build/start commands:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add Environment Variables:
   - `DATABASE_URL`: Your pooled Neon connection string.
   - `DB_SSL_REJECT_UNAUTHORIZED`: `true`
   - `NODE_ENV`: `production`
   - `ALLOWED_ORIGINS`: `https://quiz.mscprpcem.tech`
4. Deploy the frontend to **Azure Static Web Apps**, **Vercel**, or **Netlify** with `npm run build` and `dist` output.

---

## 10. 🔧 Troubleshooting & Frequently Asked Questions

### Q1: I encounter `self signed certificate in certificate chain` errors.
**Resolution**: If deploying behind corporate proxies or cloud environments that inspect TLS packets, add the following to `backend/.env`:
```ini
DB_SSL_REJECT_UNAUTHORIZED=false
```
This preserves transport encryption (`sslmode=require`) while allowing external root certificates.

### Q2: Why should I avoid the direct connection string in web applications?
**Resolution**: The direct connection string connects directly to the Postgres backend without PgBouncer. Under real-time quiz conditions with multiple Socket.IO instances, connection limits will be reached quickly. Always use the `-pooler` connection string.

### Q3: How do I switch back to SQLite for offline development?
**Resolution**: Simply comment out `DATABASE_URL` in `backend/.env`. The application will automatically fall back to local `backend/database.sqlite`.

---

## 11. 🤝 Open Source Sponsorship & Credits

The **MSC PRPCEM Quiz Platform** is proudly supported by the **[Neon Open Source Program](https://neon.com)**.

<div align="center">
  <br />
  <a href="https://neon.com" target="_blank" rel="noopener noreferrer">
    <img src="assets/neon-logo.svg" alt="Neon Logo" width="300" />
  </a>
  <br /><br />
  <p><em>Serverless Postgres built for high concurrency, instant branching, and the modern cloud.</em></p>
  <p>
    <a href="https://neon.com" target="_blank"><strong>Explore Neon Serverless Postgres &rarr;</strong></a>
  </p>
</div>
