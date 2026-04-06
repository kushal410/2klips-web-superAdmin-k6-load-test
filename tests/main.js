import http from 'k6/http';
import { sleep, check } from 'k6';

/*
  k6 load test with automatic OTP login + scrolling
  - Defaults tuned to your request: ramp up to 4000 VUs, step 100 every 10s
  - Default phone and otp: +9779807592153 / 1234 (override with env vars)
*/

const BASE_URL = __ENV.BASE_URL || 'https://super.2klips.com';
const PHONE = __ENV.PHONE || '+9779807592153';
const OTP = __ENV.OTP || '1234';
const FEED_API = __ENV.FEED_API || '/api/posts';

// Load tuning (defaults to requested values)
const MAX_VUS = Number(__ENV.MAX_VUS) || 4000;
const STEP_VUS = Number(__ENV.STEP_VUS) || 100;
const STEP_DURATION = __ENV.STEP_DURATION || '10s';
const HOLD_DURATION = __ENV.HOLD_DURATION || '1m';

function generateStages(maxVus, stepVus, stepDuration) {
  let stages = [];
  for (let vus = stepVus; vus <= maxVus; vus += stepVus) {
    stages.push({ duration: stepDuration, target: vus });
  }
  return stages;
}

export let options = {
  scenarios: {
    ramping_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        ...generateStages(MAX_VUS, STEP_VUS, STEP_DURATION),
        { duration: HOLD_DURATION, target: MAX_VUS },
        { duration: '30s', target: 0 },
      ],
    },
  },

  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.02'],
  },
};

/*
  Robust login helper:
  - Tries multiple common endpoints and body shapes
  - Extracts token from common response fields
*/
function extractToken(json) {
  if (!json) return null;
  if (json.access_token) return json.access_token;
  if (json.token) return json.token;
  if (json.data) {
    if (json.data.access_token) return json.data.access_token;
    if (json.data.token) return json.data.token;
  }
  return null;
}

function tryLogin() {
  const endpoints = ['/api/auth/login', '/api/auth/otp', '/api/login', '/auth/otp', '/api/auth/verify-otp'];
  const bodies = [
    { phone: PHONE, otp: OTP },
    { mobile: PHONE, otp: OTP },
    { phone_number: PHONE, otp: OTP },
    { username: PHONE, password: OTP },
  ];

  for (let ep of endpoints) {
    const url = `${BASE_URL}${ep}`;
    for (let body of bodies) {
      const res = http.post(url, JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
      if (res && res.status >= 200 && res.status < 300) {
        let json = {};
        try {
          json = res.json();
        } catch (e) {
          // not JSON, continue
        }
        const t = extractToken(json);
        if (t) {
          return t;
        }
      }
    }
  }
  return null;
}

export default function () {

  // 1) Homepage
  let home = http.get(BASE_URL);
  check(home, { 'homepage OK': (r) => r.status === 200 });
  sleep(1);

  // 2) Attempt login (per VU iteration). If login succeeds, use Bearer token.
  let token = tryLogin();
  if (!token) {
    console.log('Warning: login failed for VU, continuing without token');
  }

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // 3) Simulate scrolling via feed API pages
  for (let i = 1; i <= 5; i++) {
    let feed = http.get(`${BASE_URL}${FEED_API}?page=${i}`, { headers });
    check(feed, {
      'feed OK': (r) => r.status === 200,
      'fast response': (r) => r.timings.duration < 1500,
    });
    sleep(1);
  }

  // 4) Think time
  sleep(2);
}
