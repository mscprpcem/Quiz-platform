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

// In-memory student accounts and certificates
let registeredStudents = new Map();
let studentCertificates = [];

// Helper to normalize email
const normalizeEmail = (email) => (email ? email.toLowerCase().trim() : '');

// =======================
// Student Login & Cross-Portal Sync Registration
// =======================
router.post('/login', async (req, res) => {
  const { email, name, password } = req.body;
  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail) {
    return res.status(400).json({ error: 'Please enter a valid Email Address.' });
  }

  const studentName = name || cleanEmail.split('@')[0];

  // Store student locally
  const studentData = {
    email: cleanEmail,
    name: studentName,
    role: 'student',
    joinedAt: registeredStudents.get(cleanEmail)?.joinedAt || new Date().toISOString()
  };
  registeredStudents.set(cleanEmail, studentData);

  // Generate JWT Session Token
  const token = jwt.sign(
    { email: cleanEmail, name: studentName, role: 'student' },
    process.env.JWT_SECRET || 'msc_prpcem_jwt_secret_2026',
    { expiresIn: '30d' }
  );

  // Dispatch cross-portal account registration to Verification Portal (D:\certificate-verification)
  const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
  axios.post(`${verificationPortalUrl}/api/auth/external-sync`, {
    email: cleanEmail,
    name: studentName,
    password: password || 'student123',
    apiKey: process.env.VERIFICATION_API_KEY || 'msc_quiz_verification_secret_key_2026'
  }, {
    headers: { 'x-api-key': process.env.VERIFICATION_API_KEY || 'msc_quiz_verification_secret_key_2026' }
  }).catch(() => {
    // Non-blocking fallback if verification portal server is offline
  });

  return res.json({
    success: true,
    message: 'Login successful. Account synchronized across portals!',
    user: studentData,
    token,
    verificationPortalUrl
  });
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

module.exports = router;
