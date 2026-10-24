# Tasks — MOB-FEAT-045

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-015` e `MOB-FEAT-043`
  (`verification-pending`)

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                       |
| -------- | -------- | ----------------------------------------- |
| AC-001   | TASK-001 | RNTL da galeria, resumo e filtros         |
| AC-002   | TASK-002 | RNTL do modal e modelo de apresentação    |
| AC-003   | TASK-003 | Unitários de repository/controller e RNTL |
| AC-004   | TASK-004 | Integração da page e CTA por estado       |
| AC-005   | TASK-005 | i18n, acessibilidade, TypeScript e Jest   |

## Checklist

- [x] TASK-001 — Implementar resumo e galeria virtualizada de validação.
- [x] TASK-002 — Implementar destaque, filtros, preview e detalhe honesto por origem.
- [x] TASK-003 — Implementar substituição atômica de uma página e regressões.
- [x] TASK-004 — Integrar título e CTA dinâmicos ao fluxo até revisão.
- [ ] TASK-005 — Executar erro/substituição no picker real, tema escuro, fonte ampliada e VoiceOver/TalkBack; então promover o status.
- [x] TASK-006 — Extrair o preview para `shared/ui`, preservar detalhes e substituição da Validação e regredir a integração compartilhada com a Ordenação.

## Riscos e bloqueios

- O workspace contém mudanças paralelas em `MOB-FEAT-043/044`; integrar sem
  reverter ou reformatar essas alterações.
- Não criar ou persistir falha remota fictícia antes do gateway real.
