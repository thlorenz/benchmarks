#!/usr/bin/env bash
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

export DEBUG_COLORS=1
export DEBUG='*:(info|error|debug)'

SHARE_BUFFER=0 \
PRODUCERS=4 \
CONSUMERS=4 \
WORDS=40 \
CACHE_UPDATE_DELTA=100 \
  node $DIR/../dist/worker-shared/runner.js

echo ""
echo "+++++++++++++++++++++++++"
echo ""

SHARE_BUFFER=1 \
PRODUCERS=4 \
CONSUMERS=4 \
WORDS=40 \
CACHE_UPDATE_DELTA=100 \
  node $DIR/../dist/worker-shared/runner.js
