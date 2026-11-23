# Tasks — MOB-FEAT-022

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open` (2026-11-18)
- Dependências implementadas: `MOB-FEAT-021` (`verification-pending`)

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                     |
| -------- | ------------------ | ----------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-002 | `remoteQueue.test.ts` e `startRemoteProcessing.test.ts` (ordem, janela) |
| AC-002   | TASK-001, TASK-002 | `startRemoteProcessing.test.ts` (`contextRef`) e repositório v11        |
| AC-003   | TASK-002           | `remoteQueue.test.ts` (lote de 5) e polling só dos jobs ativos          |
| AC-004   | TASK-003           | `startRemoteProcessing.test.ts` e `remoteQueue.test.ts` (pausa UTC)     |
| AC-005   | TASK-003           | Lifecycle do repositório (reabrir página) e testes do controller        |
| AC-006   | TASK-002           | `remoteResultCommit.test.ts` (projeto parcial) e leitor local           |
| AC-007   | TASK-004           | `RemoteProcessingPanel.test.tsx` nos três locales                       |

## Checklist

- [x] TASK-001 — SQLite v11: `context_ref` sorteado uma vez por projeto e pausa da fila em `translation_projects`.
- [x] TASK-002 — Fila em ordem de leitura: uma página por chamada, no máximo 2 jobs, a próxima só depois da
      tradução da anterior, lotes de 5 e o mesmo `contextRef` em toda submissão e reenvio.
- [x] TASK-003 — Cota: `429 quota-exceeded` pausa até a meia-noite UTC sem perder a página. Cancelar vale para
      o projeto, e retry vale por página.
- [x] TASK-004 — Painel: progresso agregado, estado por página, retry por página, aviso de pausa e consentimento
      sem "primeira página", nos três idiomas.
- [x] TASK-005 — Gates focados, `coverage.json`, docs do gateway e README.
- [ ] TASK-006 — Verificação física Android e um capítulo real contra o gateway (ordem, janela e `contextRef` nos
      logs).

## Riscos e bloqueios

- A ponta a ponta depende do ambiente com URLs assinadas (ver 021, TASK-006).
- Cotas por plano ficam fora (`api/apps/translation-gateway/docs/architecture/quotas-and-plans.md`).
