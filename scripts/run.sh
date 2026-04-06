#!/bin/bash

echo "Starting k6 load test..."

k6 run tests/main.js \
  --summary-export=results/summary.json
