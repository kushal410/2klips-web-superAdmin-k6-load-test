#!/bin/bash

echo "Starting k6 load test..."

# Default envs (override as needed)
export BASE_URL=${BASE_URL:-https://super.2klips.com}
export FEED_API=${FEED_API:-/api/posts}
export PHONE=${PHONE:-+9779807592153}
export OTP=${OTP:-1234}
export MAX_VUS=${MAX_VUS:-4000}
export STEP_VUS=${STEP_VUS:-100}
export STEP_DURATION=${STEP_DURATION:-10s}

k6 run tests/main.js \
  --summary-export=results/summary.json \
  --out html=results/report.html
