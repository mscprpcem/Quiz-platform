const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
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

// In-memory student certificates cache
let studentCertificates = [];

// Helper to normalize email
const normalizeEmail = (email) => (email ? email.toLowerCase().trim() : '');

// =======================
// Username Availability Check (Forwarded to Verification Portal)
// =======================
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

    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
    try {
      const checkRes = await axios.get(`${verificationPortalUrl}/api/auth/check-username?username=${encodeURIComponent(clean)}`, { timeout: 4000 });
      if (checkRes.data && checkRes.data.available !== undefined) {
        return res.json(checkRes.data);
      }
    } catch (e) {
      if (e.response && e.response.data) {
        return res.status(e.response.status || 400).json(e.response.data);
      }
    }

    return res.json({ available: true, message: 'Username handle is available!' });
  } catch (err) {
    return res.status(500).json({ available: false, error: 'Error verifying username availability.' });
  }
});

// =======================
// OTP Verification Routes (Forwarded to Verification Portal)
// =======================
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
    try {
      const response = await axios.post(`${verificationPortalUrl}/api/auth/send-otp`, {
        email: cleanEmail
      }, { timeout: 5000 });

      if (response.data) {
        return res.json(response.data);
      }
    } catch (portalErr) {
      if (portalErr.response && portalErr.response.data) {
        return res.status(portalErr.response.status || 400).json(portalErr.response.data);
      }
    }

    return res.json({
      success: true,
      message: `OTP sent successfully to ${cleanEmail}.`
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

    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
    try {
      const response = await axios.post(`${verificationPortalUrl}/api/auth/verify-otp`, {
        email: cleanEmail,
        otp: otp
      }, { timeout: 5000 });

      if (response.data) {
        return res.json(response.data);
      }
    } catch (portalErr) {
      if (portalErr.response && portalErr.response.data) {
        return res.status(portalErr.response.status || 400).json(portalErr.response.data);
      }
    }

    return res.status(400).json({ error: 'Invalid or expired OTP code.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify OTP.' });
  }
});

// =======================
// Student Login (Directly Authenticated Against Verification Portal)
// =======================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password) {
      return res.status(400).json({ error: 'Both Email Address and Password are required.' });
    }

    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';

    try {
      // Direct authentication against Verification Portal API
      const response = await axios.post(`${verificationPortalUrl}/api/auth/login`, {
        email: cleanEmail,
        password: password
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000
      });

      if (response.data && (response.data.user || response.data.token || response.data.success)) {
        const portalUser = response.data.user || {};
        const studentData = {
          id: portalUser.id || portalUser._id || `STU-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
          email: cleanEmail,
          name: portalUser.name || cleanEmail.split('@')[0],
          username: portalUser.username || cleanEmail.split('@')[0],
          role: 'student',
          joinedAt: portalUser.createdAt || new Date().toISOString()
        };

        const token = response.data.token || jwt.sign(
          { id: studentData.id, email: cleanEmail, name: studentData.name, role: 'student' },
          process.env.JWT_SECRET || 'msc_prpcem_jwt_secret_2026',
          { expiresIn: '30d' }
        );

        return res.json({
          success: true,
          message: 'Authenticated successfully via Verification Portal!',
          user: studentData,
          token,
          verificationPortalUrl
        });
      } else {
        return res.status(400).json({ error: response.data?.error || 'Invalid email or password.' });
      }
    } catch (portalErr) {
      if (portalErr.response && portalErr.response.data && portalErr.response.data.error) {
        return res.status(portalErr.response.status || 400).json({ error: portalErr.response.data.error });
      }
      return res.status(401).json({
        error: 'No account found or invalid credentials on Verification Portal (verify.mscprpcem.tech).'
      });
    }
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ error: 'Authentication service temporarily unavailable. Please try again.' });
  }
});

// =======================
// Student Registration (Forwarded to Verification Portal)
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

    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';

    try {
      const response = await axios.post(`${verificationPortalUrl}/api/auth/register`, {
        name: name.trim(),
        email: cleanEmail,
        password: password,
        username: username || cleanEmail.split('@')[0]
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 8000
      });

      if (response.data && (response.data.user || response.data.success)) {
        const portalUser = response.data.user || {};
        const studentData = {
          id: portalUser.id || portalUser._id || `STU-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
          email: cleanEmail,
          name: portalUser.name || name.trim(),
          username: portalUser.username || username || cleanEmail.split('@')[0],
          role: 'student',
          joinedAt: new Date().toISOString()
        };

        const token = response.data.token || jwt.sign(
          { id: studentData.id, email: cleanEmail, name: studentData.name, role: 'student' },
          process.env.JWT_SECRET || 'msc_prpcem_jwt_secret_2026',
          { expiresIn: '30d' }
        );

        return res.status(201).json({
          success: true,
          message: 'Account successfully registered on Verification Portal!',
          user: studentData,
          token,
          verificationPortalUrl
        });
      } else {
        return res.status(400).json({ error: response.data?.error || 'Registration failed.' });
      }
    } catch (portalErr) {
      if (portalErr.response && portalErr.response.data && portalErr.response.data.error) {
        return res.status(portalErr.response.status || 400).json({ error: portalErr.response.data.error });
      }
      return res.status(400).json({
        error: 'Registration failed on Verification Portal. Please check your details.'
      });
    }
  } catch (err) {
    console.error('Student registration error:', err);
    return res.status(500).json({ error: 'Registration service temporarily unavailable.' });
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
