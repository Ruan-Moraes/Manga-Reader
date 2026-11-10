# Review — MOB-FEAT-056

- Spec revisada: `spec.md` (com a revisão D3, opção A nas quatro linhas)
- Implementação/revisão: working-tree sha256:2339ec4bb7f8d942ab563185f86146c197170107c2e6b8ca6bc119986274ac87 (sem commit: árvore de trabalho da branch `feat/auth-refresh-rotation`)
- Gate na entrada do planejamento: `open`
- Dependências verificadas: MOB-FEAT-055 (`verification-pending`)
- Verdict: `verification-pending`

## Findings

1. **Média — verificação visual parcial.** Validado só no tema escuro, iPhone 18 Pro (iOS Simulator), contra o kit
   em 2026-11-09 (capturas em `docs/ui-captures/dark/design-kit-phase2-iphone18pro/`). Faltam claro, fonte ampliada, 320 pt e Android físico; TASK-012 continua
   aberta.
2. **Resolvida — momento da validação (D4).** A AC-003 pedia validação depois da ordem, mas a 015 exige idiomas
   confirmados. Ruan Moraes decidiu ajustar a spec (2026-11-09); a implementação já validava logo depois dos idiomas.
3. **Baixa — "Preparar e traduzir".** É uma ação só: prepara o capítulo e abre a folha "Antes de enviar" sozinha. O
   envio continua exigindo o aceite explícito; nada sai do aparelho antes.
4. **Baixa — chaves antigas sem uso.** As chaves `offline.flow.intro.*` (eyebrow e título por etapa) deixaram de ser
   usadas e continuam nos três locales; remover numa limpeza à parte.
5. **Informativa — projeto anterior.** O último projeto não abre mais sozinho na etapa final; fica no link "Retomar
   último capítulo" da etapa Páginas.
6. **Informativa — rodapé fixo.** O botão principal de cada painel vai para o rodapé pelo slot `PrimaryAction`
   (`shared/ui/ActionSlot`); fora da página do fluxo, os painéis continuam com o botão no lugar.
7. **Informativa — testes antigos alterados conforme a spec.** Na página do fluxo, as asserções dos títulos por etapa
   viraram a `StepBar` e o projeto anterior passou pelo link "Retomar". O teste da 014 do par igual visível virou o
   de idioma desabilitado (AC-013). Os testes de vínculo da 055 usam o rótulo "Preparar e traduzir".
8. **Informativa — consentimento.** A folha do lote mostra três itens curtos; "Ver detalhes" mostra o texto completo
   anterior (017), sem mudança. O painel de página única (`RemoteProcessingPanel`) não mudou.
9. **Informativa — review feita pelo implementador**, sem auditor externo.

## Validação visual (escuro, iPhone 18 Pro, 2026-11-09)

Comparação lado a lado com `ui_kits/mobile` (kit servido localmente, `tlm-dark`). Corrigido nesta rodada:

- **Etapa 3 em um cartão, como no kit:** cabeçalho "N páginas · N selecionadas" com "Selecionar todas/Limpar seleção",
  linhas de 80 com miniatura 40×60, "Página N" e legenda colorida pelo estado, chip só depois de iniciar e marcação à
  direita; "Interromper" virou ação de texto no cabeçalho. Saiu o cartão "Projeto preparado" (o cartão "Salvar em" já
  mostra idiomas e destino); projeto retomado já processado ainda mostra o aviso da 012.
- **Folha "Antes de enviar":** itens com quadro de ícone 40 (`accentSoft`), título e texto, ícones do kit
  (`server-outline`, `shield-checkmark-outline`) e "Agora não" como ghost. Chaves novas `batch.consentItem.*`.
- **Piscar da etapa 1 ao preparar:** o rascunho saía antes de o projeto chegar; `onDraftConsumed` passou a receber o
  projeto e a página aplica os dois no mesmo render.
- **`PressableBox`:** no aparelho o NativeWind descarta `style` em função do `Pressable` (seleção, linhas de folha,
  `TextAction`, `SelectField`). Corrigido na raiz; teste próprio.

Desvios mantidos de propósito: rótulos "Aceitar e enviar" (017), descrição com a contagem no topo da folha,
miniatura neutra (as páginas do projeto não expõem URI aqui) e o título do capítulo com o rótulo livre da 055 ("1").
Melhoria apontada, não aplicada: ao retomar um projeto já vinculado, o cartão mostra "Sem obra" porque o vínculo não é
relido.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                    | Resultado                         |
| -------- | ------------ | --------------------------------------------------------------------------------------- | --------------------------------- |
| AC-001   | sim          | `translationFlow.test.ts` (três etapas); `OfflineTranslationPage.test.tsx`              | pass                              |
| AC-002   | sim          | `translationFlow.test.ts`; testes de página com confirmações por ação                   | pass                              |
| AC-003   | sim          | `OfflineTranslationPage.test.tsx` (validação automática)                                | pass (D4)                         |
| AC-004   | sim          | `ActionSlotStepBar.test.tsx`; rodapé fixo em `OfflineTranslationPage.test.tsx`          | pass em teste; captura pendente   |
| AC-005   | sim          | `translationFlow.test.ts`; voltar, Home e saída em processamento na página              | pass                              |
| AC-006   | sim          | `ChapterBatchKit.test.tsx` (nada enviado antes do aceite)                               | pass                              |
| AC-007   | sim          | `ChapterBatchKit.test.tsx` (selos, todas e nenhuma); `ChapterBatchPanel.test.tsx`       | pass                              |
| AC-008   | sim          | `i18n.test.ts`; chaves nos três locales                                                 | pass em teste; capturas pendentes |
| AC-009   | sim          | `OfflineTranslationPage.test.tsx` com `__DEV__` falso                                   | pass                              |
| AC-010   | sim          | gates abaixo; `coverage.json`                                                           | pass                              |
| AC-011   | sim          | `ChapterBatchKit.test.tsx` (três itens, detalhes, recusa)                               | pass                              |
| AC-012   | sim          | `OfflineTranslationPage.test.tsx` (escolha, vínculo, falha e "Tentar vincular de novo") | pass                              |
| AC-013   | sim          | `TranslationLanguageSelectionPanel.test.tsx` (desabilitado e trocar)                    | pass                              |

## Gates

| Comando             | Resultado                                                |
| ------------------- | -------------------------------------------------------- |
| `pnpm typecheck`    | pass                                                     |
| `pnpm lint`         | pass                                                     |
| `pnpm lint:fsd`     | pass                                                     |
| `pnpm test:ci`      | pass — 162 suítes, 1228 testes (2026-11-09)              |
| `pnpm format:check` | fail — só trechos com mudanças anteriores a esta feature |
| `pnpm specs:check`  | fail — só os 13 checksums anteriores (017–054)           |
| `pnpm check`        | fail — interrompido pelo `specs:check`                   |

## Mudanças fora da spec

- Nenhuma mudança de gateway, contrato de dados, política de consentimento ou regra de retry.

## Conclusão

Os 13 critérios estão implementados com evidência automatizada; a divergência da AC-003 foi resolvida pela D4. Verdict `verification-pending` porque TASK-012 (verificação visual) continua aberta.
