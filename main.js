import http from 'k6/http';
import { sleep, check } from 'k6';

const BASE_URL = 'https://super.2klips.com';

// 🔥 Use token instead of login (recommended)
const TOKEN = 'your_token_here';

export let options = {
  stages: [
    { duration: '10s', target: 100 },
    { duration: '10s', target: 200 },
    { duration: '10s', target: 300 },
    { duration: '10s', target: 500 },
    { duration: '10s', target: 1000 },
    { duration: '10s', target: 2000 },
    { duration: '10s', target: 3000 },
    { duration: '10s', target: 4000 },
    { duration: '10s', target: 5000 },
    { duration: '2m', target: 5000 },
    { duration: '1m', target: 0 },
  ],
};

export default function () {

  let res = http.get(BASE_URL);

  check(res, {
    'homepage ok': (r) => r.status === 200,
  });

  sleep(1);

  for (let i = 1; i <= 5; i++) {
    let feed = http.get(`${BASE_URL}/api/posts?page=${i}`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    check(feed, {
      'feed ok': (r) => r.status === 200,
    });

    sleep(1);
  }

  sleep(2);
}
