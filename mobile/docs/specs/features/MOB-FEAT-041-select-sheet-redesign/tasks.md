# Tasks — MOB-FEAT-041

- Spec: `spec.md`
- Status: `implemented`
- Gate: `open`

## Checklist

- [x] TASK-001 — Implementar altura adaptativa à viewport e ao conteúdo.
- [x] TASK-002 — Separar cabeçalho fixo e região rolável flexível.
- [x] TASK-003 — Redesenhar gatilho, cabeçalho, lista e indicador de seleção.
- [x] TASK-004 — Preservar estados, acessibilidade e fechamento.
- [x] TASK-005 — Atualizar testes, coverage, review e drift.
- [x] TASK-006 — Executar os gates completos.

## Rastreabilidade

| Critério | Task     | Evidência                          |
| -------- | -------- | ---------------------------------- |
| AC-001   | TASK-001 | testes do resolvedor de altura     |
| AC-002   | TASK-002 | teste da estrutura e scroll        |
| AC-003   | TASK-003 | teste da lista, divisores e check  |
| AC-004   | TASK-004 | interação e árvore assistiva       |
| AC-005   | TASK-004 | consumidores, safe area, typecheck |
| AC-006   | TASK-006 | review, drift e `pnpm check`       |
