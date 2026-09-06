# Tasks — MOB-FEAT-040

- Spec: `spec.md`
- Status: `implemented`
- Gate: `open`

## Checklist

- [x] TASK-001 — Reservar a coluna fixa do switch.
- [x] TASK-002 — Conter a copy no espaço flexível restante.
- [x] TASK-003 — Centralizar o controle e preservar o layout empilhado.
- [x] TASK-004 — Atualizar testes e rastreabilidade.
- [x] TASK-005 — Executar review, drift e gates completos.

## Rastreabilidade

| Critério | Task     | Evidência                    |
| -------- | -------- | ---------------------------- |
| AC-001   | TASK-001 | teste da coluna do controle  |
| AC-002   | TASK-002 | teste de flex e minWidth     |
| AC-003   | TASK-003 | teste de alinhamento         |
| AC-004   | TASK-003 | teste de geometria           |
| AC-005   | TASK-004 | consumidores e typecheck     |
| AC-006   | TASK-005 | review, drift e `pnpm check` |
