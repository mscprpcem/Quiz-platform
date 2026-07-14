# Live Quiz Load Testing & Optimization Guide

This guide details the expected bottlenecks, system limitations (Azure F1 tier & Neon DB), and recommendations for optimizing your Live Quiz platform to scale to 400+ concurrent participants.

---

## 1. Expected Bottlenecks in Live Quizzes

Live-sync quizzes are highly dynamic and generate massive peaks of write/read traffic in short windows:
- **WebSocket Broadcast Congestion**: When the admin emits `question_released`, the server must instantly push the payload to 400 clients. This creates CPU spikes in the Node.js single-threaded event loop.
- **Synchronized Writes (The Answer Spike)**: When a question's timer expires or participants answer, up to 400 write requests hit the `/submit_answer` event in a 1-5 second window. This can exhaust database connection pools.
- **Memory Consumption**: Each open WebSocket socket connection holds metadata in RAM. Node.js process memory grows linearly with the active user base.

---

## 2. Infrastructure Limitations

### Azure App Service (F1 Free Tier)
> [!WARNING]
> The F1 Free Tier is **unsuitable** for running 400 concurrent WebSocket users due to the following hard limits:
- **CPU Time Limit**: 60 minutes of compute time per day. A 10-minute load test will consume a significant portion of this allowance.
- **WebSocket Limits**: Azure App Service Free and Shared tiers cap concurrent WebSockets to **10 connections** per instance. A 400-user socket test will immediately fail with connection reset errors.
- **Memory Cap**: Limited to 1 GB RAM. 400 concurrent active connections + Express app + database pool overhead will push the memory limit.
- **Recommendation**: Upgrade to a **Basic (B1)** or **Standard (S1)** tier before hosting live events to remove WebSocket limits and ensure dedicated CPU resources.

### Neon PostgreSQL (Free Tier)
- **Max Connections**: Neon's Free Tier has a limit of **100 concurrent connections**.
- **Serverless Cold Starts**: Free databases scale down to 0 compute units after 5 minutes of inactivity. The first request after a pause will encounter a 3-10 second latency spike.
- **Recommendation**: Set up a connection pooler like **PgBouncer** (provided out-of-the-box by Neon via the `-pooler` connection string) to multiplex connection requests.

---

## 3. Platform Optimizations

### Socket.IO Optimizations
1. **Force WebSocket Transport**: Avoid long-polling handshakes by forcing the WebSocket transport directly:
   ```javascript
   // Client side
   const socket = io(URL, { transports: ['websocket'] });
   
   // Server side
   const io = new Server(server, { cors: { ... }, transports: ['websocket'] });
   ```
   This reduces request latency, eliminates the HTTP handshake phase, and bypasses session affinity (sticky sessions) requirements.
2. **Horizontal Scaling**: If scaling across multiple instances, install the official Postgres adapter (`@socket.io/postgres-adapter`) or Redis adapter (`@socket.io/redis-adapter`) to sync events across nodes.

### Sequelize & PostgreSQL Optimizations
1. **Sequelize Connection Pool tuning**:
   Configure the connection pool in `database.js` to protect your DB while maximizing throughput:
   ```javascript
   sequelize = new Sequelize(process.env.DATABASE_URL, {
     dialect: 'postgres',
     pool: {
       max: 40,      // Max active connections (stay well below Neon's 100 limit)
       min: 5,       // Min active connections
       acquire: 30000, // Max wait time in ms for connection before throwing error
       idle: 10000   // Time in ms before closing idle connection
     }
   });
   ```
2. **Index Recommendations**:
   Ensure index creation on foreign keys and search terms:
   - `CREATE INDEX idx_questions_quiz_id ON "Questions" ("quiz_id");` (Speed up question releases)
   - `CREATE INDEX idx_answers_question_id ON "Answers" ("question_id");` (Speed up answer validation)
   - `CREATE INDEX idx_participants_join_code ON "Participants" ("join_code");` (Speed up join validations)

### API & Caching Recommendations
- **Branding & Quiz Metadata Caching**: Branding settings (`BrandSettings`) do not change during a live quiz. Cache the branding configurations in-memory (using `node-cache` or a simple global variable refreshed on save) instead of querying the database on every landing/join page request.
- **Memory Session Cache for Active Quizzes**: Keep the active quiz question flow states in-memory (as done in `activeQuizzes` object in `socket.js`) to completely bypass DB queries when validating question states on answer submission.
