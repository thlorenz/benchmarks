#!/usr/bin/env bash
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

export DEBUG_COLORS=1
export DEBUG='*:*:(info|debug)'

echo ""

TRANSFER=0 \
WRAP=0 \
ts-node $DIR/../src/workers/run.ts 

echo ""

TRANSFER=1 \
WRAP=0 \
ts-node $DIR/../src/workers/run.ts 

echo ""

TRANSFER=0 \
WRAP=1 \
ts-node $DIR/../src/workers/run.ts 

# Note that the below is invalid as JS objects cannot be transferred
# TRANSFER=1 \
# WRAP=1 \
# ts-node $DIR/../src/workers/run.ts 
