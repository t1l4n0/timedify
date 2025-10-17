#!/usr/bin/env bash
set -euo pipefail
: "${APP_URL:?Set APP_URL}"
curl -fsSL "$APP_URL/health" >/dev/null
echo "✓ Health check passed"
