#!/usr/bin/env bash
# DEV LOCAL ONLY. Worker (8085): OCR, translation and local render, with the balloon detector (grouping) and LaMa
# inpainting when their models exist under .local/ (git-ignored; see docs/ocr-evaluation/layout-experimental.md and
# docs/rendering/inpainting.md). Each processed page may call paid OCR/translation (and Gemini when enabled).
set -euo pipefail
ENV_FILE="${GATEWAY_ENV_FILE:-$HOME/.config/toonlira/gateway-real.env}"
[[ -f "$ENV_FILE" ]] || { echo "env file not found: $ENV_FILE (see gateway-real.env.example)"; exit 1; }
# shellcheck disable=SC1090
. "$ENV_FILE"
ROOT="$(cd "$(dirname "$0")/../../../../.." && pwd)"   # repository root
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
export SERVER_PORT="${SERVER_PORT:-8085}"
cd "$ROOT/api"
exec ./mvnw -q -pl apps/translation-gateway spring-boot:run -Dspring-boot.run.profiles=worker
