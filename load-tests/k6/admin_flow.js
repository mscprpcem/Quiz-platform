import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL =
  __ENV.BASE_URL ||
  'https://quiz-api-sea.azurewebsites.net';

export const options = {
  stages: [
  { duration: '30s', target: 1000 },
  { duration: '2m', target: 1000 },
  { duration: '20s', target: 0 }
],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000']
  }
};

export default function () {

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: "admin@microsoftclub.edu",
      password: "Admin@123"
    }),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  console.log("LOGIN STATUS:", loginRes.status);
  console.log("LOGIN BODY:", loginRes.body);

  check(loginRes, {
    "Login Success": (r) => r.status === 200
  });

  if (loginRes.status !== 200) {
    sleep(1);
    return;
  }

  const body = JSON.parse(loginRes.body);

  const token = body.token;

  if (!token) {
    console.log("JWT Token Missing");
    return;
  }

  const headers = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  const branding = http.get(
    `${BASE_URL}/api/branding`,
    headers
  );

  console.log("BRANDING:", branding.status);

  check(branding, {
    "Branding Success": (r) => r.status === 200
  });

  const quizzes = http.get(
    `${BASE_URL}/api/quizzes`,
    headers
  );

  console.log("QUIZZES:", quizzes.status);
  console.log("QUIZZES BODY:", quizzes.body);

  check(quizzes, {
    "Quiz Success": (r) => r.status === 200
  });

  const root = http.get(`${BASE_URL}/`);

  console.log("ROOT:", root.status);

  check(root, {
    "Root Success": (r) => r.status === 200
  });

  sleep(2);
}