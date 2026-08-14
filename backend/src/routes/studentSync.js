const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
let axios;
try {
  axios = require('axios');
} catch (e) {
  axios = {
    post: async (url, data, config) => {
      try {
        if (typeof fetch !== 'undefined') {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(config?.headers || {}) },
            body: JSON.stringify(data)
          });
          const json = await res.json().catch(() => ({}));
          return { data: json, status: res.status };
        }
      } catch (err) {}
      return { data: {} };
    }
  };
}

// In-memory student certificates & OTP store
let studentCertificates = [];
const otpStore = new Map();

// Helper to normalize email
const normalizeEmail = (email) => (email ? email.toLowerCase().trim() : '');

// Username Availability Check Route
router.get('/check-username', async (req, res) => {
  try {
    const rawUsername = req.query.username;
    const clean = (rawUsername || '').toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    if (!clean || clean.length < 3) {
      return res.status(400).json({ available: false, error: 'Username handle must be at least 3 characters.' });
    }
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(clean)) {
      return res.status(400).json({ available: false, error: 'Only letters, numbers, underscores, or hyphens allowed.' });
    }

    // Check in local database
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: clean },
          sequelize.where(sequelize.fn('LOWER', sequelize.col('username')), clean)
        ]
      }
    });

    if (existingUser) {
      return res.json({ available: false, error: 'Username handle is already taken.' });
    }

    // Check in external verification portal if reachable
    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
    try {
      const checkRes = await axios.get(`${verificationPortalUrl}/api/auth/check-username?username=${encodeURIComponent(clean)}`, { timeout: 2500 });
      if (checkRes.data && checkRes.data.available !== undefined) {
        return res.json(checkRes.data);
      }
    } catch (e) {}

    return res.json({ available: true, message: 'Username handle is available!' });
  } catch (err) {
    return res.status(500).json({ available: false, error: 'Error verifying username availability.' });
  }
});

// =======================
// OTP Verification Routes
// =======================
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    otpStore.set(cleanEmail, { otp: otpCode, expiresAt, verified: false });
    console.log(`🔑 Verification OTP generated for ${cleanEmail}: ${otpCode}`);

    // Forward to Verification Portal email service if configured
    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
    axios.post(`${verificationPortalUrl}/api/auth/send-otp`, {
      email: cleanEmail,
      otp: otpCode
    }, { timeout: 3000 }).catch(() => {});

    return res.json({
      success: true,
      message: `OTP sent successfully to ${cleanEmail}. (Code valid for 10 minutes)`
    });
  } catch (err) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ error: 'Failed to send OTP.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !otp) {
      return res.status(400).json({ error: 'Email address and OTP code are required.' });
    }

    const record = otpStore.get(cleanEmail);
    if (!record) {
      return res.status(400).json({ error: 'No active OTP request found. Please request a new OTP code.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanEmail);
      return res.status(400).json({ error: 'OTP code has expired. Please request a new code.' });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Invalid OTP code. Please enter the correct 6-digit code.' });
    }

    record.verified = true;
    otpStore.set(cleanEmail, record);

    return res.json({
      success: true,
      message: 'Email address verified successfully!'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify OTP.' });
  }
});

// =======================
// Student Login with Database Verification
// =======================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password) {
      return res.status(400).json({ error: 'Both Email Address and Password are required.' });
    }

    // 1. Find user in database
    let user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanEmail },
          sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail)
        ]
      }
    });

    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';

    // 2. If not found in local DB, check verification portal
    if (!user) {
      try {
        const syncRes = await axios.post(`${verificationPortalUrl}/api/auth/login`, {
          email: cleanEmail,
          password: password
        }, { timeout: 3500 });

        if (syncRes.data && syncRes.data.user) {
          user = await User.create({
            name: syncRes.data.user.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            username: syncRes.data.user.username || cleanEmail.split('@')[0],
            password: password,
            role: 'student'
          });
        }
      } catch (syncErr) {
        // Portal also does not have user
      }
    }

    // 3. If account still not found, return explicit error
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email. Please register first.' });
    }

    // 4. Verify password with bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please check your credentials.' });
    }

    const studentData = {
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username || user.email.split('@')[0],
      role: user.role || 'student',
      joinedAt: user.createdAt
    };

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role || 'student' },
      process.env.JWT_SECRET || 'msc_prpcem_jwt_secret_2026',
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      user: studentData,
      token,
      verificationPortalUrl
    });
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ error: err.message || 'Server error during login.' });
  }
});

// =======================
// Student Registration with Database Persistence
// =======================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, username } = req.body;
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password || !name) {
      return res.status(400).json({ error: 'Full Name, Email Address, and Password are all required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Check if account already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanEmail },
          sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), cleanEmail)
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in instead.' });
    }

    const studentUsername = (username || cleanEmail.split('@')[0]).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
    if (studentUsername) {
      const existingUsername = await User.findOne({
        where: {
          [Op.or]: [
            { username: studentUsername },
            sequelize.where(sequelize.fn('LOWER', sequelize.col('username')), studentUsername)
          ]
        }
      });
      if (existingUsername) {
        return res.status(400).json({ error: 'This username handle is already taken. Please choose another one.' });
      }
    }

    // Create persistent User in DB (bcrypt hook in model automatically hashes password)
    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      username: studentUsername,
      password: password,
      role: 'student'
    });

    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
    // Async sync with verification portal
    axios.post(`${verificationPortalUrl}/api/auth/external-sync`, {
      email: cleanEmail,
      name: name.trim(),
      username: studentUsername,
      password: password
    }, { timeout: 3500 }).catch(() => {});

    const studentData = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      username: newUser.username,
      role: 'student',
      joinedAt: newUser.createdAt
    };

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, role: 'student' },
      process.env.JWT_SECRET || 'msc_prpcem_jwt_secret_2026',
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered!',
      user: studentData,
      token,
      verificationPortalUrl
    });
  } catch (err) {
    console.error('Student registration error:', err);
    return res.status(500).json({ error: err.message || 'Server error during registration.' });
  }
});

// =======================
// SSO Token Verification (From Verification Portal)
// =======================
router.post('/sso-verify', (req, res) => {
  const { token, email, name } = req.body;
  const sharedSecret = process.env.SSO_SHARED_SECRET || 'msc_prpcem_shared_sso_secret_2026';

  try {
    let studentData = {};
    if (token) {
      studentData = jwt.verify(token, sharedSecret);
    } else if (email) {
      studentData = { email: normalizeEmail(email), name: name || email.split('@')[0] };
    } else {
      return res.status(400).json({ error: 'Token or Email is required for SSO verification.' });
    }

    const cleanEmail = normalizeEmail(studentData.email);
    const localToken = jwt.sign(
      { email: cleanEmail, name: studentData.name, role: 'student' },
      process.env.JWT_SECRET || 'msc_prpcem_jwt_secret_2026',
      { expiresIn: '30d' }
    );

    registeredStudents.set(cleanEmail, { email: cleanEmail, name: studentData.name, role: 'student' });

    return res.json({
      success: true,
      user: {
        email: cleanEmail,
        name: studentData.name,
        role: 'student'
      },
      token: localToken,
      verificationPortalUrl: process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech'
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired SSO token.' });
  }
});

// =======================
// Inbound Account Sync from Verification Portal (Vice Versa)
// =======================
router.post('/external-sync', (req, res) => {
  const { email, name, password, apiKey } = req.body;
  const expectedApiKey = process.env.QUIZ_PLATFORM_API_KEY || 'msc_quiz_api_key_2026';

  if (apiKey && apiKey !== expectedApiKey) {
    return res.status(403).json({ error: 'Invalid API Key' });
  }

  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const studentName = name || cleanEmail.split('@')[0];
  const studentData = {
    email: cleanEmail,
    name: studentName,
    role: 'student',
    joinedAt: new Date().toISOString()
  };

  registeredStudents.set(cleanEmail, studentData);

  const token = jwt.sign(
    { email: cleanEmail, name: studentName, role: 'student' },
    process.env.JWT_SECRET || 'msc_prpcem_jwt_secret_2026',
    { expiresIn: '30d' }
  );

  return res.json({
    success: true,
    message: 'Account synchronized from Verification Portal to Quiz Platform!',
    user: studentData,
    token
  });
});

// =======================
// Issue Certificate & Digital Badge (Syncs directly to D:\certificate-verification DB)
// =======================
router.post('/issue-certificate', async (req, res) => {
  const { email, name, courseTitle, score, passingScore, badgeTitle } = req.body;

  if (!email || !courseTitle) {
    return res.status(400).json({ error: 'Email and Course Title are required.' });
  }

  const cleanEmail = normalizeEmail(email);
  const certificateId = `CERT-MSC-${Date.now().toString().slice(-6)}`;
  const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';

  const certificate = {
    certificateId,
    email: cleanEmail,
    studentName: name || cleanEmail.split('@')[0],
    courseTitle,
    score: score || 100,
    passingScore: passingScore || 70,
    badgeTitle: badgeTitle || `${courseTitle} Certified Master`,
    issuedAt: new Date().toISOString(),
    verificationUrl: `${verificationPortalUrl}/verify/${certificateId}`
  };

  studentCertificates.push(certificate);

  // Dispatch certificate & badge generation directly to Verification Portal API
  axios.post(`${verificationPortalUrl}/api/integration/publish-results`, {
    quizTitle: courseTitle,
    eventName: courseTitle,
    publishDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    attendees: [
      {
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        score: score || 100,
        status: 'passed'
      }
    ]
  }, {
    headers: { 'x-api-key': process.env.VERIFICATION_API_KEY || 'msc_quiz_verification_secret_key_2026' }
  }).catch(err => {
    console.warn('Background certificate publishing warning:', err.message);
  });

  return res.json({
    success: true,
    certificate,
    message: 'Certificate and digital badge successfully issued and linked to your Verification Portal Account!'
  });
});

// =======================
// Query Student Badges & Certificates by Email (For Verification Portal API)
// =======================
router.get('/account-data', (req, res) => {
  const { email, apiKey } = req.query;
  const expectedApiKey = process.env.QUIZ_PLATFORM_API_KEY || 'msc_quiz_api_key_2026';

  if (apiKey && apiKey !== expectedApiKey) {
    return res.status(403).json({ error: 'Invalid API Key' });
  }

  if (!email) {
    return res.status(400).json({ error: 'Email query parameter is required.' });
  }

  const normalizedEmail = normalizeEmail(email);
  const certs = studentCertificates.filter(c => c.email === normalizedEmail);

  return res.json({
    success: true,
    email: normalizedEmail,
    totalCertificates: certs.length,
    certificates: certs,
    verificationPortalUrl: process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech'
  });
});

// =======================
// Available Badges from Verification Portal
// =======================
router.get('/available-badges', async (req, res) => {
  const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
  let portalBadges = [];

  try {
    const response = await axios.get(`${verificationPortalUrl}/api/integration/events`, {
      headers: { 'x-api-key': process.env.VERIFICATION_API_KEY || 'msc_quiz_verification_secret_key_2026' },
      timeout: 3000
    });
    if (response.data && Array.isArray(response.data.events)) {
      portalBadges = response.data.events.map(ev => ({
        id: ev.id || ev._id || ev.slug,
        title: ev.name || ev.title || ev.badgeTitle,
        category: ev.category || 'Certification',
        source: 'verification_portal'
      }));
    }
  } catch (err) {
    // Non-blocking fallback
  }

  // Curated list of verified MSC Club Badges
  const standardBadges = [
    { id: 'azure-cloud-specialist', title: 'Microsoft Azure & Cloud Fundamentals Master', category: 'Cloud' },
    { id: 'dbms-sql-architect', title: 'Database Systems & SQL Specialist', category: 'DBMS' },
    { id: 'dsa-algo-expert', title: 'Data Structures & Algorithms Expert', category: 'DSA' },
    { id: 'fullstack-web-dev', title: 'Full-Stack Web Development Certified Specialist', category: 'Web' },
    { id: 'python-dev-pro', title: 'Python Programming Certified Professional', category: 'Programming' },
    { id: 'ai-machine-learning', title: 'Artificial Intelligence & Machine Learning Specialist', category: 'AI/ML' },
    { id: 'devops-cloud-architect', title: 'DevOps & Cloud Infrastructure Master', category: 'DevOps' },
    { id: 'msc-tech-champion', title: 'MSC PRPCEM Student Tech Champion', category: 'General' }
  ];

  const allBadges = [...portalBadges];
  standardBadges.forEach(std => {
    if (!allBadges.some(b => b.title.toLowerCase() === std.title.toLowerCase())) {
      allBadges.push({ ...std, source: 'msc_catalog' });
    }
  });

  return res.json({
    success: true,
    badges: allBadges,
    verificationPortalUrl
  });
});

module.exports = router;
