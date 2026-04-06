# k6 load test — Web SuperAdmin

Run the k6 load test that logs in with OTP and scrolls the feed.

Defaults (can be overridden with env vars):
- `BASE_URL` - https://super.2klips.com
- `PHONE` - +9779807592153
- `OTP` - 1234
- `MAX_VUS` - 4000
- `STEP_VUS` - 100
- `STEP_DURATION` - 10s

Quick run (local):
```bash
./scripts/run.sh
```

Or run with k6 directly with custom envs:
```bash
k6 run tests/main.js --summary-export=results/summary.json --out html=results/report.html \
  -e BASE_URL=https://super.2klips.com -e PHONE=+9779807592153 -e OTP=1234 -e MAX_VUS=4000 -e STEP_VUS=100 -e STEP_DURATION=10s
```

Notes:
- If the repo's authentication endpoint differs, set `BASE_URL` and `FEED_API` appropriately.
- If k6 push fails due to git remote/auth, push manually from your machine.
