import http from 'k6/http';
import { check, sleep } from 'k6';

// Azure Backend URL
const BASE_URL =
  __ENV.BASE_URL ||
  'https://quiz-api-dhhvcqg2gjapfkbm.centralindia-01.azurewebsites.net';

// Test Type
const TEST_TYPE = __ENV.TEST_TYPE || 'load';

// --------------------
// Load Profiles
// --------------------

let stages = [];

switch (TEST_TYPE) {
  case 'stress':
    stages = [
      { duration: '1m', target: 100 },
      { duration: '2m', target: 200 },
      { duration: '2m', target: 400 },
      { duration: '2m', target: 600 },
      { duration: '1m', target: 0 },
    ];
    break;

  case 'spike':
    stages = [
      { duration: '30s', target: 25 },
      { duration: '15s', target: 400 },
      { duration: '2m', target: 400 },
      { duration: '15s', target: 25 },
      { duration: '1m', target: 25 },
    ];
    break;

  case 'endurance':
    stages = [
      { duration: '2m', target: 200 },
      { duration: '30m', target: 200 },
      { duration: '1m', target: 0 },
    ];
    break;

  default:
    stages = [
      { duration: '30s', target: 25 },
      { duration: '1m', target: 50 },
      { duration: '1m', target: 100 },
      { duration: '1m', target: 200 },
      { duration: '2m', target: 400 },
      { duration: '30s', target: 0 },
    ];
}

export const options = {
  stages,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {

  // --------------------
  // Login
  // --------------------

  const loginPayload = JSON.stringify({
    email: 'admin@microsoftclub.edu',
    password: 'Admin@123',
  });

  const loginHeaders = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    loginPayload,
    loginHeaders
  );

  const loginSuccess = check(loginRes, {
    'Login Status 200': (r) => r.status === 200,
  });

  if (!loginSuccess) {
    console.log(`Login Failed: ${loginRes.status}`);
    sleep(1);
    return;
  }

  let token = "";

  try {
    const body = JSON.parse(loginRes.body);

    token =
      body.token ||
      body.accessToken ||
      body.jwt ||
      "";
  } catch (e) {
    console.log("Invalid Login Response");
    return;
  }

  if (!token) {
    console.log("JWT Token Not Found");
    return;
  }

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // --------------------
  // Branding
  // --------------------

  const brandingRes = http.get(
    `${BASE_URL}/api/branding`,
    authHeaders
  );

  check(brandingRes, {
    'Branding 200': (r) => r.status === 200,
  });

  // --------------------
  // Quizzes
  // --------------------

  const quizzesRes = http.get(
    `${BASE_URL}/api/quizzes`,
    authHeaders
  );

  check(quizzesRes, {
    'Quizzes 200': (r) => r.status === 200,
  });

  // --------------------
  // Home API
  // --------------------

  const homeRes = http.get(
    `${BASE_URL}/`,
    authHeaders
  );

  check(homeRes, {
    'Home API 200': (r) => r.status === 200,
  });

  sleep(Math.random() * 2 + 1);
}