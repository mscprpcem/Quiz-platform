const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, QuizAttempt, Participant } = require('../models');
const { exchangeCodeForTokens, generateSubjectId } = require('../services/ssoProvider');
const { sendOtpEmail } = require('../services/emailService');
let axios;
try {
  axios = require('axios');
} catch (e) {
  axios = {
    get: async (url, config) => {
      try {
        if (typeof fetch !== 'undefined') {
          const res = await fetch(url, {
            method: 'GET',
            headers: config?.headers || {}
          });
          const json = await res.json().catch(() => ({}));
          return { data: json, status: res.status };
        }
      } catch (err) {}
      return { data: {} };
    },
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
// Username Availability Check (Local DB + Verification Portal Fallback)
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

    // Check local database first
    if (User) {
      const existingUser = await User.findOne({ where: { username: clean } });
      if (existingUser) {
        return res.json({ available: false, error: 'Username handle is already taken.' });
      }
    }

    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
    try {
      if (axios && typeof axios.get === 'function') {
        const checkRes = await axios.get(`${verificationPortalUrl}/api/auth/check-username?username=${encodeURIComponent(clean)}`, { timeout: 4000 });
        if (checkRes.data && checkRes.data.available !== undefined) {
          return res.json(checkRes.data);
        }
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.available !== undefined) {
        return res.json(e.response.data);
      }
    }

    return res.json({ available: true, message: 'Username handle is available!' });
  } catch (err) {
    console.error('Check username error:', err);
    return res.json({ available: true, message: 'Username handle is available!' });
  }
});

// =======================
// OTP Verification Routes (Local DB + Verification Portal)
// =======================
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    let localUser = null;
    if (User) {
      localUser = await User.findOne({ where: { email: cleanEmail } });
    }

    const generatedOtp = crypto.randomInt(100000, 1000000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    if (localUser) {
      localUser.otp = generatedOtp;
      localUser.otp_expiry = expiry;
      await localUser.save();
    }

    // Send real OTP email via Nodemailer
    try {
      await sendOtpEmail({
        to: cleanEmail,
        name: localUser?.name,
        otp: generatedOtp,
        type: 'login'
      });
    } catch (mailErr) {
      console.warn('Direct email dispatch notice:', mailErr.message);
    }

    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
    try {
      if (axios && typeof axios.post === 'function') {
        const response = await axios.post(`${verificationPortalUrl}/api/auth/send-otp`, {
          email: cleanEmail
        }, { timeout: 5000 });

        if (response.data && response.data.success) {
          return res.json(response.data);
        }
      }
    } catch (portalErr) {
      console.warn('Portal send OTP notice:', portalErr.message);
    }

    if (localUser) {
      return res.json({
        success: true,
        message: `Verification code sent to your registered email address (${cleanEmail}).`
      });
    }

    return res.status(404).json({ error: 'No account found with this email address. Please register a new account.' });
  } catch (err) {
    console.error('Send OTP error:', err);
    return res.status(500).json({ error: 'Failed to send OTP.' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const cleanEmail = normalizeEmail(email);
    const inputOtp = otp ? otp.toString().trim() : '';

    if (!cleanEmail || !inputOtp) {
      return res.status(400).json({ error: 'Email address and OTP code are required.' });
    }

    let localUser = null;
    if (User) {
      localUser = await User.findOne({ where: { email: cleanEmail } });
    }

    if (localUser && localUser.otp === inputOtp) {
      if (localUser.otp_expiry && new Date(localUser.otp_expiry) < new Date()) {
        return res.status(400).json({ error: 'OTP code has expired. Please request a new code.' });
      }
      return res.json({ success: true, message: 'OTP verified successfully.' });
    }

    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
    try {
      if (axios && typeof axios.post === 'function') {
        const response = await axios.post(`${verificationPortalUrl}/api/auth/verify-otp`, {
          email: cleanEmail,
          otp: inputOtp
        }, { timeout: 5000 });

        if (response.data && response.data.success) {
          return res.json(response.data);
        }
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
// In-App Forgot Password & Password Reset (Local DB + Verification Portal)
// =======================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    let localUser = null;
    if (User) {
      localUser = await User.findOne({ where: { email: cleanEmail } });
    }

    const generatedOtp = crypto.randomInt(100000, 1000000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    if (localUser) {
      localUser.otp = generatedOtp;
      localUser.otp_expiry = expiry;
      await localUser.save();
    }

    // Send real password reset OTP email via Nodemailer
    try {
      await sendOtpEmail({
        to: cleanEmail,
        name: localUser?.name,
        otp: generatedOtp,
        type: 'password_reset'
      });
    } catch (mailErr) {
      console.warn('Direct email dispatch notice:', mailErr.message);
    }

    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
    try {
      if (axios && typeof axios.post === 'function') {
        const response = await axios.post(`${verificationPortalUrl}/api/auth/forgot-password`, {
          email: cleanEmail
        }, { timeout: 6000 });

        if (response.data && response.data.success) {
          return res.json(response.data);
        }
      }
    } catch (portalErr) {
      console.warn('Portal forgot password warning:', portalErr.message);
    }

    if (localUser) {
      return res.json({
        success: true,
        message: `Password reset verification code sent to ${cleanEmail}.`
      });
    }

    return res.status(404).json({ error: 'No account found with this email address. Please register a new account.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Failed to request password reset OTP.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const cleanEmail = normalizeEmail(email);
    const inputOtp = otp ? otp.toString().trim() : '';

    if (!cleanEmail || !inputOtp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP code, and new password are all required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    let localUser = null;
    if (User) {
      localUser = await User.findOne({ where: { email: cleanEmail } });
    }

    let resetDoneLocally = false;
    if (localUser) {
      // Validate OTP (or allow reset if valid local OTP)
      if (localUser.otp && localUser.otp === inputOtp) {
        if (localUser.otp_expiry && new Date(localUser.otp_expiry) < new Date()) {
          return res.status(400).json({ error: 'OTP code has expired. Please request a new OTP code.' });
        }
        localUser.password = newPassword;
        localUser.otp = null;
        localUser.otp_expiry = null;
        await localUser.save();
        resetDoneLocally = true;
      }
    }

    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
    try {
      if (axios && typeof axios.post === 'function') {
        const response = await axios.post(`${verificationPortalUrl}/api/auth/reset-password`, {
          email: cleanEmail,
          otp: inputOtp,
          newPassword,
          password: newPassword
        }, { timeout: 6000 });

        if (response.data && response.data.success) {
          return res.json(response.data);
        }
      }
    } catch (portalErr) {
      console.warn('Portal reset password warning:', portalErr.message);
    }

    if (resetDoneLocally) {
      return res.json({ success: true, message: 'Password reset successfully! You can now log in.' });
    }

    if (localUser && !resetDoneLocally) {
      // If localUser exists but OTP didn't match
      return res.status(400).json({ error: 'Invalid or expired OTP code.' });
    }

    return res.status(400).json({ error: 'Unable to reset password. Please check your OTP code and try again.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// =======================
// Central OAuth 2.0 Code Exchange Endpoint
// POST /api/student/oauth/exchange
// =======================
router.post('/oauth/exchange', async (req, res) => {
  try {
    const { code, client_id, code_verifier, redirect_uri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'Authorization code is required.' });
    }

    const clientId = client_id || 'msc-quiz-web';

    const tokenResponse = await exchangeCodeForTokens({
      code,
      clientId,
      codeVerifier: code_verifier,
      redirectUri
    });

    const ssoUser = tokenResponse.user;
    const cleanEmail = normalizeEmail(ssoUser.email);
    const subjectId = ssoUser.sub || generateSubjectId();

    // Find or sync central user in local database
    let localUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanEmail },
          { subject_id: subjectId }
        ]
      }
    });

    if (!localUser) {
      localUser = await User.create({
        subject_id: subjectId,
        name: ssoUser.name,
        email: cleanEmail,
        username: ssoUser.username || cleanEmail.split('@')[0],
        password: crypto.randomBytes(32).toString('hex'),
        role: ssoUser.role || 'student',
        is_verified: true
      });
    } else {
      let updated = false;
      if (!localUser.subject_id) {
        localUser.subject_id = subjectId;
        updated = true;
      }
      if (ssoUser.name && localUser.name !== ssoUser.name) {
        localUser.name = ssoUser.name;
        updated = true;
      }
      if (updated) {
        await localUser.save();
      }
    }

    // Auto-link existing QuizAttempts and Participants by email to sso_user_id
    if (QuizAttempt) {
      await QuizAttempt.update(
        { sso_user_id: subjectId },
        { where: { participant_email: cleanEmail, sso_user_id: null } }
      ).catch(() => {});
    }

    if (Participant) {
      await Participant.update(
        { sso_user_id: subjectId },
        { where: { email: cleanEmail, sso_user_id: null } }
      ).catch(() => {});
    }

    const studentData = {
      id: localUser.id,
      subject_id: subjectId,
      sso_user_id: subjectId,
      email: cleanEmail,
      name: localUser.name,
      username: localUser.username || cleanEmail.split('@')[0],
      role: localUser.role || 'student',
      joinedAt: localUser.createdAt || new Date().toISOString()
    };

    const JWT_SECRET = process.env.JWT_SECRET || 'msc_quiz_secret_key_2026';
    const token = jwt.sign(
      { id: localUser.id, sub: subjectId, sso_user_id: subjectId, email: cleanEmail, name: localUser.name, role: studentData.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      message: 'Authenticated successfully via MSC Central SSO!',
      user: studentData,
      token,
      idToken: tokenResponse.idToken
    });
  } catch (err) {
    console.error('OAuth Exchange Error:', err.message);
    return res.status(400).json({ error: 'invalid_grant', error_description: err.message });
  }
});

// =======================
// Get Current Session Student User Info
// GET /api/student/me
// =======================
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'msc_quiz_secret_key_2026';
    const decoded = jwt.verify(token, JWT_SECRET);

    const localUser = await User.findOne({
      where: {
        [Op.or]: [
          ...(decoded.sub ? [{ subject_id: decoded.sub }] : []),
          ...(decoded.email ? [{ email: decoded.email }] : [])
        ]
      }
    });

    if (!localUser) {
      return res.status(404).json({ error: 'Student account not found.' });
    }

    return res.json({
      success: true,
      user: {
        id: localUser.id,
        subject_id: localUser.subject_id,
        sso_user_id: localUser.subject_id,
        email: localUser.email,
        name: localUser.name,
        username: localUser.username,
        role: localUser.role
      }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token.' });
  }
});

// =======================
// Student Login (Verification Portal + Local DB Fallback)
// =======================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password) {
      return res.status(400).json({ error: 'Both Email Address and Password are required.' });
    }

    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';

    // 1. Try Remote Verification Portal API
    try {
      if (axios && typeof axios.post === 'function') {
        const response = await axios.post(`${verificationPortalUrl}/api/auth/login`, {
          email: cleanEmail,
          password: password
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
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

          // Also sync user locally in background
          if (User) {
            User.findOne({ where: { email: cleanEmail } }).then(async (found) => {
              if (!found) {
                await User.create({
                  name: studentData.name,
                  email: cleanEmail,
                  username: studentData.username,
                  password: password,
                  is_verified: true
                }).catch(() => {});
              }
            }).catch(() => {});
          }

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
        }
      }
    } catch (portalErr) {
      console.warn('Portal auth fallback to local DB:', portalErr.message);
    }

    // 2. Fallback to Local Database (User model)
    if (User) {
      const localUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: cleanEmail },
            { username: cleanEmail }
          ]
        }
      });
      if (localUser) {
        let isMatch = false;
        try {
          isMatch = await localUser.comparePassword(password);
        } catch (e) {
          console.warn('Password compare exception:', e.message);
        }

        if (isMatch) {
          const studentData = {
            id: localUser.id,
            email: localUser.email,
            name: localUser.name,
            username: localUser.username || localUser.email.split('@')[0],
            role: 'student',
            joinedAt: localUser.createdAt || new Date().toISOString()
          };

          const token = jwt.sign(
            { id: studentData.id, email: studentData.email, name: studentData.name, role: 'student' },
            process.env.JWT_SECRET || 'msc_prpcem_jwt_secret_2026',
            { expiresIn: '30d' }
          );

          return res.json({
            success: true,
            message: 'Authenticated successfully!',
            user: studentData,
            token
          });
        } else {
          return res.status(401).json({ error: 'Invalid email address or password.' });
        }
      }
    }

    return res.status(404).json({ error: 'Account not found. Please check your email or create a new account.' });
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ error: 'Authentication service temporarily unavailable. Please try again.' });
  }
});

// In-memory store for pending registration OTPs
const pendingOtpStore = new Map();

// =======================
// Student Registration (Local DB + Verification Portal Sync with OTP Verification)
// =======================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, username, otp } = req.body;
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password || !name) {
      return res.status(400).json({ error: 'Full Name, Email Address, and Password are all required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const cleanName = name.trim();
    const cleanUsername = (username || cleanEmail.split('@')[0]).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');

    // 1. Check local database for existing account
    if (User) {
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: cleanEmail },
            ...(cleanUsername ? [{ username: cleanUsername }] : [])
          ]
        }
      });

      if (existingUser) {
        if (existingUser.email === cleanEmail) {
          return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
        }
        if (existingUser.username && existingUser.username === cleanUsername) {
          return res.status(400).json({ error: 'This username handle is already taken. Please choose another.' });
        }
      }
    }

    const inputOtp = otp ? otp.toString().trim() : '';

    // If OTP is NOT provided yet, initiate Pre-registration (Send OTP)
    if (!inputOtp) {
      const generatedOtp = crypto.randomInt(100000, 1000000).toString();
      const expiry = Date.now() + 15 * 60 * 1000; // 15 mins

      pendingOtpStore.set(cleanEmail, { otp: generatedOtp, expiry });

      // Send real registration OTP email via Nodemailer
      try {
        await sendOtpEmail({
          to: cleanEmail,
          name: cleanName,
          otp: generatedOtp,
          type: 'registration'
        });
      } catch (mailErr) {
        console.warn('Direct email dispatch notice:', mailErr.message);
      }

      return res.json({
        success: true,
        requireVerification: true,
        email: cleanEmail,
        message: `Verification code sent to ${cleanEmail}. Please enter your 6-digit OTP code to complete registration.`
      });
    }

    // Verify OTP provided
    const pendingRecord = pendingOtpStore.get(cleanEmail);
    let isOtpValid = false;

    if (pendingRecord && pendingRecord.otp === inputOtp) {
      if (Date.now() <= pendingRecord.expiry) {
        isOtpValid = true;
      } else {
        return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
      }
    }

    if (!isOtpValid) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your OTP code and try again.' });
    }

    // OTP Verified -> Remove from pending store
    pendingOtpStore.delete(cleanEmail);

    // 2. Create in Local Database
    let localUser = null;
    if (User) {
      localUser = await User.create({
        name: cleanName,
        email: cleanEmail,
        username: cleanUsername,
        password: password,
        is_verified: true
      });
    }

    const studentData = {
      id: localUser ? localUser.id : `STU-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
      email: cleanEmail,
      name: cleanName,
      username: cleanUsername,
      role: 'student',
      joinedAt: new Date().toISOString()
    };

    // 3. Sync with Verification Portal (Best effort)
    const verificationPortalUrl = process.env.VERIFICATION_PORTAL_URL || 'https://verify.mscprpcem.tech';
    try {
      if (axios && typeof axios.post === 'function') {
        await axios.post(`${verificationPortalUrl}/api/auth/register`, {
          name: cleanName,
          email: cleanEmail,
          password: password,
          username: cleanUsername
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }).catch(() => {});
      }
    } catch (portalErr) {
      console.warn('Portal background registration sync notice:', portalErr.message);
    }

    const token = jwt.sign(
      { id: studentData.id, email: cleanEmail, name: studentData.name, role: 'student' },
      process.env.JWT_SECRET || 'msc_prpcem_jwt_secret_2026',
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      user: studentData,
      token,
      verificationPortalUrl
    });
  } catch (err) {
    console.error('Student registration error:', err);
    return res.status(500).json({ error: 'Registration failed. Please check your details and try again.' });
  }
});

// =======================
// SSO Token Verification (From Verification Portal)
// =======================
router.post('/sso-verify', (req, res) => {
  const { token } = req.body;
  const sharedSecret = process.env.SSO_SHARED_SECRET || 'msc_prpcem_shared_sso_secret_2026';

  if (!token) {
    return res.status(400).json({ error: 'Signed SSO Token is required for verification.' });
  }

  try {
    const studentData = jwt.verify(token, sharedSecret);
    const cleanEmail = normalizeEmail(studentData.email);

    if (!cleanEmail) {
      return res.status(400).json({ error: 'Invalid token payload: Email is required.' });
    }

    const localToken = jwt.sign(
      { sub: studentData.sub, email: cleanEmail, name: studentData.name, role: studentData.role || 'student' },
      process.env.JWT_SECRET || 'msc_quiz_secret_key_2026',
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      user: {
        email: cleanEmail,
        name: studentData.name || cleanEmail.split('@')[0],
        role: studentData.role || 'student'
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
router.post('/external-sync', async (req, res) => {
  const { email, name, password, apiKey } = req.body;
  const expectedApiKey = process.env.QUIZ_PLATFORM_API_KEY;

  if (!apiKey || (expectedApiKey && apiKey !== expectedApiKey)) {
    return res.status(401).json({ error: 'Unauthorized: Valid API Key is required.' });
  }

  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const studentName = name || cleanEmail.split('@')[0];
  if (User && password) {
    const existing = await User.findOne({ where: { email: cleanEmail } });
    if (!existing) {
      await User.create({
        name: studentName,
        email: cleanEmail,
        username: cleanEmail.split('@')[0],
        password: password,
        is_verified: true
      }).catch(() => {});
    }
  }

  const studentData = {
    email: cleanEmail,
    name: studentName,
    role: 'student',
    joinedAt: new Date().toISOString()
  };

  const token = jwt.sign(
    { email: cleanEmail, name: studentName, role: 'student' },
    process.env.JWT_SECRET || 'msc_quiz_secret_key_2026',
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
// Issue Certificate & Digital Badge (Syncs directly to Verification DB)
// =======================
router.post('/issue-certificate', async (req, res) => {
  const { email, name, courseTitle, score, passingScore, badgeTitle } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token is required.' });
  }

  const sessionToken = authHeader.split(' ')[1];
  let decodedUser;
  try {
    decodedUser = jwt.verify(sessionToken, process.env.JWT_SECRET || 'msc_quiz_secret_key_2026');
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  if (!email || !courseTitle) {
    return res.status(400).json({ error: 'Email and Course Title are required.' });
  }

  const cleanEmail = normalizeEmail(email);
  if (decodedUser.role !== 'admin' && normalizeEmail(decodedUser.email) !== cleanEmail) {
    return res.status(403).json({ error: 'Forbidden: Cannot issue certificates for another user account.' });
  }

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

  // Dispatch certificate & badge generation directly to Verification Portal API if API key is configured
  if (process.env.VERIFICATION_API_KEY) {
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
      headers: { 'x-api-key': process.env.VERIFICATION_API_KEY }
    }).catch(err => {
      console.warn('Background certificate publishing warning:', err.message);
    });
  }

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
  const expectedApiKey = process.env.QUIZ_PLATFORM_API_KEY;

  if (!apiKey || (expectedApiKey && apiKey !== expectedApiKey)) {
    return res.status(401).json({ error: 'Unauthorized: Valid API Key is required.' });
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
