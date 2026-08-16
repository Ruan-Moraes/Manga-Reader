# Tasks — MOB-FEAT-013

- Spec: `spec.md`
- Status da spec no planejamento: `implemented`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-012`

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                        |
| -------- | ------------------ | -------------------------------------------------------------------------- |
| AC-001   | TASK-001           | RNTL da lista virtualizada e URI privada derivada                          |
| AC-002   | TASK-002           | Controller/filesystem com adição, cancelamento e rollback                  |
| AC-003   | TASK-003, TASK-014 | Repositório/controller de remoção e affordance destrutiva                  |
| AC-004   | TASK-004           | Repositório/controller de reorder, unicidade, contiguidade e reload        |
| AC-005   | TASK-005           | Modelo de possíveis duplicatas e RNTL do aviso não destrutivo              |
| AC-006   | TASK-006           | Persistência de confirmação, reset após edição e UI sem próxima etapa fake |
| AC-007   | TASK-007           | Testes de concorrência, erro sanitizado, rollback e reconciliação          |
| AC-008   | TASK-008           | Teste de virtualização/thumbnail e validação Android com 100 imagens       |
| AC-009   | TASK-009, TASK-014 | RNTL acessível, i18n trilíngue e ação destrutiva                           |
| AC-010   | TASK-010           | Teste SQLite de instalação v2 e migração v1→v2 sem perda                   |
| AC-011   | TASK-013           | RNTL do modal ampliado privado, fechamento e preservação                   |
| AC-012   | TASK-014           | RNTL do kanban padrão e alternância com scroll sem mutação                 |

## Checklist

- [x] TASK-001 — Expor URIs privadas e compor preview virtualizado na ordem persistida.
- [x] TASK-002 — Implementar adição incremental atômica sem substituir o lote existente.
- [x] TASK-003 — Implementar remoção coordenada, incluindo exclusão do último item/draft.
- [x] TASK-004 — Implementar reorder transacional com posições contíguas e persistentes.
- [x] TASK-005 — Derivar e exibir aviso heurístico de possível duplicata sem bloquear ações.
- [x] TASK-006 — Migrar/persistir confirmação e invalidá-la após qualquer edição.
- [x] TASK-007 — Serializar mutações, restaurar estado persistido em falhas e reconciliar órfãos.
- [x] TASK-008 — Limitar memória com lista virtualizada/thumbnails e executar validação física com 100 imagens.
- [x] TASK-009 — Adicionar i18n pt-BR/en-US/es-ES, semântica acessível e tokens.
- [x] TASK-010 — Implementar migrator SQLite v1→v2 e testes de upgrade/instalação limpa.
- [x] TASK-011 — Atualizar coverage/README e executar `pnpm check`.
- [x] TASK-012 — Produzir review e drift audit com o status comprovado pelas evidências.
- [x] TASK-013 — Implementar preview ampliado privado e acessível para cada miniatura.
- [x] TASK-014 — Implementar kanban padrão, scroll alternativo e melhorar a ação de exclusão.

## Ordem de execução

1. Testes e evolução versionada de `shared/storage` e `shared/files`.
2. Modelo e operações transacionais em `entities/local-media-import`.
3. Controller/hook/UI em `features/review-local-media-import`.
4. Composição em `pages/offline-translation`, i18n e rota existente.
5. Coverage, gates, validação física, review e drift audit.

## Riscos e bloqueios

- O gate está aberto porque `MOB-FEAT-012` está `implemented`.
- A migração deve preservar drafts v1; nenhum reset silencioso do banco é aceito.
- Filesystem e SQLite não compartilham transação: staging, rollback e reconciliação
  tornam o estado lógico atômico e recuperável.
- A feature ficará `verification-pending` se a validação física do preview com
  100 imagens não for executada.
- Idiomas, validação de mídia, OCR e tradução continuam fora destas tasks.
