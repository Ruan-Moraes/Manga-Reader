# Tasks — MOB-FEAT-037

- Spec: `spec.md`
- Status: `implemented`
- Gate: `open`

## Checklist

- [x] TASK-001 — Remover posicionamento absoluto e reservar coluna do switch.
- [x] TASK-002 — Proteger wrap e font scale elevado.
- [x] TASK-003 — Preservar interação e semântica.
- [x] TASK-004 — Validar consumidores das configurações.
- [x] TASK-005 — Executar auditoria, revisão, drift e gates completos.

## Rastreabilidade

| Critério | Task     | Evidência                        |
| -------- | -------- | -------------------------------- |
| AC-001   | TASK-001 | estrutura e teste de layout      |
| AC-002   | TASK-002 | teste responsivo                 |
| AC-003   | TASK-003 | teste interativo e assistivo     |
| AC-004   | TASK-004 | testes dos consumidores          |
| AC-005   | TASK-001 | shared/ui, coverage e lint FSD   |
| AC-006   | TASK-005 | auditoria, review e `pnpm check` |
