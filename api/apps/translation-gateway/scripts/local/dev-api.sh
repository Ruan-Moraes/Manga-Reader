#!/usr/bin/env bash
# DEV LOCAL ONLY. Public gateway API (8084) against real GCP providers, using the operator's private env file
# (copy gateway-real.env.example to ~/.config/toonlira/gateway-real.env; never commit it).
set -euo pipefail
ENV_FILE="${GATEWAY_ENV_FILE:-$HOME/.config/toonlira/gateway-real.env}"
[[ -f "$ENV_FILE" ]] || { echo "env file not found: $ENV_FILE (see gateway-real.env.example)"; exit 1; }
# shellcheck disable=SC1090
. "$ENV_FILE"
# Test batches go past the daily quotas here; capabilities still disclose them and deployments always enforce them.
export GATEWAY_QUOTA_ENFORCED="${GATEWAY_QUOTA_ENFORCED:-false}"
cd "$(dirname "$0")/../../../.."   # api/
exec ./mvnw -q -pl apps/translation-gateway spring-boot:run
