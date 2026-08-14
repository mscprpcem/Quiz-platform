const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'msc_quiz_secret_key_2026';
const SSO_SHARED_SECRET = process.env.SSO_SHARED_SECRET || 'msc_prpcem_shared_sso_secret_2026';

// Registered OAuth/OIDC Clients
const CLIENTS = {
  'msc-quiz-web': {
    clientId: 'msc-quiz-web',
    clientName: 'MSC Live Quiz Platform',
    redirectUris: [
      'https://quiz.mscprpcem.tech/auth/callback',
      'http://localhost:5173/auth/callback',
      'http://localhost:3000/auth/callback',
      'http://127.0.0.1:5173/auth/callback'
    ]
  },
  'msc-verify-web': {
    clientId: 'msc-verify-web',
    clientName: 'MSC Verification Platform',
    redirectUris: [
      'https://verify.mscprpcem.tech/auth/callback',
      'http://localhost:5174/auth/callback',
      'http://localhost:3000/auth/callback'
    ]
  }
};

// In-memory store for short-lived Authorization Codes (10 min lifetime)
const authorizationCodes = new Map();

// Helper to generate subject_id: usr_8F92AB31
const generateSubjectId = () => {
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `usr_${randomHex}`;
};

// PKCE SHA-256 Verification helper
const verifyPkceChallenge = (verifier, challenge, method = 'S256') => {
  if (!verifier || !challenge) return false;
  if (method === 'plain') return verifier === challenge;
  
  // S256: BASE64URL-ENCODE(SHA256(ASCII(code_verifier)))
  const hash = crypto.createHash('sha256').update(verifier).digest();
  const base64Url = hash.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  return base64Url === challenge;
};

// Validate Client & Redirect URI
const validateClientRedirect = (clientId, redirectUri) => {
  const client = CLIENTS[clientId];
  if (!client) return { valid: false, error: 'Unknown or invalid client_id' };
  
  const isAllowed = client.redirectUris.some(uri => 
    uri.toLowerCase() === (redirectUri || '').toLowerCase() ||
    (process.env.NODE_ENV !== 'production' && redirectUri.includes('localhost'))
  );

  if (!isAllowed) {
    return { valid: false, error: 'Unauthorized redirect_uri for this client' };
  }
  return { valid: true, client };
};

// Create Authorization Code
const createAuthorizationCode = ({ clientId, redirectUri, user, codeChallenge, codeChallengeMethod, scope, state }) => {
  const code = `authcode_${crypto.randomBytes(16).toString('hex')}`;
  const subjectId = user.subject_id || generateSubjectId();

  authorizationCodes.set(code, {
    code,
    clientId,
    redirectUri,
    subjectId,
    email: user.email,
    name: user.name,
    username: user.username || user.email.split('@')[0],
    role: user.role || 'student',
    codeChallenge,
    codeChallengeMethod: codeChallengeMethod || 'S256',
    scope: scope || 'openid profile email',
    state,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 mins
  });

  return { code, subjectId };
};

// Consume Authorization Code & Exchange for Tokens
const exchangeCodeForTokens = async ({ code, clientId, codeVerifier, redirectUri }) => {
  const authRecord = authorizationCodes.get(code);

  if (!authRecord) {
    throw new Error('Invalid or expired authorization code');
  }

  // Code can only be used once
  authorizationCodes.delete(code);

  if (Date.now() > authRecord.expiresAt) {
    throw new Error('Authorization code has expired');
  }

  if (authRecord.clientId !== clientId) {
    throw new Error('Client ID mismatch');
  }

  // Verify PKCE if code_challenge was provided
  if (authRecord.codeChallenge) {
    const isPkceValid = verifyPkceChallenge(codeVerifier, authRecord.codeChallenge, authRecord.codeChallengeMethod);
    if (!isPkceValid) {
      throw new Error('Invalid PKCE code_verifier');
    }
  }

  // Retrieve or create Central User in Database
  let user = await User.findOne({ where: { email: authRecord.email.toLowerCase().trim() } });
  if (!user) {
    user = await User.create({
      subject_id: authRecord.subjectId,
      name: authRecord.name,
      email: authRecord.email,
      username: authRecord.username,
      password: crypto.randomBytes(16).toString('hex'), // Secure dummy password for SSO users
      role: authRecord.role,
      is_verified: true
    });
  } else if (!user.subject_id) {
    user.subject_id = authRecord.subjectId;
    await user.save();
  }

  const payload = {
    sub: user.subject_id || authRecord.subjectId,
    email: user.email,
    name: user.name,
    username: user.username,
    role: user.role || 'student',
    iss: 'https://auth.mscprpcem.tech',
    aud: clientId
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  const idToken = jwt.sign({ ...payload, email_verified: true }, SSO_SHARED_SECRET, { expiresIn: '24h' });

  return {
    accessToken,
    idToken,
    tokenType: 'Bearer',
    expiresIn: 86400,
    user: {
      sub: user.subject_id || authRecord.subjectId,
      email: user.email,
      name: user.name,
      username: user.username,
      role: user.role
    }
  };
};

module.exports = {
  CLIENTS,
  generateSubjectId,
  validateClientRedirect,
  createAuthorizationCode,
  exchangeCodeForTokens,
  verifyPkceChallenge
};
