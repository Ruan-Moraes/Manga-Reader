# Tasks — MOB-FEAT-043

- Spec: `spec.md`
- Status: `verification-pending`
- Gate: `open`

## Checklist

- [x] TASK-001 — Redesenhar Grade e Lista com miniaturas dominantes e sem controles de mover visíveis.
- [x] TASK-002 — Implementar toque curto contextual/preview e toque prolongado na imagem para reorder nos dois modos.
- [x] TASK-003 — Aplicar ordem otimista e persistir exatamente uma ordenação completa por drop.
- [x] TASK-004 — Preservar rollback, retry, no-op e bloqueio de concorrência.
- [x] TASK-005 — Implementar ações assistivas de mover e atualizar i18n nos três locales.
- [x] TASK-006 — Preservar virtualização, responsividade, temas e redução de movimento.
- [x] TASK-007 — Integrar Reanimated/Gesture Handler e reorganizar o slice conforme FSD.
- [x] TASK-008 — Validar a ativação de 200 ms, o pipeline nativo de drop, a troca real de ordem, a persistência após recarga, testes, Simulator, review, evidências, drift e gates.
- [x] TASK-009 — Refatorar o sortable em geometria, estado gestual e apresentação; mover animação/auto-scroll para UI, usar scheduleOnRN, renomear grid e corrigir o ícone contextual.
- [ ] TASK-010 — Revalidar o gesto prolongado, fluidez, auto-scroll, cancelamento e persistência no iOS; esclarecer o abort de worklet registrado às 14:49:14.
- [x] TASK-011 — Investigar versões e logs nativos; evitar alternância de clipping no iOS e cobrir cancelamento/drop em Grade e Lista com regressões.

Refinamento aprovado por Ruan em 2026-08-30:

- [x] TASK-012 — Regredir geometria, histerese, auto-scroll gradual e fases da sessão.
- [x] TASK-013 — Implementar gesto estável, overlay, encaixe e handoff de layout sem saltos.
- [x] TASK-014 — Integrar ordem otimista, rollback, interrupções e acessibilidade; executar gates.
- [ ] TASK-015 — Validar 20 ciclos por modo e sistema com vídeo/logs e comparação de frames; esclarecer abort de worklet.
- [x] TASK-016 — Padronizar a prévia ampliada com `MOB-FEAT-045` por meio de um componente compartilhado, preservando os fluxos da Grade e Lista, e validar acessibilidade, i18n e privacidade.

## Rastreabilidade

| Critério | Task                                                 | Evidência esperada                                                           |
| -------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| AC-001   | TASK-001                                             | RNTL estrutural dos dois modos                                               |
| AC-002   | TASK-002 / TASK-011 / TASK-012 / TASK-013 / TASK-015 | geometria, sessões, overlay, callbacks nativos e gesto físico pendente       |
| AC-003   | TASK-003 / TASK-014                                  | ordem otimista, chamada única e persistência                                 |
| AC-004   | TASK-004 / TASK-011 / TASK-013 / TASK-014            | rollback, no-op, busy, cancelamento, callbacks antigos e referências nativas |
| AC-005   | TASK-005 / TASK-014 / TASK-016                       | ações assistivas, preview e ausência de ações duplicadas                     |
| AC-006   | TASK-006 / TASK-012 / TASK-013 / TASK-015 / TASK-016 | colunas, preview responsivo, virtualização e movimento reduzido              |
| AC-007   | TASK-007 / TASK-013 / TASK-016                       | typecheck, FSD, shared UI e API pública preservada                           |
| AC-008   | TASK-008 / TASK-010 / TASK-014 / TASK-015            | gates, export nativo, review, drift e pendências físicas explícitas          |
