const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('dotenv').config();

const { sequelize, Admin, BrandSettings } = require('./models');
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
      "https://quiz.mscprpcem.tech"
    ];

const corsOriginFn = (origin, callback) => {
  if (!origin) return callback(null, true);
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  if (isAllowed) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

// =======================
// Socket.IO
// =======================

const io = new Server(server, {
  cors: {
    origin: corsOriginFn,
    methods: ["GET", "POST", "PUT", "DELETE"],
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
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
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

app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);
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

    // Sync Database
    await sequelize.sync();

    console.log("✅ Database Synced");

    // Seed Default Admin

    const adminEmail = "admin@microsoftclub.edu";

    const admin = await Admin.findOne({
      where: {
        email: adminEmail
      }
    });

    if (!admin) {

      await Admin.create({
        name: "MSC Admin",
        email: adminEmail,
        password: "Admin@123",
        role: "admin"
      });

      console.log("✅ Default Admin Created");

    }

    // Seed Branding

    const branding = await BrandSettings.findOne();

    if (!branding) {

      await BrandSettings.create({});

      console.log("✅ Branding Created");

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