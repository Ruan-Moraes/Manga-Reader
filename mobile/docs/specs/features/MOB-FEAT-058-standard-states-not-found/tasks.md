# Tasks — MOB-FEAT-058

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências: MOB-FEAT-057 (`verification-pending`, primitivas executadas)

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                   |
| -------- | ------------------ | --------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-002 | RNTL da `NotFoundPage` (conteúdo, replace para `/`)                   |
| AC-002   | TASK-001, TASK-002 | RNTL com e sem histórico (`canGoBack` simulado)                       |
| AC-003   | TASK-003, TASK-004 | RNTL da `ReaderPage` em loading                                       |
| AC-004   | TASK-003, TASK-004 | RNTL da `ReaderPage` em erro, com e sem retomada; contagem de refetch |
| AC-005   | TASK-003, TASK-004 | RNTL da `ReaderPage` sem páginas e na escolha de retomada             |
| AC-006   | TASK-005, TASK-006 | chaves nos três locales; RNTL com `fontScale` 2; capturas iOS         |
| AC-007   | TASK-007           | `pnpm lint:fsd`, `pnpm typecheck`, testes, `coverage.json`            |

## Checklist

- [x] TASK-001 — Reescrever `src/pages/not-found/ui/NotFoundPage.tsx` com `StateView kind="notfound"` (eyebrow, título, texto, "Voltar ao início" com replace para `/`, "Voltar" e botão do cabeçalho só com histórico).
- [x] TASK-002 — Criar `src/pages/not-found/ui/__tests__/NotFoundPage.test.tsx` cobrindo AC-001 e AC-002.
- [x] TASK-003 — Em `src/pages/reader/ui/ReaderPage.tsx`, trocar carregando por `LoadingBlock`, erro por `StateView kind="error"` (com a ação de capítulo pedido quando houver retomada), sem páginas por `StateView kind="empty"`, e a escolha de retomada para `AppText`.
- [x] TASK-004 — Atualizar `src/pages/reader/ui/__tests__/ReaderPage.test.tsx` para os estados novos sem perder os casos atuais.
- [x] TASK-005 — Adicionar as chaves novas da 404 em `common.json` (`pt-BR`, `en-US`, `es-ES`) e testar a paridade.
      Execução: `notFound.eyebrow` novo e `notFound.goHome` alterado para "Voltar ao início" nos três idiomas; paridade coberta por `src/shared/i18n/__tests__/i18n.test.ts`.
- [ ] TASK-006 — Verificar fonte a 200%, 320 pt, alto contraste e temas; capturas da 404 e dos estados do leitor no iOS Simulator (fica aberta se não for executada).
- [x] TASK-007 — Mapear arquivos no `coverage.json`, rodar `pnpm lint:fsd`, `pnpm typecheck`, `pnpm test:ci` e `pnpm check`, e registrar review e drift.

`implemented` exige todos os checkboxes concluídos. Quando o código estiver pronto, mas uma verificação real ainda estiver aberta, usar `verification-pending` e manter a task correspondente desmarcada.

## Riscos e bloqueios

- `pnpm check` falha antes desta feature pelos 13 checksums de review divergentes; registrar separadamente.
- `ReaderPage` é coberta pela MOB-FEAT-005 (`verification-pending`): os testes de retomada e progresso precisam continuar verdes.
- Estado "sem conexão" fica fora (D5).
