#!/usr/bin/env bash
# DEV LOCAL ONLY. The volatile gateway (contract v2: page in, translated page out, nothing stored) on 8084, against
# real GCP providers, with the stored pipeline's analysis ported to it: balloon grouping (layout), re-reading of
# doubtful speech, chapter memory and glossary, the Gemini review and LaMa inpainting.
#
# Uses the operator's private env file (gateway-real.env) for the providers and database, and overrides what the
# volatile runtime requires: no storage, dispatch or download URLs, no multipart spooling, a small HTTP budget, the
# native libwebp distribution for the render child, and no core dumps. See docs/architecture/volatile-pipeline-port.md.
#
# The native distribution is built once from the official libwebp 1.6.0 source (hash pinned by the gateway):
#   scripts/native-image/render-native-package.mjs --platform linux-x86_64-glibc (see the port doc).
set -euo pipefail
ENV_FILE="${GATEWAY_ENV_FILE:-$HOME/.config/toonlira/gateway-real.env}"
[[ -f "$ENV_FILE" ]] || { echo "env file not found: $ENV_FILE (see gateway-real.env.example)"; exit 1; }
# shellcheck disable=SC1090
. "$ENV_FILE"
ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"

DIST="${GATEWAY_RENDERING_NATIVE_DISTRIBUTION:-$ROOT/.local/native-build/dist}"
[[ -f "$DIST/manifest.properties" ]] || { echo "native libwebp distribution not found: $DIST"; exit 1; }
export GATEWAY_VOLATILE_PROCESSING_ENABLED=true
export GATEWAY_STORAGE_MODE=disabled GATEWAY_DISPATCH_MODE=disabled GATEWAY_RESULT_DOWNLOAD_MODE=disabled
export GATEWAY_RENDERING_MODE=supervised_native
export GATEWAY_RENDERING_NATIVE_DISTRIBUTION="$DIST"
export GATEWAY_RENDERING_NATIVE_DISTRIBUTION_SHA256="${GATEWAY_RENDERING_NATIVE_DISTRIBUTION_SHA256:-$(sha256sum "$DIST/manifest.properties" | cut -d' ' -f1)}"
export GATEWAY_RENDERING_TEMP_DIR="${GATEWAY_RENDERING_TEMP_DIR:-$HOME/.cache/toonlira-render}"
mkdir -p "$GATEWAY_RENDERING_TEMP_DIR" && chmod 700 "$GATEWAY_RENDERING_TEMP_DIR"

# A separate local database: the volatile schema (V10/V11) and the renumbered stored-pipeline migrations (V12..V14)
# never meet a database migrated by an older branch.
export SPRING_DATASOURCE_URL="${GATEWAY_VOLATILE_DATASOURCE_URL:-jdbc:postgresql://localhost:5433/manga_translation_gateway_v2}"

# Disclosure: the volatile one that names the language review and the chapter memory (VolatileGatewayPolicy).
export GATEWAY_KEY="${GATEWAY_KEY_VOLATILE:-toonlira-local}"
export GATEWAY_DISCLOSURE_VERSION=volatile-2026-11-21.v1
export GATEWAY_OPERATOR_NAME="${GATEWAY_OPERATOR_NAME:-Toonlira (local)}"
export GATEWAY_OPERATOR_CONTACT="${GATEWAY_OPERATOR_CONTACT:-privacy@toonlira.local}"
export GATEWAY_PRIVACY_POLICY_URL="${GATEWAY_PRIVACY_POLICY_URL:-https://toonlira-rm.web.app/legal/privacy}"
export GATEWAY_TERMS_URL="${GATEWAY_TERMS_URL:-https://toonlira-rm.web.app/legal/terms}"
export GATEWAY_PROVIDER_TRAINING_POLICY="${GATEWAY_PROVIDER_TRAINING_POLICY:-Google Cloud does not use customer content submitted to Cloud Vision or Cloud Translation to train or improve its models. Gemini on Vertex AI receives text only; Google Cloud may cache it for up to 24 hours, isolated to the project, and does not use that cache to train models.}"

# Test batches go past the daily quotas: the private, unmetered test budget, valid for one day.
export GATEWAY_TEST_BUDGET_ENABLED=true GATEWAY_TEST_UNMETERED=true GATEWAY_INSTALLATION_DAILY_QUOTA=0
export GATEWAY_TEST_BUDGET_DEADLINE="${GATEWAY_TEST_BUDGET_DEADLINE:-$(date -u -d '+1 day' +%Y-%m-%dT%H:%M:%SZ)}"

# Page analysis, now on the API process (in memory): balloon detector and LaMa inpainting.
LAYOUT_MODEL="${GATEWAY_LAYOUT_MODEL_PATH:-$ROOT/.local/ocr-samples/models/comic-detector-16e8a622/detector.onnx}"
LAMA_MODEL="${GATEWAY_RENDERING_INPAINTING_MODEL_PATH:-$ROOT/.local/inpainting/lama_fp32.onnx}"
if [[ -f "$LAYOUT_MODEL" ]]; then
  export GATEWAY_LAYOUT_MODE="${GATEWAY_LAYOUT_MODE:-grouping}" GATEWAY_LAYOUT_MODEL_PATH="$LAYOUT_MODEL"
  export GATEWAY_LAYOUT_DIRECTION="${GATEWAY_LAYOUT_DIRECTION:-rtl}"
else
  echo "balloon detector not found ($LAYOUT_MODEL): proximity grouping only"
fi
if [[ -f "$LAMA_MODEL" ]]; then export GATEWAY_RENDERING_INPAINTING_MODEL_PATH="$LAMA_MODEL"
else echo "LaMa not found ($LAMA_MODEL): text over artwork keeps its lettering"; fi

# The admitted HTTP budget of the volatile runtime (VolatileRuntimePolicy).
export SERVER_TOMCAT_THREADS_MAX=8 SERVER_TOMCAT_THREADS_MIN_SPARE=2 SERVER_TOMCAT_MAX_CONNECTIONS=32 SERVER_TOMCAT_ACCEPT_COUNT=16
export SERVER_PORT="${SERVER_PORT:-8084}"
# No content can leave the process through a heap dump or a core file (VolatileProcessAdmission).
ulimit -c 0
cd "$ROOT/api"
exec ./mvnw -q -pl apps/translation-gateway spring-boot:run \
  -Dspring-boot.run.jvmArguments="-XX:-HeapDumpOnOutOfMemoryError -XX:-CreateCoredumpOnCrash -XX:ErrorFile=/dev/null --enable-native-access=ALL-UNNAMED"
