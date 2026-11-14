#!/bin/bash
# Script para abrir o Swagger do Translation Gateway
# Aguarda alguns segundos para a aplicação iniciar e então abre o navegador

set -e

GATEWAY_URL="http://localhost:8084/swagger-ui.html"
RETRIES=0
MAX_RETRIES=30
DELAY=1

echo "⏳ Aguardando Translation Gateway iniciar..."

# Aguarda o gateway ficar disponível
while ! curl -sf "$GATEWAY_URL" > /dev/null 2>&1; do
    RETRIES=$((RETRIES + 1))
    if [ $RETRIES -eq $MAX_RETRIES ]; then
        echo "❌ Translation Gateway não respondeu após $((MAX_RETRIES * DELAY))s"
        exit 1
    fi
    sleep $DELAY
    echo "  Tentativa $RETRIES/$MAX_RETRIES..."
done

echo "✅ Translation Gateway está pronto!"
echo ""
echo "🚀 Abrindo Swagger UI em $GATEWAY_URL"
echo ""

# Abre o URL no navegador padrão
if command -v xdg-open &> /dev/null; then
    xdg-open "$GATEWAY_URL"
elif command -v open &> /dev/null; then
    open "$GATEWAY_URL"
elif command -v start &> /dev/null; then
    start "$GATEWAY_URL"
else
    echo "⚠️  Não foi possível abrir o navegador automaticamente."
    echo "   Acesse manualmente: $GATEWAY_URL"
fi

exit 0
