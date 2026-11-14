# Review — MOB-FEAT-060

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:2339ec4bb7f8d942ab563185f86146c197170107c2e6b8ca6bc119986274ac87 (sem commit: árvore de trabalho da branch `feat/auth-refresh-rotation`)
- Gate na entrada do planejamento: `open`
- Dependências verificadas: MOB-FEAT-055 e MOB-FEAT-057 (`verification-pending`)
- Verdict: `verification-pending`

## Findings

1. **Média — verificação visual parcial.** Validado só no tema escuro, iPhone 18 Pro (iOS Simulator), contra o kit
   em 2026-11-09 (capturas em `docs/ui-captures/dark/design-kit-phase2-iphone18pro/`). Faltam claro, alto contraste, fonte a 200 %, 320 pt e Android físico;
   TASK-010 continua aberta.
2. **Baixa — nomes sugeridos ao vincular ou mover.** A 055 exige número ou nome no vínculo. As folhas "Mover para obra"
   e "Vincular capítulos" sugerem o próximo número da obra, visível e editável; nada é gravado sem a ação da pessoa.
   O título "Capítulo de <data>" (D16) continua só derivado.
3. **Baixa — estado "incerta" não aparece na biblioteca.** O `StatusChip` tem os cinco estados (AC-011), mas a
   biblioteca deriva o estado das páginas (aguardando, processando, salva, falhou). Tentativa incerta exige consultar
   as tentativas e fica para a 056.
4. **Informativa — linha com ações irmãs.** As linhas de capítulo usam `ItemRow` (área principal e ações lado a lado)
   em vez de `ListRow` com botões dentro, para o "⋯" e a pílula continuarem alcançáveis pelo VoiceOver.
5. **Informativa — rodapé fixo.** `ScreenScaffold` e `PageContainer` ganharam `stickyFooter`, fora da rolagem;
   telas existentes não mudam.
6. **Informativa — contratos alterados conforme a spec.** A lista antiga (`LocalWorksPanel`, `LocalTranslationLibrary`
   e os `Alert`) saiu. Seus casos de 025/AC-001..004 e 055/AC-002/003 passaram para `LibraryShelf.test.tsx` e
   `WorkScreens.test.tsx`. `routes.test.ts` (010) passou a esperar as duas rotas públicas novas. A listagem da
   biblioteca expõe `progressUpdatedAt` (só leitura, sem migração).
7. **Informativa — "Tentar traduzir de novo"** abre o painel de lote da 055 numa folha, com o consentimento e o retry
   seletivo dela; nada é reenviado automaticamente.
8. **Informativa — review feita pelo implementador**, sem auditor externo.

## Validação visual (escuro, iPhone 18 Pro, 2026-11-09)

Comparação lado a lado com `ui_kits/mobile`. Corrigido nesta rodada:

- **Alta — obra abria o login.** O `SessionGate` lista os segmentos públicos à mão e não tinha `work`; visitante em
  `/work/<id>` era mandado para "Entrar". Incluído `work` e casos novos no teste do gate.
- **Biblioteca:** "Selecionar" com o tom de acento do kit; barra de progresso do cartão recortada dentro da capa.
- **Obra:** linha de idiomas com ícone `language` e seta espaçada ("ja → pt-BR"); rodapé "Continuar" com ▶.
- **Gerenciar:** resumo com capa 52 e nome em label; `ListRow` (compartilhada, também 057/062) com chevron 20 na cor
  `tertiary`, sem chevron na linha de perigo e 12 de padding vertical com tile (altura 64), como o `SettingsRow` do
  kit. A altura mínima segue o contrato 057/AC-012.

Ajustes posteriores a pedido (2026-11-09): o "⋯" dos cartões da biblioteca não tem mais fundo ao tocar
(`IconButton bare`, retorno por opacidade) e a tela da obra perdeu o atalho "Editar nome" (renomear segue no menu "⋯"
da biblioteca e em Gerenciar > Nome).

Desvios mantidos: Home no cabeçalho (055), capa padrão com o logo (D15), grade de 2 colunas (043), título no cabeçalho
da obra. Melhoria apontada: exibir "Capítulo N" quando o rótulo da 055 for só um número.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                             | Resultado                         |
| -------- | ------------ | -------------------------------------------------------------------------------- | --------------------------------- |
| AC-001   | sim          | `LibraryShelf.test.tsx` (esqueleto, grade, contagem, selo, "⋯", nova obra)       | pass                              |
| AC-002   | sim          | `libraryOverview.test.ts`; `LibraryShelf.test.tsx` (com e sem progresso)         | pass                              |
| AC-003   | sim          | `libraryOverview.test.ts`; `LibraryShelf.test.tsx` (ordem e exclusão em lote)    | pass                              |
| AC-004   | sim          | `LibraryShelf.test.tsx` (menu, renomear, capa, `ConfirmSheet`)                   | pass                              |
| AC-005   | sim          | `LibraryShelf.test.tsx` (sem obra, mover, excluir)                               | pass                              |
| AC-006   | sim          | `WorkScreens.test.tsx` (topo, selos, linhas, ordem, rodapé)                      | pass                              |
| AC-007   | sim          | `WorkScreens.test.tsx`; `LocalTranslationLibraryPage.test.tsx` (retry pela 055)  | pass                              |
| AC-008   | sim          | `WorkScreens.test.tsx` (gerenciar, vínculo múltiplo, excluir)                    | pass                              |
| AC-009   | sim          | `LocalTranslationLibraryPage.test.tsx`; `LibraryShelf.test.tsx`                  | pass                              |
| AC-010   | sim          | `LibraryShelf.test.tsx`; `WorkScreens.test.tsx` (vazio, erro, falha de operação) | pass                              |
| AC-011   | sim          | `StatusChip.test.tsx`                                                            | pass                              |
| AC-012   | sim          | `routes.test.ts`; páginas; `i18n.test.ts`; `fontScale` 2 do ambiente             | pass em teste; capturas pendentes |
| AC-013   | sim          | suíte completa verde; gates abaixo; `coverage.json`                              | pass                              |
| AC-014   | parcial      | libraryOverview.test.ts e WorkScreens.test.tsx                                   | verificação física pendente       |

## Gates

| Comando             | Resultado                                                 |
| ------------------- | --------------------------------------------------------- |
| `pnpm typecheck`    | pass                                                      |
| `pnpm lint`         | pass                                                      |
| `pnpm lint:fsd`     | pass                                                      |
| `pnpm test:ci`      | pass — 162 suítes, 1228 testes (2026-11-09)               |
| `pnpm format:check` | fail — só arquivos com mudanças anteriores a esta feature |
| `pnpm specs:check`  | fail — só os 13 checksums anteriores (017–054)            |
| `pnpm check`        | fail — interrompido pelo `specs:check`                    |

Nota: a review da 055 usa checksum de working tree e diverge assim que a árvore muda; isso vale também para esta.

## Mudanças fora da spec

- Nenhuma regra de dados, migração, lote, consentimento ou gateway mudou.

## Conclusão

Os 13 critérios estão implementados com evidência automatizada. Verdict `verification-pending` porque TASK-010
(verificação visual no iOS Simulator e Android físico) continua aberta.
