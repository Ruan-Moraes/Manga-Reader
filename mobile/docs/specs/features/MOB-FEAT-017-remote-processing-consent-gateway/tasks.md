# Tasks — MOB-FEAT-017

- Spec: `spec.md`
- Status: `verification-pending`
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

- [ ] TASK-001 — Operador/contato definidos e placeholders de identidade removidos nos três locales; publicar/revisar Termos e Privacidade nas URLs reservadas e criar disclosure versionado. Upload permanece fechado até a conclusão.
- [x] TASK-002 — Implementar SQLite v7 para consents/attempts, estados local/remoto separados e repository transacional com FKs/checks/upgrade v6→v7.
- [x] TASK-003 — Criar capabilities e validação pré-upload, incluindo sete idiomas/42 pares, arquivo e consentimento.
- [x] TASK-004 — Congelar OpenAPI `/v1`; manter HTTPS/timeout/limites/redirects em `shared/remote-gateway` e capabilities/parsers Zod nas entities, separados do Core client.
- [ ] TASK-005 — Implementar instalação anônima, credencial longa em SecureStore, bearer curto, quota 20/dia e kill switch; confirmar o scan no AAB de release.
- [x] TASK-006 — Persistir attempt/idempotency antes da rede, impedir attempt ativo concorrente e cobrir timeout/replay/restart sem job duplicado.
- [x] TASK-007 — Integrar receipt com transições atômicas para `QUEUED` e rejeição segura em `DRAFT`.
- [x] TASK-008 — Reconciliar attempts ambíguos em bootstrap/foreground sem novo ID/cobrança.
- [x] TASK-009 — Implementar cancelamento idempotente e retomada de `CANCEL_PENDING`.
- [x] TASK-010 — Criar o serviço Spring Boot, schema Flyway BCNF, quota concorrente e outbox/reconciliação de Cloud Tasks/Storage/SQL/cleanup, com providers ainda atrás das portas das specs seguintes.
- [ ] TASK-011 — Compor UI acessível/trilíngue de consentimento, envio, fila, ambiguidade, erro e cancelamento; concluir auditoria com leitor de tela em Android físico.
- [x] TASK-012 — Validar primeira página somente, FSD/OpenAPI/IAM/secret scan de source, atualizar coverage e produzir review/drift audit.

## Ordem de execução

1. Registrar a divergência SDD compartilhada sem renovar checksums antes do fim;
   congelar OpenAPI, estados, erros, capabilities, schema remoto e disclosure
   fail-closed.
2. Criar gateway/worker, Flyway V1, quota e outbox com adapters falsos e contract
   tests; preparar Terraform sem `apply`.
3. Implementar SQLite v7, transporte, entities e sessão anônima de baixo para
   cima no FSD.
4. Integrar submissão, receipt atômico, ambiguidade, recovery e cancelamento.
5. Compor UI/legal, atualizar coverage, revisar todas as features afetadas pelo
   checksum compartilhado e executar review/drift.
6. Cloud/policies/secret scan/AAB/teste Android mediante aprovações externas.

## Bloqueios de verificação

- Billing, projeto Google Cloud e ações externas precisam de aprovação no ato.
- Operador e contato estão definidos. Publicação HTTPS das URLs legais, revisão
  jurídica, versão do disclosure e política do provider ainda bloqueiam upload
  real.
- `MOB-FEAT-018..021` permanecem bloqueadas até esta feature ser executada.

## Marco server-side — gateway primeiro

Implementado em 2026-09-02 sem concluir as tasks compostas deste arquivo. O
marco cobriu a parcela server-side de `TASK-003..005`, `TASK-006`, `TASK-009`,
`TASK-010` e `TASK-012`. O marco mobile seguinte implementou SQLite v7,
SecureStore, transporte/FSD, consentimento, submissão, recovery, cancelamento e
UX trilíngue. Permanecem abertos somente os gates externos e nativos descritos
acima.

Evidência: [`evidence/gateway-server-foundation.md`](evidence/gateway-server-foundation.md).

Evidência mobile: [`evidence/mobile-foundation.md`](evidence/mobile-foundation.md).
