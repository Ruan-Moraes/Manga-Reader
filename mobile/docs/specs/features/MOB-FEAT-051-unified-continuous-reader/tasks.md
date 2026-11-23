# Tasks — MOB-FEAT-051

- [x] TASK-001 — Aprovar contrato discriminado e ownership FSD.
- [x] TASK-002 — Implementar viewport unificada virtualizada e helpers puros.
- [x] TASK-003 — Implementar overlay demo, erro localizado e comparação global.
- [x] TASK-004 — Migrar leitor publicado e local com progresso debounced/flush.
- [x] TASK-005 — Implementar fluxo textual e preview estritamente `__DEV__`.
- [x] TASK-006 — Cobrir contratos, integrações, i18n e guard de produção.
- [ ] TASK-007 — Executar gates e registrar validação real/performance.

## Rastreabilidade

- [x] TASK-008 — Refinamento aprovado 2026-09-09: corrigir contraste, painel,
      gestos, geometria, restauração e retry (AC-001..005), com regressões.
- [ ] TASK-009 — Validar refinamento automatizado e visual; registrar limites
      e comparação nativa antes/depois (AC-006).

| Critério | Tasks                        | Evidência planejada                   |
| -------- | ---------------------------- | ------------------------------------- |
| AC-001   | TASK-002, TASK-003, TASK-006 | helpers e RNTL do widget              |
| AC-002   | TASK-002, TASK-006           | helpers e modos paginado/duplo        |
| AC-003   | TASK-003, TASK-006           | overlay/comparação e integração local |
| AC-004   | TASK-005, TASK-006           | blocos textuais e escala de fonte     |
| AC-005   | TASK-004, TASK-005, TASK-006 | pages, debounce, lifecycle e guard    |
| AC-006   | TASK-007                     | gates e protocolo nativo              |

O status permanece `verification-pending` enquanto a nova implementação não for
validada no Android físico e os cenários nativos 10/67/200 não tiverem métricas
de itens montados, frames e memória.
