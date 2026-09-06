# Tasks — MOB-FEAT-047

- Spec: `spec.md`
- Status da spec no planejamento: `implemented`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-046` (`verification-pending`)

## Rastreabilidade

| Critério | Tasks    | Evidência planejada               |
| -------- | -------- | --------------------------------- |
| AC-001   | TASK-001 | export iOS e smoke no Router      |
| AC-002   | TASK-002 | TypeScript, Jest, FSD e coverage  |
| AC-003   | TASK-003 | auditoria de árvore/imports e ADR |

## Checklist

- [x] TASK-001 — Mover as cascas de rota para `src/app` preservando a topologia.
- [x] TASK-002 — Atualizar aliases, Jest, FSD, coverage e referências verificáveis.
- [x] TASK-003 — Executar os gates e o smoke iOS após a movimentação.

## Riscos e bloqueios

- Diferenciar a raiz física do Router da app layer lógica `src/application` em
  todos os validadores, sem criar exceção FSD ampla.
