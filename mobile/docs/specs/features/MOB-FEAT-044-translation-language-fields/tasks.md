# Tasks — MOB-FEAT-044

- Spec no planejamento: `approved`, conforme autorização explícita na conversa.
- Gate: `open`; dependências 014/042 implemented, 028 verification-pending.

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                |
| -------- | -------- | ---------------------------------- |
| AC-001   | TASK-001 | RNTL painel, página e variantes    |
| AC-002   | TASK-002 | RNTL interação e cancelamento      |
| AC-003   | TASK-003 | Regressões de contrato local       |
| AC-004   | TASK-004 | RNTL, inspeção nativa e limitações |
| AC-005   | TASK-005 | Gates, review, coverage e drift    |

## Checklist

- [x] TASK-001 — Testar e implementar variante input e composição compacta; a
      variante segue `layout.controlHeight` (52 px), preservando alvo mínimo de toque.
- [x] TASK-002 — Testar folhas independentes, opções, recomendação e cancelamento.
- [x] TASK-003 — Preservar e verificar contrato local e integração da etapa.
- [ ] TASK-004 — Verificar i18n, temas, foco, fonte ampliada e iOS/Android.
- [ ] TASK-005 — Executar gates, registrar review, evidências e drift.

## Riscos

Checksums globais de reviews anteriores já divergiam antes da execução; não
atualizar aprovações não revisadas para fabricar um gate verde.

TASK-004: smoke iOS claro/pt-BR e testes assistivos concluídos; Android, VoiceOver/TalkBack real, fontes ampliadas e matriz visual nativa ainda pendentes.
TASK-005: gates executados e documentação registrada; pnpm check continua bloqueado pelos checksums históricos e a conclusão aguarda reconciliação das reviews responsáveis.

Atualização 2026-09-01: a seta decorativa entre os campos passou para 28 px;
o teste de painel protege o tamanho e a exclusão da árvore de acessibilidade.
