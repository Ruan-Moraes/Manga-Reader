# Tasks — MOB-FEAT-027

- Spec: `spec.md`
- Status da spec: `verification-pending`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-025`, `MOB-FEAT-026`

## Rastreabilidade

| Critério | Tasks    | Evidência planejada              |
| -------- | -------- | -------------------------------- |
| AC-001   | TASK-001 | migration fresh/v7/rollback/FK   |
| AC-002   | TASK-002 | recovery e fault injection       |
| AC-003   | TASK-003 | cascade, isolamento e app config |
| AC-004   | TASK-004 | spies de I/O/hash/timers e gates |

## Checklist

- [x] TASK-001 — Criar e testar schema SQLite v8 forward-only.
- [x] TASK-002 — Implementar reconciliação e validação sob demanda.
- [x] TASK-003 — Coordenar exclusão e desabilitar backup Android.
- [ ] TASK-004 — Validar recuperação após reinício em aparelho físico.

## Riscos e bloqueios

- Backup/restauração do sistema operacional não faz parte desta recuperação.
