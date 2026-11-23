#!/usr/bin/env bash
# DEV LOCAL ONLY. Em producao quem chama o worker e o Cloud Tasks; no modo `local-ack`
# nada o chama. Este loop envia cada job QUEUED ao worker local (POST /internal/tasks/ocr),
# no lugar do Cloud Tasks. Cada chamada pode usar OCR/traducao pagos.
set -euo pipefail
WORKER_URL="${WORKER_URL:-http://localhost:8085}"
PG_CONTAINER="${PG_CONTAINER:-toonlira-gateway-postgres}"
SEEN="$(mktemp)"; trap 'rm -f "$SEEN"' EXIT
echo "dispatcher -> $WORKER_URL (Ctrl+C para parar)"
while true; do
  for ref in $(docker exec "$PG_CONTAINER" psql -U manga -d manga_translation_gateway -Atc \
      "select job_ref from processing_jobs where status='QUEUED' order by accepted_at"); do
    grep -qx "$ref" "$SEEN" && continue
    echo "$ref" >> "$SEEN"
    ( code=$(curl -s -o /dev/null -w '%{http_code}' -m 300 -X POST "$WORKER_URL/internal/tasks/ocr" \
        -H 'Content-Type: application/json' -d "{\"jobRef\":\"$ref\"}"); echo "$(date +%T) $ref -> HTTP $code" ) &
  done
  sleep 2
done
