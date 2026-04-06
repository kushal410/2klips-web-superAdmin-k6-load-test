
import http from 'k6/http';
import { sleep, check } from 'k6';

// 🔹 CONFIG
const BASE_URL = 'https://super.2klips.com';

// ✅ IMPORTANT: Replace with real token (login once, copy from browser)
const TOKEN = 'PASTE_YOUR_BEARER_TOKEN_HERE';

// 🔹 LOAD OPTIONS
export let options = {
  scenarios: {
    ramping_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '10s', target: 200 },
        { duration: '10s', target: 300 },
        { duration: '10s', target: 400 },
        { duration: '10s', target: 500 },
        { duration: '10s', target: 1000 },
        { duration: '10s', target: 2000 },
        { duration: '10s', target: 3000 },
        { duration: '10s', target: 4000 },
        { duration: '10s', target: 5000 },
        { duration: '2m', target: 5000 }, // hold load
        { duration: '1m', target: 0 },    // ramp down
      ],
    },
  },

  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.02'],
  },
};

// 🔹 MAIN TEST FLOW
export default function () {

  // 1️⃣ Load homepage
  let homeRes = http.get(BASE_URL);

  check(homeRes, {
    'homepage status 200': (r) => r.status === 200,
  });

  sleep(1);

  // 2️⃣ Simulate scrolling feed (API calls)
  for (let page = 1; page <= 5; page++) {

    let feedRes = http.get(`${BASE_URL}/api/posts?page=${page}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    check(feedRes, {
      'feed status 200': (r) => r.status === 200,
      'feed response < 1.5s': (r) => r.timings.duration < 1500,
    });

    sleep(1); // user scroll delay
  }

  // 3️⃣ Think time (real user pause)
  sleep(2);
}
