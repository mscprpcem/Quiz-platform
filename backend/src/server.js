const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

const { sequelize, Admin } = require('./models');
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

app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/scheduled-quizzes", scheduledQuizRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/branding", brandingRoutes);

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
    console.log("✅ PostgreSQL Connected");

    // Auto-migrate missing columns for SQLite local development
    if (sequelize.getDialect() === 'sqlite') {
      const columns = [
        "ALTER TABLE `Quizzes` ADD COLUMN `mode` VARCHAR(255) DEFAULT 'LIVE';",
        "ALTER TABLE `Quizzes` ADD COLUMN `schedule_type` VARCHAR(255);",
        "ALTER TABLE `Quizzes` ADD COLUMN `timezone` VARCHAR(255) DEFAULT 'Asia/Kolkata';",
        "ALTER TABLE `Quizzes` ADD COLUMN `time_limit` INTEGER DEFAULT 30;",
        "ALTER TABLE `Quizzes` ADD COLUMN `max_attempts` INTEGER DEFAULT 1;",
        "ALTER TABLE `Quizzes` ADD COLUMN `score_policy` VARCHAR(255) DEFAULT 'BEST';",
        "ALTER TABLE `Quizzes` ADD COLUMN `shuffle_questions` TINYINT(1) DEFAULT 0;",
        "ALTER TABLE `Quizzes` ADD COLUMN `shuffle_answers` TINYINT(1) DEFAULT 0;",
        "ALTER TABLE `Quizzes` ADD COLUMN `require_fullscreen` TINYINT(1) DEFAULT 0;",
        "ALTER TABLE `Quizzes` ADD COLUMN `anti_cheat_enabled` TINYINT(1) DEFAULT 1;",
        "ALTER TABLE `Quizzes` ADD COLUMN `max_violations` INTEGER DEFAULT 3;",
        "ALTER TABLE `Quizzes` ADD COLUMN `positive_marks` INTEGER DEFAULT 1;",
        "ALTER TABLE `Quizzes` ADD COLUMN `negative_marks` INTEGER DEFAULT 0;",
        "ALTER TABLE `Quizzes` ADD COLUMN `show_leaderboard` TINYINT(1) DEFAULT 1;",
        "ALTER TABLE `Quizzes` ADD COLUMN `schedule_config` TEXT;"
      ];
      for (const query of columns) {
        try {
          await sequelize.query(query);
        } catch (e) {
          // Column already exists or table sync handled it
        }
      }
    }

    // Sync Database safely for SQLite and PostgreSQL
    try {
      if (sequelize.getDialect() === 'sqlite') {
        await sequelize.sync();
      } else {
        await sequelize.sync({ alter: true });
      }
    } catch (syncErr) {
      console.warn("⚠️ Alter sync warning, falling back to standard sync:", syncErr.message);
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