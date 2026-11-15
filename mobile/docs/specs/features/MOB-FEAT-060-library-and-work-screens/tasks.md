# Tasks — MOB-FEAT-060

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências: MOB-FEAT-055 e MOB-FEAT-057 (`verification-pending`)

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                       |
| -------- | ------------------ | ------------------------------------------------------------------------- |
| AC-001   | TASK-002, TASK-003 | RNTL da biblioteca (esqueleto, grade, contagem, nova obra)                |
| AC-002   | TASK-002, TASK-003 | modelo da visão geral e RNTL com e sem progresso                          |
| AC-003   | TASK-003           | RNTL da ordenação e do modo seleção com exclusão em lote                  |
| AC-004   | TASK-004           | RNTL do menu da obra, folhas e `ConfirmSheet`                             |
| AC-005   | TASK-004           | RNTL da seção "Sem obra" e da folha "Mover para obra"                     |
| AC-006   | TASK-005           | RNTL da tela da obra e do rodapé nos três casos                           |
| AC-007   | TASK-006           | RNTL do menu do capítulo, com e sem páginas falhas                        |
| AC-008   | TASK-007           | RNTL da tela de gerenciamento e da folha de vínculo                       |
| AC-009   | TASK-008           | RNTL de navegação biblioteca → obra → leitor                              |
| AC-010   | TASK-009           | RNTL dos estados vazio e de erro e das falhas de operação                 |
| AC-011   | TASK-001           | RNTL do `StatusChip`                                                      |
| AC-012   | TASK-008, TASK-010 | rotas, chaves nos três locales, `fontScale` 2; capturas pendentes         |
| AC-013   | TASK-011           | testes da 025 e 055 verdes; gates; `coverage.json`                        |
| AC-014   | TASK-012           | libraryOverview.test.ts e WorkScreens.test.tsx; validação Android física. |

## Checklist

- [x] TASK-001 — Criar `StatusChip` em `src/shared/ui` (aguardando, processando, salva, falhou, incerta) com ícone, rótulo e superfície suave; testes.
- [x] TASK-002 — Criar em `widgets/local-translation-library/model` a visão geral da biblioteca (obras, capítulos, estado derivado das páginas, progresso e "Continuar lendo", capítulos sem obra com título por data) e o carregador; expor `progressUpdatedAt` na listagem da biblioteca; testes.
- [x] TASK-003 — Reescrever a biblioteca: esqueleto, "Continuar lendo", `SectionHeader` "Obras" com "Recentes/A–Z" (sessão) e "Selecionar", grade 2:3 com progresso, selo e "⋯", "Nova obra", modo seleção com exclusão em lote e rodapé "Traduzir capítulo".
- [x] TASK-004 — Menus em `ActionSheet` e folhas (nova obra, renomear, capa, mover para obra) e exclusões em `ConfirmSheet`, removendo os `Alert` de `LocalWorksPanel` e `LocalTranslationLibrary`; seção "Sem obra".
- [x] TASK-005 — Tela da obra (`/work/[workId]`): topo com capa, nome, metadados e selos; capítulos em linhas de 64 com pílula e "⋯", ordem "1 → N"/"N → 1", "Novo" e rodapé por progresso.
- [x] TASK-006 — Menu do capítulo: abrir, "Tentar traduzir de novo" (só com páginas falhas, usando o painel de lote da 055 com o consentimento vigente), renomear e excluir com confirmação.
- [x] TASK-007 — Gerenciar obra (`/work/[workId]/manage`): informações, vínculo com seleção múltipla e zona de risco.
- [x] TASK-008 — Registrar as rotas em `ROUTES` e `PUBLIC_ROUTES`, criar cascas em `src/app/work`, tratar obra inexistente voltando à biblioteca e cobrir a navegação em dois toques.
- [x] TASK-009 — Estados vazio e de erro com `StateView`, erros de operação perto da causa sem afirmar sucesso.
- [ ] TASK-010 — Chaves novas em `localTranslation` nos três idiomas; verificar fonte ampliada, 320 pt, claro/escuro e alto contraste com capturas no iOS Simulator e Android físico (fica aberta se não for executada).
- [x] TASK-011 — Atualizar os testes da 025 e 055 que codificavam a lista antiga, mapear arquivos no `coverage.json`, rodar gates e registrar review e drift.
      Execução: `LocalWorksPanel` e `LocalTranslationLibrary` (e seus testes) foram substituídos por `LibraryShelf`, `WorkDetail` e `WorkManage`; a evidência de 025/AC-001..004 e 055/AC-002/003 passou para `LibraryShelf.test.tsx` e `WorkScreens.test.tsx`.

`implemented` exige todos os checkboxes concluídos. Quando o código estiver pronto, mas uma verificação real ainda estiver aberta, usar `verification-pending` e manter a task correspondente desmarcada.

## Riscos e bloqueios

- A biblioteca antiga (`LocalWorksPanel`, `LocalTranslationLibrary`) é evidência de 025 e 055; seus casos migram para os testes novos.
- `pnpm check` segue vermelho pelos checksums de review divergentes anteriores; registrar à parte.

- [ ] TASK-012 — Hierarquia e posição de leitura. Código e regressões preparados. Validar em Android físico.
