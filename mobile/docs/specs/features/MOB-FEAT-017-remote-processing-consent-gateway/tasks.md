# Tasks — MOB-FEAT-017

- Spec: `spec.md`
- Status: `verification-pending`
- Gate: `open`
- Dependência implementada: `MOB-FEAT-016`

## Rastreabilidade

| Critério | Tasks                        | Evidência planejada                                                   |
| -------- | ---------------------------- | --------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-016           | disclosure/policies comparados ao capabilities e à configuração cloud |
| AC-002   | TASK-002                     | consentimento aceitar/recusar/reconsentir + SQLite                    |
| AC-003   | TASK-003, TASK-013, TASK-014 | spy prova zero byte antes de todas as pré-condições                   |
| AC-004   | TASK-004, TASK-016           | porta, parser Zod e contract tests HTTP/OpenAPI                       |
| AC-005   | TASK-005                     | sessão anônima, SecureStore, IAM e secret scan                        |
| AC-006   | TASK-006, TASK-013, TASK-014 | idempotência, timeout, duplo toque e restart                          |
| AC-007   | TASK-007                     | receipt e transição atômica de attempt/página/projeto                 |
| AC-008   | TASK-008, TASK-013, TASK-014 | reconciliation de `SUBMITTING`/`UNKNOWN` após process kill            |
| AC-009   | TASK-009                     | cancel antes/depois do receipt e `CANCEL_PENDING`                     |
| AC-010   | TASK-010, TASK-017           | allowlist de logs, ACK/TTL/cleanup e retenção até render              |
| AC-011   | TASK-011, TASK-016           | RNTL pt-BR/en-US/es-ES e acessibilidade                               |
| AC-012   | TASK-012                     | somente primeira página e boundaries sem Core/provider direto         |

## Checklist

- [ ] TASK-001 — Operador/contato definidos; Termos e Privacidade 1.0 e disclosure `2026-09-07.v1` publicados historicamente. Revisar e republicar a informação de localização para tradução pelo endpoint global, aprovar uma nova versão de disclosure e obter aprovação final do operador antes de abrir uploads.
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

- Projeto Google Cloud confirmado ativo em 2026-09-07, mas com billing
  desabilitado e sem conta de faturamento disponível para vinculação.
- Operador, contato e URLs HTTPS estão definidos; o disclosure publicado usa
  a premissa anterior de tradução nos EUA. Uma nova versão aprovada, contrato
  capabilities/mobile coerente, configuração cloud, worker, scan do AAB e
  leitor de tela ainda bloqueiam upload real.
- A 018 está em `verification-pending` e a 019 em `in-progress`; esses estados
  não removem o bloqueio operacional de uploads desta feature.

## Marco server-side — gateway primeiro

Implementado em 2026-09-02 sem concluir as tasks compostas deste arquivo. O
marco cobriu a parcela server-side de `TASK-003..005`, `TASK-006`, `TASK-009`,
`TASK-010` e `TASK-012`. O marco mobile seguinte implementou SQLite v7,
SecureStore, transporte/FSD, consentimento, submissão, recovery, cancelamento e
UX trilíngue. Permanecem abertos somente os gates externos e nativos descritos
acima.

Evidência: [`evidence/gateway-server-foundation.md`](evidence/gateway-server-foundation.md).

Evidência mobile: [`evidence/mobile-foundation.md`](evidence/mobile-foundation.md).

## Performance C06 — 2026-09-12

- [x] TASK-013 — Compartilhar reconcile concorrente no mesmo contexto de cancelamento; regressão de replay, retry e isolamento de AbortSignal (AC-003/006/008).
- [ ] TASK-014 — Validar recuperação/lifecycle e custo nativos após C06, incluindo contextos distintos, submissão simultânea e novos recoverables durante consulta. Responsável a definir.

Evidência C06 (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/recovery-2026-09-12/review.md`).

Avanço parcial TASK-014 em 2026-09-12: teste controlado confirma descoberta de uma
tentativa adicionada durante consulta na próxima chamada, sem varredura automática.
Integração dos gatilhos, submissão simultânea e validação nativa continuam abertas.

Integração automatizada parcial: gate + hook + reconcile cobertos sob falha de rede,
com sobreposição de active, consulta posterior e remoção de listeners. A emissão
real de AppState, SQLite, replay e demais cenários nativos continuam pendentes.

Avanço nativo parcial: cinco rodadas negativas (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/native-recovery-2026-09-12/review.md`)
preservaram uma tentativa UNKNOWN no SQLite após abertura, background, verificação
manual e force-stop. Gateway sem origem; consulta/replay com respostas reais ou
controladas e medições de custo permanecem abertos.

## Correção multipart — 2026-09-13

- [x] TASK-015 — Corrigir incompatibilidade do descritor de arquivo com expo/fetch instalado; teste de regressão usa conversor real e verifica bytes, MIME, nome público e idempotência (AC-003/004/006). Sem mudança de contrato/gate.

Evidência HTTPS (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/https-recovery-2026-09-13/review.md`).
TASK-014 continua aberta para os cenários e medições residuais.

Avanço TASK-014 em 2026-09-13: quinze rodadas HTTPS controladas passaram (cinco
sem consentimento, cinco com job existente, cinco com replay). Mesma identidade,
zero reenvio no job existente, um POST por replay e SQLite íntegro. TASK-014
permanece aberta para cancelamento, concorrência residual e custo nativo.

## Revisão de localização — 2026-09-27

- [x] TASK-016 — Atualizar capabilities do gateway, OpenAPI, parser mobile e
      copy de consentimento para diferenciar OCR regional `us` de tradução global;
      testar compatibilidade e comportamento fail-closed antes de aceitar mídia.
      Não atualizar a publicação legal sem revisão e aprovação da TASK-001.

Conclusão técnica em 2026-10-02: o campo legado é recusado pelo parser,
`2026-09-07.v1` é recusado pelo gateway e a configuração de exemplo deixa a
versão vazia. A publicação legal e a ativação permanecem em TASK-001.

- [ ] TASK-017 — Na integração do renderer, reter o original remoto privado até render/terminal, remover após commit e preservar cleanup absoluto de uma hora; testar falha, cancelamento e crash. Não executar antes de abrir o gate da 020.

Parcela de 2026-10-04 entregue no gate aberto da 020: fila de ciclo de vida
separada do ACK, intenção individual atômica, reconciliação limitada e recuperação
de delete/lease/crash. Ver [evidência](../MOB-FEAT-020-visual-translation-rendering/evidence/lifecycle-retention-2026-10-04.md).
TASK-017 continua aberta para remoção imediata e falhas integrais dos workers;
esta parcela não habilita uploads nem aprova validação operacional.

Parcela posterior de 2026-10-04: os três workers tentam limpeza por job ao
finalizar, com falhas diferidas, retry e estado ativo preservado. Varredura por
idade testada contra upload sem referência e falha SQL independente. Ver
[evidência](../MOB-FEAT-020-visual-translation-rendering/evidence/lifecycle-worker-cleanup-2026-10-04.md).
TASK-017 permanece aberta para auditoria integral de cancelamento/dispatch
fora do worker e operação bootstrap/scheduler/storage; nenhuma ativação real.

Incremento posterior de 2026-10-04: cancelamento terminal e dispatch esgotado
agendam tentativa somente após commit, com rollback sem delete e recuperação
durável. A limpeza ACK suspende TX externa; arquivos são removidos fora de TX,
com confirmação própria. Ver
[evidência](../MOB-FEAT-020-visual-translation-rendering/evidence/lifecycle-controls-cleanup-2026-10-04.md).
TASK-017 permanece aberta para auditoria integral de concorrência e validação
operacional, sem presumir SLA de bootstrap/scheduler/storage ou habilitar upload.

Parcela posterior: dispatch agora exige a tentativa possuída antes de mudar
outbox/job/cleanup; conclusão tardia não encerra job confirmado ou lease nova.
Locks job → outbox e recuperação sem nona criação de task comprovados localmente.
Ver [evidência](../MOB-FEAT-020-visual-translation-rendering/evidence/dispatch-ownership-2026-10-04.md).
TASK-017 continua aberta para auditoria integral/operacional; não muda gate ou
autoriza upload/processamento cloud.
