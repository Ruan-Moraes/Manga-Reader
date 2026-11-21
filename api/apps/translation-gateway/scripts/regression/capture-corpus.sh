#!/usr/bin/env bash
# Freezes the regression-gate inputs of the validation corpus (see CaptureCorpus.java and README.md).
# PAID: one Cloud Vision call per page whose .vision.pb is not yet in src/test/resources/corpus-replay.
# Usage: scripts/regression/capture-corpus.sh [<batchDir>]   (batchDir = web/apps/gateway-tester/corpus/runs/<run>)
set -euo pipefail
MODULE="$(cd "$(dirname "$0")/../.." && pwd)"           # api/apps/translation-gateway
ROOT="$(cd "$MODULE/../../.." && pwd)"                   # repository root
MODEL="${GATEWAY_LAYOUT_MODEL_PATH:-$ROOT/.local/ocr-samples/models/comic-detector-16e8a622/detector.onnx}"
PROJECT="${GATEWAY_GCP_PROJECT:-toonlira-rm}"
[[ -f "$MODEL" ]] || { echo "detector model not found: $MODEL"; exit 1; }
CP_FILE="$(mktemp)"; trap 'rm -f "$CP_FILE"' EXIT
(cd "$ROOT/api" && ./mvnw -q -pl apps/translation-gateway compile dependency:build-classpath -Dmdep.outputFile="$CP_FILE")
cd "$MODULE"
JAVA="${JAVA:-$( [[ -x /usr/lib/jvm/java-25-openjdk-amd64/bin/java ]] && echo /usr/lib/jvm/java-25-openjdk-amd64/bin/java || echo java)}"   # single-file unnamed class: JDK 25+
exec "$JAVA" -cp "$MODULE/target/classes:$(cat "$CP_FILE")" scripts/regression/CaptureCorpus.java \
  "$ROOT/web/apps/gateway-tester/corpus" "$MODEL" "$PROJECT" ${1:+"$1"}
