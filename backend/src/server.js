const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize, Admin, BrandSettings } = require('./models');
const { initializeSocket } = require('./services/socket');

// Route Imports
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const analyticsRoutes = require('./routes/analytics');
const exportRoutes = require('./routes/export');
const brandingRoutes = require('./routes/branding');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io initialization with CORS
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev simplicity, can narrow down in production
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 5000;

// Security and utility middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow static files sharing or images if needed
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve uploaded files statically (logos, etc.)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rate Limiter to prevent brute force / flooding
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// API Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/branding', brandingRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'MSC Quiz Platform API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong on the server!' });
});

// WebSocket Initialization
initializeSocket(io);

// Database Synchronization and Seeding
const startServer = async () => {
  try {
    // Sync models
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully.');

    // Seed default admin if none exists
    const adminEmail = 'admin@microsoftclub.edu';
    const existingAdmin = await Admin.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      await Admin.create({
        name: 'MSC Admin',
        email: adminEmail,
        password: 'Admin@123',
        role: 'admin'
      });
      console.log('----------------------------------------------------');
      console.log('Default Admin Account Seeded:');
      console.log(`Email: ${adminEmail}`);
      console.log('Password: Admin@123');
      console.log('----------------------------------------------------');
    } else {
      console.log('Admin account already exists. Skipping seed.');
    }

    // Seed default branding settings if none exist
    const existingBranding = await BrandSettings.findOne();
    if (!existingBranding) {
      await BrandSettings.create({});
      console.log('Default branding settings seeded.');
    } else {
      console.log('Branding settings already exist. Skipping seed.');
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to sync database / start server:', error);
    process.exit(1);
  }
};

startServer();
