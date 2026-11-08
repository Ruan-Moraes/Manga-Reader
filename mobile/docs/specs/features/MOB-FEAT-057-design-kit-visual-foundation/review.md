# Review — MOB-FEAT-057

- Spec revisada: `spec.md`
- Implementação/revisão: commit e8b8ccc4568f8da7e18e8834bbc8fdfb8fc1a26b
- Gate na entrada do planejamento: `open`
- Dependências verificadas: nenhuma (`blocked_by: []`)
- Verdict: `verification-pending`

## Findings

Nenhum finding de código aberto. Observações registradas na inspeção:

1. **Baixa — painel do leitor fora do padrão de folha.** `widgets/content-reader/ui/ReaderPanel.tsx` continua com
   raio `card` (16) e estrutura própria. É intencional: a spec deixa o painel fora do escopo (área da 055).
2. **Baixa — `separated` do `SwatchPicker` virou sem efeito.** A prop foi mantida para não quebrar o consumidor
   `ReaderSettingsControls`; todas as instâncias agora usam as amostras separadas do AC-010.
3. **Informativa — altura máxima do `SelectField`.** Antes era `maxHeight: '82%'` da janela; agora é 82% da altura
   segura (janela menos o inset superior), calculada pela `BottomSheet`. A altura natural continua vindo de
   `resolveSelectSheetHeight`, que já usava a área segura. Os testes da 042 passam sem alteração.
4. **Informativa — opacidade das superfícies suaves.** No tema claro ficou em 0,06, não 0,10 como no kit, para manter
   o AA. Decisão D12, registrada na spec.
5. **Informativa — ilustrações em WebP.** As três novas entram como `.webp` (43–49 KB). `pensando` reaproveita o PNG
   existente.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                                                      | Resultado                                           |
| -------- | ------------ | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| AC-001   | sim          | `designKitTokens.test.tsx` (escalas por densidade, contexto, movimento reduzido)                                          | pass                                                |
| AC-002   | sim          | `designKitTokens.test.tsx` (AA nas quatro paletas); `designKitStatus.test.tsx`                                            | pass                                                |
| AC-003   | sim          | `designKitSheets.test.tsx`; testes do `SelectField` em `sharedUi.test.tsx` e `TranslationLanguageSelectionPanel.test.tsx` | pass                                                |
| AC-004   | sim          | `designKitSheets.test.tsx` (fechar antes de executar; cancelar, scrim e voltar sem efeito)                                | pass                                                |
| AC-005   | sim          | `designKitStates.test.tsx` (por `kind` e modo, `@ts-expect-error`, `EmptyState` compatível)                               | pass                                                |
| AC-006   | sim          | `designKitStates.test.tsx` (rótulo, `role="status"`, pulso estático)                                                      | pass                                                |
| AC-007   | sim          | `designKitSections.test.tsx`                                                                                              | pass                                                |
| AC-008   | sim          | `designKitControls.test.tsx`; testes do segmentado em `sharedUi.test.tsx`                                                 | pass                                                |
| AC-009   | sim          | `designKitControls.test.tsx`; testes 034/AC-004 em `sharedUi.test.tsx`                                                    | pass                                                |
| AC-010   | sim          | `designKitControls.test.tsx`; `ReaderSettingsControls.test.tsx` atualizado (substitui 034/AC-003)                         | pass em teste; captura iOS pendente                 |
| AC-011   | sim          | `designKitControls.test.tsx`; `sharedUi.test.tsx` (rádio 22)                                                              | pass                                                |
| AC-012   | sim          | `designKitControls.test.tsx` (com e sem tile)                                                                             | pass                                                |
| AC-013   | sim          | `evidence/assets.md` (tamanhos e SHA-256)                                                                                 | pass; conferência das três no aparelho pendente     |
| AC-014   | sim          | `designKitAccessibility.test.tsx`; `designKitStates.test.tsx`                                                             | pass em teste; Simulator e Android físico pendentes |
| AC-015   | sim          | `designKitBarrel.test.ts`; `coverage.json`; gates abaixo                                                                  | pass                                                |

## Gates

| Comando             | Resultado                                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`    | pass                                                                                                                                                                                                                                                 |
| `pnpm lint`         | pass                                                                                                                                                                                                                                                 |
| `pnpm lint:fsd`     | pass                                                                                                                                                                                                                                                 |
| `pnpm test:ci`      | pass — 144 suítes, 1122 testes (antes do `designKitBarrel.test.ts`, que passa isolado)                                                                                                                                                               |
| `pnpm format:check` | fail — só arquivos com mudanças anteriores a esta feature (`coverage.json` da working tree, spec 056, `startRemoteProcessing.ts`, `OfflineTranslationPage.test.tsx`, `LocalTranslationLibraryPage.tsx`); a versão commitada de `coverage.json` passa |
| `pnpm specs:check`  | fail — apenas os 13 checksums de review divergentes anteriores (017, 018, 019, 021, 025, 026, 027, 049, 050, 051, 052, 053, 054); nenhum erro da 057                                                                                                 |
| `pnpm check`        | fail — interrompido pelo `specs:check` acima; as demais etapas foram executadas separadamente                                                                                                                                                        |

## Mudanças fora da spec

- Nenhuma. Nenhuma tela, rota, texto de produto, opção, persistência ou dependência foi alterada.

## Conclusão

Os 15 critérios estão implementados e cobertos por testes automatizados. O verdict é `verification-pending`
porque TASK-016 continua aberta: capturas no iOS Simulator em claro e escuro, conferência visual das três
ilustrações no aparelho e validação em Android físico. Review feita pelo próprio implementador, sem auditor
externo. Próximo passo SDD: executar TASK-016 e, com ela concluída e o `specs:check` histórico resolvido por
uma pessoa, promover a feature a `implemented`.
