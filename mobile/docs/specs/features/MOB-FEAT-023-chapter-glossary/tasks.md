# Tasks — MOB-FEAT-023

- Spec: `spec.md`
- Status da spec no planejamento: `approved` (2026-11-20)
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-022` (`verification-pending`)

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                           |
| -------- | ------------------ | ------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-002 | `remoteResultCommit.test.ts` (1.1 e 1.2, primeira decisão)    |
| AC-002   | TASK-003           | `startRemoteProcessing.test.ts` (glossary nas submissões)     |
| AC-003   | TASK-001           | Testes do repositório de glossário (cascade, clear, migração) |
| AC-004   | TASK-004           | `RemoteProcessingPanel.test.tsx` nos três locales             |

## Checklist

- [x] TASK-001 — SQLite v12: `translation_project_terms`, leitura limitada a 256 e limpeza junto do projeto.
- [x] TASK-002 — Parser do manifesto do resultado aceita 1.1 e 1.2 (`terms`); o commit grava os termos na mesma
      transação, valendo a primeira decisão.
- [x] TASK-003 — Submissão e reenvio levam `glossary` quando o projeto tem termos.
- [x] TASK-004 — Texto de dados enviados no consentimento cita os nomes já traduzidos, nos três idiomas.
- [ ] TASK-005 — Gates focados, `coverage.json`, review e drift.
- [ ] TASK-006 — Verificação física Android e ponta a ponta com URLs assinadas reais (mesma pendência da 021/022).

## Riscos e bloqueios

- A versão do disclosure no gateway sobe com o texto novo, e o texto entra na revisão jurídica pendente antes de
  produção.
