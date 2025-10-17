#!/usr/bin/env bash
set -euo pipefail
: "${APP_URL:?Set APP_URL}"
curl -fsSL "$APP_URL/health" >/dev/null
curl -fsSL "$APP_URL/api/ping" >/dev/null
echo "✓ Post-deploy smoke tests passed"
