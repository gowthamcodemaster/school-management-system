// k6/auth-load-test.js
// Run: k6 run k6/auth-load-test.js
// Install k6: brew install k6 (macOS) or https://k6.io/docs/get-started/installation

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// ── Custom metrics ─────────────────────────────────────────────────
const loginFailRate   = new Rate("login_failures");
const loginDuration   = new Trend("login_duration_ms", true);
const refreshDuration = new Trend("refresh_duration_ms", true);

// ── Test config ────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // Scenario 1: Normal admin login load
    normal_login: {
      executor:         "ramping-vus",
      startVUs:         0,
      stages: [
        { duration: "30s", target: 10 },  // ramp up
        { duration: "1m",  target: 10 },  // hold
        { duration: "15s", target: 0  },  // ramp down
      ],
      gracefulRampDown: "10s",
    },

    // Scenario 2: Brute force simulation (tests your rate limiter)
    brute_force_simulation: {
      executor:   "constant-vus",
      vus:        5,
      duration:   "30s",
      startTime:  "1m45s", // starts after normal_login finishes
    },
  },

  thresholds: {
    http_req_duration:  ["p(95)<500"],   // 95% of requests under 500ms
    http_req_failed:    ["rate<0.01"],   // less than 1% hard failures
    login_failures:     ["rate<0.05"],   // less than 5% login failures (business logic)
    login_duration_ms:  ["p(90)<300"],   // 90% of logins under 300ms
  },
};

const BASE_URL = __ENV.API_URL || "http://localhost:3001";

const VALID_ADMIN = {
  email:    __ENV.TEST_ADMIN_EMAIL    || "superadmin@test.local",
  password: __ENV.TEST_ADMIN_PASSWORD || "TestPassword123!",
};

// ── Helpers ────────────────────────────────────────────────────────
function loginRequest(email, password) {
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { "Content-Type": "application/json" },
      tags:    { name: "login" },
    }
  );
  loginDuration.add(Date.now() - start);
  return res;
}

function refreshRequest(refreshToken) {
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}/auth/refresh`,
    JSON.stringify({ refreshToken }),
    {
      headers: { "Content-Type": "application/json" },
      tags:    { name: "refresh" },
    }
  );
  refreshDuration.add(Date.now() - start);
  return res;
}

// ── Main test function ─────────────────────────────────────────────
export default function () {
  const scenario = __ENV.K6_SCENARIO_NAME;

  if (scenario === "brute_force_simulation") {
    // Test that your rate limiter kicks in
    const res = loginRequest("superadmin@test.local", "WrongPassword!");
    check(res, {
      "rate limiter active (429) or rejected (401)": (r) =>
        r.status === 429 || r.status === 401,
    });
    loginFailRate.add(res.status !== 200);
    sleep(0.5);
    return;
  }

  // ── Normal login flow ────────────────────────────────────────
  const loginRes = loginRequest(VALID_ADMIN.email, VALID_ADMIN.password);

  const loginOk = check(loginRes, {
    "login status 200 or 201":   (r) => r.status === 200 || r.status === 201,
    "returns access token":      (r) => !!r.json("accessToken"),
    "returns partial token (MFA)": (r) =>
      !!r.json("accessToken") || !!r.json("mfaToken"), // handle MFA flow
  });

  loginFailRate.add(!loginOk);

  if (!loginOk) {
    sleep(1);
    return;
  }

  const { refreshToken } = loginRes.json();

  // ── Token refresh flow ───────────────────────────────────────
  if (refreshToken) {
    sleep(1); // simulate user doing something

    const refreshRes = refreshRequest(refreshToken);
    check(refreshRes, {
      "refresh status 200":    (r) => r.status === 200,
      "new access token":      (r) => !!r.json("accessToken"),
    });
  }

  sleep(1);
}

// ── Summary output ─────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    "k6/results/auth-summary.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

// k6 built-in summary helper (available in k6 >= 0.38)
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";
