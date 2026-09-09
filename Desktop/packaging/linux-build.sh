#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm ci
npm run build:native
PLAYWRIGHT_BROWSERS_PATH="$PWD/resources/runtime" npx playwright-core install chromium
npm run typecheck
npm test
npm run build
node packaging/electron-node.cjs packaging/database-test.cjs
npm run package:linux
# Run test:smoke and test:browser from a real desktop session before release.
