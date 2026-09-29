#!/usr/bin/env bash
set -euo pipefail

options=/data/options.json
export ANTHROPIC_API_KEY="$(jq -r '.anthropic_api_key // empty' "$options")"
export OPENAI_API_KEY="$(jq -r '.openai_api_key // empty' "$options")"
export DOMOVIEW_ORCHESTRATOR_PROVIDER="$(jq -r '.orchestrator_provider // "anthropic"' "$options")"
export DOMOVIEW_EXECUTOR_PROVIDER="$(jq -r '.executor_provider // "anthropic"' "$options")"
export DOMOVIEW_VISION_PROVIDER="$(jq -r '.vision_provider // "openai"' "$options")"
export DOMOVIEW_HA_URL="http://supervisor/core"
export DOMOVIEW_HA_TOKEN="${SUPERVISOR_TOKEN:-}"
export DOMOVIEW_HA_CONFIG="/config"
export DOMOVIEW_WORKSPACE="/data/workspace"
export DOMOVIEW_HOST="0.0.0.0"
export DOMOVIEW_PORT="8099"
export DOMOVIEW_INGRESS="true"

exec node /app/studio/server/index.js

