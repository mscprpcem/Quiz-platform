const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

const { sequelize, Admin, Quiz, Question } = require('./models');
const { initializeSocket } = require('./services/socket');

// Routes
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');
const brandingRoutes = require('./routes/branding');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
      "https://quiz.mscprpcem.tech",
      "https://www.mscprpcem.tech"
    ];

const corsOriginFn = (origin, callback) => {
  if (!origin) return callback(null, true);
  const isAllowed =
    allowedOrigins.includes(origin) ||
    allowedOrigins.includes('*') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1') ||
    origin.endsWith('.mscprpcem.tech') ||
    origin.endsWith('.azurestaticapps.net') ||
    origin.endsWith('.azurewebsites.net');
  if (isAllowed) {
    callback(null, true);
  } else {
    // Permissive fallback so mobile browsers and preview domains are not blocked
    callback(null, true);
  }
};

// =======================
// Socket.IO
// =======================

const io = new Server(server, {
  cors: {
    origin: corsOriginFn,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});

// =======================
// Security
// =======================

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin: corsOriginFn,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// Static Files
// =======================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"))
);

// =======================
// Rate Limiter
// =======================

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000, // For load testing only
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again later."
  }
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", limiter);

// =======================
// Routes
// =======================

const scheduledQuizRoutes = require('./routes/scheduledQuiz');
const studentSyncRoutes = require('./routes/studentSync');

app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/scheduled-quizzes", scheduledQuizRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/branding", brandingRoutes);
app.use("/api/student", studentSyncRoutes);

// =======================
// Root
// =======================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MSC Quiz Platform API Running"
  });
});

// =======================
// Error Handler
// =======================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// =======================
// Socket Initialization
// =======================

initializeSocket(io);

// =======================
// Start Server
// =======================

async function startServer() {
  try {

    // Test PostgreSQL Connection
    await sequelize.authenticate();
    console.log("✅ Database Connected");

    // Auto-migrate missing columns for SQLite & PostgreSQL production
    const isPostgres = sequelize.getDialect() === 'postgres';
    const quote = isPostgres ? '"' : '`';
    const boolType = isPostgres ? 'BOOLEAN' : 'TINYINT(1)';
    const dateType = isPostgres ? 'TIMESTAMP WITH TIME ZONE' : 'DATETIME';
    const ifNotExists = isPostgres ? 'IF NOT EXISTS ' : '';

    const columns = [
      // Quizzes table
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}mode${quote} VARCHAR(255) DEFAULT 'LIVE';`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}schedule_type${quote} VARCHAR(255);`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}timezone${quote} VARCHAR(255) DEFAULT 'Asia/Kolkata';`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}time_limit${quote} INTEGER DEFAULT 30;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}max_attempts${quote} INTEGER DEFAULT 1;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}score_policy${quote} VARCHAR(255) DEFAULT 'BEST';`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}shuffle_questions${quote} ${boolType} DEFAULT 0;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}shuffle_answers${quote} ${boolType} DEFAULT 0;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}require_fullscreen${quote} ${boolType} DEFAULT 0;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}anti_cheat_enabled${quote} ${boolType} DEFAULT 1;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}max_violations${quote} INTEGER DEFAULT 3;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}positive_marks${quote} INTEGER DEFAULT 1;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}negative_marks${quote} INTEGER DEFAULT 0;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}show_leaderboard${quote} ${boolType} DEFAULT 1;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}schedule_config${quote} TEXT;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}subject${quote} VARCHAR(255) DEFAULT 'DBMS';`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}scheduled_end${quote} ${dateType};`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}verification_synced${quote} ${boolType} DEFAULT 0;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}verification_synced_at${quote} ${dateType};`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}verification_event_id${quote} VARCHAR(255);`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}verification_error${quote} TEXT;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}svg_template${quote} TEXT;`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}custom_slug${quote} VARCHAR(255);`,
      `ALTER TABLE ${quote}Quizzes${quote} ADD COLUMN ${ifNotExists}${quote}badge_title${quote} VARCHAR(255);`,

      // Questions table
      `ALTER TABLE ${quote}Questions${quote} ADD COLUMN ${ifNotExists}${quote}occurrence_number${quote} INTEGER DEFAULT 1;`,
      `ALTER TABLE ${quote}Questions${quote} ADD COLUMN ${ifNotExists}${quote}section_name${quote} VARCHAR(255);`,
      `ALTER TABLE ${quote}Questions${quote} ADD COLUMN ${ifNotExists}${quote}section_description${quote} TEXT;`,

      // Lowercase fallback for Postgres
      ...(isPostgres ? [
        `ALTER TABLE questions ADD COLUMN IF NOT EXISTS occurrence_number INTEGER DEFAULT 1;`,
        `ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_name VARCHAR(255);`,
        `ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_description TEXT;`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS custom_slug VARCHAR(255);`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS mode VARCHAR(255) DEFAULT 'LIVE';`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS schedule_type VARCHAR(255);`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS schedule_config TEXT;`,
        `ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS subject VARCHAR(255) DEFAULT 'DBMS';`
      ] : [])
    ];

    for (const query of columns) {
      try {
        await sequelize.query(query);
      } catch (e) {
        // Column already exists or table sync handled it
      }
    }

    // Sync Database safely for SQLite and PostgreSQL
    try {
      if (sequelize.getDialect() === 'sqlite') {
        await sequelize.sync();
      } else {
        await sequelize.sync();
      }
    } catch (syncErr) {
      console.warn("⚠️ Database sync warning:", syncErr.message);
      await sequelize.sync();
    }

    console.log("✅ Database Synced");

    // Seed & Reset Default Admins
    const defaultAdmins = [
      { email: "admin@microsoftclub.edu", name: "MSC Admin", password: "Admin@123" },
      { email: "admin@mscprpcem.tech", name: "MSC Club Admin", password: "Admin@123" }
    ];

    for (const item of defaultAdmins) {
      const existingAdmin = await Admin.findOne({ where: { email: item.email } });
      if (!existingAdmin) {
        await Admin.create({
          name: item.name,
          email: item.email,
          password: item.password,
          role: "admin"
        });
        console.log(`✅ Default Admin Created: ${item.email}`);
      } else {
        existingAdmin.password = item.password;
        await existingAdmin.save();
        console.log(`✅ Default Admin Password Synced: ${item.email}`);
      }
    }

    // Seed Starter Quizzes if none exist
    const quizCount = await Quiz.count();
    if (quizCount === 0) {
      console.log("🌱 Seeding starter quiz data...");
      
      const now = new Date();
      const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Quiz 1: DBMS Challenge
      const dbmsQuiz = await Quiz.create({
        title: "Database Management Systems (DBMS) Challenge",
        event_name: "MSC DBMS Championship 2026",
        subject: "DBMS",
        join_code: "DBMS01",
        description: "Master SQL queries, Normalization (1NF to BCNF), ACID transaction properties, Indexing B-Trees, and Relational Algebra.",
        status: "waiting_lobby",
        mode: "LIVE",
        scheduled_start: now,
        scheduled_end: oneDayLater,
        time_limit: 30
      });

      await Question.bulkCreate([
        {
          quiz_id: dbmsQuiz.id,
          question: "Which SQL command is used to retrieve data from a relational database table?",
          option_a: "UPDATE",
          option_b: "SELECT",
          option_c: "INSERT",
          option_d: "DELETE",
          correct_answer: "B",
          timer: 30,
          marks: 500,
          order_index: 1
        },
        {
          quiz_id: dbmsQuiz.id,
          question: "In database normalization, which Normal Form eliminates partial dependencies on a composite primary key?",
          option_a: "1NF (First Normal Form)",
          option_b: "2NF (Second Normal Form)",
          option_c: "3NF (Third Normal Form)",
          option_d: "BCNF (Boyce-Codd Normal Form)",
          correct_answer: "B",
          timer: 30,
          marks: 500,
          order_index: 2
        },
        {
          quiz_id: dbmsQuiz.id,
          question: "Which ACID property guarantees that once a transaction completes successfully, changes are permanently saved even if the system crashes?",
          option_a: "Atomicity",
          option_b: "Consistency",
          option_c: "Isolation",
          option_d: "Durability",
          correct_answer: "D",
          timer: 30,
          marks: 500,
          order_index: 3
        },
        {
          quiz_id: dbmsQuiz.id,
          question: "Which type of SQL JOIN returns all records from the left table and matching records from the right table?",
          option_a: "INNER JOIN",
          option_b: "LEFT (OUTER) JOIN",
          option_c: "RIGHT (OUTER) JOIN",
          option_d: "CROSS JOIN",
          correct_answer: "B",
          timer: 30,
          marks: 500,
          order_index: 4
        },
        {
          quiz_id: dbmsQuiz.id,
          question: "What is the primary data structure commonly used by relational databases for table indexing?",
          option_a: "Binary Search Tree",
          option_b: "B-Tree / B+ Tree",
          option_c: "Linked List",
          option_d: "Min-Heap",
          correct_answer: "B",
          timer: 30,
          marks: 500,
          order_index: 5
        }
      ]);

      // Quiz 2: Azure Cloud & AI Fundamentals
      const cloudQuiz = await Quiz.create({
        title: "Microsoft Azure & Cloud Fundamentals",
        event_name: "MSC Cloud Tech Summit 2026",
        subject: "Cloud",
        join_code: "AZU202",
        description: "Explore core Azure services, virtual networks, cloud computing models (IaaS, PaaS, SaaS), and AZ-900 essentials.",
        status: "waiting_lobby",
        mode: "LIVE",
        scheduled_start: now,
        scheduled_end: oneDayLater,
        time_limit: 30
      });

      await Question.bulkCreate([
        {
          quiz_id: cloudQuiz.id,
          question: "Which cloud service model provides maximum user control over the operating system, storage, and networking?",
          option_a: "Software as a Service (SaaS)",
          option_b: "Infrastructure as a Service (IaaS)",
          option_c: "Platform as a Service (PaaS)",
          option_d: "Function as a Service (FaaS)",
          correct_answer: "B",
          timer: 30,
          marks: 500,
          order_index: 1
        },
        {
          quiz_id: cloudQuiz.id,
          question: "Which Azure service provides a serverless compute engine to run event-driven code without managing servers?",
          option_a: "Azure Virtual Machines",
          option_b: "Azure Functions",
          option_c: "Azure Blob Storage",
          option_d: "Azure ExpressRoute",
          correct_answer: "B",
          timer: 30,
          marks: 500,
          order_index: 2
        },
        {
          quiz_id: cloudQuiz.id,
          question: "Which feature in Azure allows distributing network traffic across multiple virtual machines to ensure high availability?",
          option_a: "Azure Load Balancer",
          option_b: "Azure Key Vault",
          option_c: "Azure Cosmos DB",
          option_d: "Azure Policy",
          correct_answer: "A",
          timer: 30,
          marks: 500,
          order_index: 3
        },
        {
          quiz_id: cloudQuiz.id,
          question: "In cloud computing, what does 'Elasticity' mean?",
          option_a: "The ability to dynamically scale resources up or down based on demand",
          option_b: "The ability to run exclusively on Linux servers",
          option_c: "Storing data only in local cache memory",
          option_d: "Connecting to a database without authentication",
          correct_answer: "A",
          timer: 30,
          marks: 500,
          order_index: 4
        },
        {
          quiz_id: cloudQuiz.id,
          question: "Which Azure storage tier is optimal for storing data that is rarely accessed and can tolerate retrieval latency of several hours?",
          option_a: "Hot Access Tier",
          option_b: "Archive Access Tier",
          option_c: "Cool Access Tier",
          option_d: "Premium Solid State Tier",
          correct_answer: "B",
          timer: 30,
          marks: 500,
          order_index: 5
        }
      ]);

      console.log("✅ Starter quiz data seeded successfully!");
    }


    server.listen(PORT, () => {

      console.log("=================================");
      console.log(`🚀 Server Running`);
      console.log(`Port : ${PORT}`);
      console.log(`Environment : ${process.env.NODE_ENV}`);
      console.log("=================================");

    });

  } catch (err) {

    console.error("❌ Server Startup Failed");

    console.error(err);

    process.exit(1);

  }
}

startServer();