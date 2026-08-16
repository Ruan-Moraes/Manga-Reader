# Tasks — MOB-FEAT-017

- Spec: `spec.md`
- Status: `approved`
- Gate: `open`
- Dependência executada: `MOB-FEAT-016` (`verification-pending`)

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                                                   |
| -------- | -------- | --------------------------------------------------------------------- |
| AC-001   | TASK-001 | disclosure/policies comparados ao capabilities e à configuração cloud |
| AC-002   | TASK-002 | consentimento aceitar/recusar/reconsentir + SQLite                    |
| AC-003   | TASK-003 | spy prova zero byte antes de todas as pré-condições                   |
| AC-004   | TASK-004 | porta, parser Zod e contract tests HTTP/OpenAPI                       |
| AC-005   | TASK-005 | sessão anônima, SecureStore, IAM e secret scan                        |
| AC-006   | TASK-006 | idempotência, timeout, duplo toque e restart                          |
| AC-007   | TASK-007 | receipt e transição atômica de attempt/página/projeto                 |
| AC-008   | TASK-008 | reconciliation de `SUBMITTING`/`UNKNOWN` após process kill            |
| AC-009   | TASK-009 | cancel antes/depois do receipt e `CANCEL_PENDING`                     |
| AC-010   | TASK-010 | allowlist de logs, ACK/TTL/cleanup e política pública                 |
| AC-011   | TASK-011 | RNTL pt-BR/en-US/es-ES e acessibilidade                               |
| AC-012   | TASK-012 | somente primeira página e boundaries sem Core/provider direto         |

## Checklist

- [ ] TASK-001 — Atualizar termos/privacidade nos três locales e criar disclosure versionado derivado de capabilities; upload fecha sem URLs/operador/contato reais.
- [ ] TASK-002 — Implementar SQLite v6 para consents/attempts e repository transacional com FKs/checks/upgrade.
- [ ] TASK-003 — Criar capabilities e validação pré-upload, incluindo sete idiomas/42 pares, arquivo e consentimento.
- [ ] TASK-004 — Criar `shared/remote-gateway` e contrato HTTP `/v1` validado, separado do Core client.
- [ ] TASK-005 — Implementar instalação anônima, credencial longa em SecureStore, bearer curto, quota 20/dia e kill switch.
- [ ] TASK-006 — Persistir attempt/idempotency antes da rede e cobrir timeout/replay/restart sem job duplicado.
- [ ] TASK-007 — Integrar receipt com transições atômicas para `QUEUED` e rejeição segura em `DRAFT`.
- [ ] TASK-008 — Reconciliar attempts ambíguos em bootstrap/foreground sem novo ID/cobrança.
- [ ] TASK-009 — Implementar cancelamento idempotente e retomada de `CANCEL_PENDING`.
- [ ] TASK-010 — Criar o serviço Spring Boot, schema Flyway BCNF, Cloud Tasks/Storage/SQL e cleanup, com providers ainda atrás das portas das specs seguintes.
- [ ] TASK-011 — Compor UI acessível/trilíngue de consentimento, envio, fila, ambiguidade, erro e cancelamento.
- [ ] TASK-012 — Validar primeira página somente, FSD/OpenAPI/IAM/secret scan, atualizar coverage e produzir review/drift audit.

## Ordem de execução

1. Contrato OpenAPI, schema remoto e Terraform sem `apply`.
2. SQLite/transport/session de baixo para cima no FSD.
3. Gateway/worker com adapters falsos e contract tests.
4. UI/composição/reconciliation.
5. Cloud/policies/teste Android mediante aprovações externas.

## Bloqueios de verificação

- Billing, projeto Google Cloud e ações externas precisam de aprovação no ato.
- Operador, contato e URLs legais reais fecham o disclosure; sem eles não existe
  upload real.
- `MOB-FEAT-018..021` permanecem bloqueadas até esta feature ser executada.
