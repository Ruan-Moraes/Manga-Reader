# Tasks — MOB-FEAT-039

- Spec: `spec.md`
- Status: `implemented`
- Gate: `open`

## Checklist

- [x] TASK-001 — Centralizar os indicadores nos controles compartilhados.
- [x] TASK-002 — Preservar a geometria entre estados.
- [x] TASK-003 — Atualizar testes estruturais e de consumidores.
- [x] TASK-004 — Registrar evidências, review e drift.
- [x] TASK-005 — Executar os gates completos.

## Rastreabilidade

| Critério | Task     | Evidência                    |
| -------- | -------- | ---------------------------- |
| AC-001   | TASK-001 | testes dos quatro controles  |
| AC-002   | TASK-002 | teste comparativo de estados |
| AC-003   | TASK-003 | descrição e copy flexível    |
| AC-004   | TASK-003 | layout compartilhado         |
| AC-005   | TASK-003 | consumidores e typecheck     |
| AC-006   | TASK-005 | review, drift e `pnpm check` |
