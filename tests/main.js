import http from 'k6/http';
import { sleep, check } from 'k6';

/*
  🔹 ENV VARIABLES (with defaults)
  You can override via CLI or GitHub Actions
*/

const BASE_URL = __ENV.BASE_URL || 'https://super.2klips.com';
const TOKEN = __ENV.TOKEN || 'PASTE_YOUR_TOKEN_HERE';
const FEED_API = __ENV.FEED_API || '/api/posts';

// Optional tuning
const MAX_VUS = Number(__ENV.MAX_VUS) || 1000;
const STEP_VUS = Number(__ENV.STEP_VUS) || 100;
const STEP_DURATION = __ENV.STEP_DURATION || '10s';
const HOLD_DURATION = __ENV.HOLD_DURATION || '1m';

/*
  🔹 Dynamic stages generator
  (increments users by STEP_VUS every STEP_DURATION)
*/
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
  🔹 MAIN TEST FLOW
*/
export default function () {

  // 1️⃣ Homepage
  let home = http.get(BASE_URL);

  check(home, {
    'homepage OK': (r) => r.status === 200,
  });

  sleep(1);

  // 2️⃣ Simulate scroll (feed API)
  for (let i = 1; i <= 5; i++) {
    let feed = http.get(`${BASE_URL}${FEED_API}?page=${i}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    check(feed, {
      'feed OK': (r) => r.status === 200,
      'fast response': (r) => r.timings.duration < 1500,
    });

    sleep(1);
  }

  // 3️⃣ Think time
  sleep(2);
}
