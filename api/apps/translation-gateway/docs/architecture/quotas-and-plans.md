# Cotas e assinaturas (registro, 2026-11-18)

Este documento registra a cota atual e o que falta para um sistema de cotas e assinaturas. Ele ainda não foi
implementado: fica para uma etapa própria, por decisão do produto.

## Hoje

`ReserveJobUseCase` reserva cada página numa transação com trava global do dia (UTC):

- **Por instalação:** 20 páginas por dia (`gateway.installation-daily-quota`).
- **Global:** 100 páginas por dia (`gateway.global-daily-quota`).
- **O que conta:** todo job criado no dia, inclusive os que falharam ou foram cancelados.
- **Reenvio com a mesma `Idempotency-Key`:** não consome cota. Ele volta antes da checagem.
- **Ao estourar:**
  - a resposta é `429 quota-exceeded` com `retryable=true`;
  - `GatewayExceptionHandler` manda sempre `Retry-After: 86400`, um valor fixo que não aponta para a virada real
    do dia UTC.
- **Contrato:** as capabilities expõem os dois limites como constantes (`dailyInstallationQuota: 20`,
  `dailyGlobalQuota: 100`), sem saldo restante.
- **Desenvolvimento local:** desliga a checagem (`GATEWAY_QUOTA_ENFORCED=false`). Produção nunca desliga.

## Consequência para capítulos inteiros

O mobile passa a enviar todas as páginas de um projeto (MOB-FEAT-022). Um capítulo maior que a cota leva mais de um
dia. Até existir um sistema de cotas:

- o app pausa a fila ao receber `quota-exceeded`;
- mostra quantas páginas já foram enviadas;
- retoma sozinho depois da meia-noite UTC.

As páginas prontas continuam legíveis.

## O que um sistema de cotas e assinaturas precisa

- **Cota por plano:** gratuito e assinaturas, ligada à identidade da instalação ou de uma conta, com a regra de
  contagem explícita (por página aceita, não por tentativa).
- **Saldo nas capabilities:** quanto resta hoje e quando renova. Isso exige subir a versão do contrato, porque o
  parser do mobile é estrito e recusa campo novo.
- **`Retry-After` real:** até a próxima renovação, em vez das 24 h fixas.
- **Reserva por capítulo:** opcional. Garantir a cota do capítulo inteiro antes da primeira página evitaria um
  capítulo pela metade.
- **Política divulgada:** limites e cobrança no disclosure e nas telas de consentimento, revisados como os demais
  textos legais.
- **Antiabuso:** limite por IP/dispositivo, revogação e o efeito sobre a cota global, que protege o custo do
  provedor.
