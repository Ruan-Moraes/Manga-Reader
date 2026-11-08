# Review — MOB-FEAT-059

- Spec revisada: `spec.md`
- Implementação/revisão: commit b19d613f68b7f3d2b60fc61d0a4dc806fa732c51
- Gate na entrada do planejamento: `open`
- Dependências verificadas: MOB-FEAT-057 (`verification-pending`)
- Verdict: `verification-pending`

## Findings

1. **Baixa — rótulo de acessibilidade fixo na imagem de destaque (anterior a esta feature).** `EditorialHero.tsx`
   mantém `accessibilityLabel` em português fixo. A imagem é decorativa e oculta para leitores de tela
   (`accessibilityElementsHidden`), então o texto não é anunciado; não foi alterado por estar fora dos AC. Recomendo
   remover o rótulo ou traduzi-lo numa correção separada.
2. **Informativa — cartões sem sombra.** O cartão de módulo deixou de ter sombra leve e passou a ter borda
   `separator` de 1, como no kit e no requisito "superfície neutra com borda". O foco muda só a cor da borda.
3. **Informativa — testes da 010 atualizados.** Os dois testes que esperavam navegação direta ao tocar em "Plataforma
   de leitura" agora passam pela folha (alteração da 010/AC-002 prevista na spec). Destinos e `returnTo` são os mesmos.
4. **Informativa — fechar da folha.** Rótulo próprio `launcher.platform.closeSheet` em vez de reaproveitar outro
   namespace.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                                                  | Resultado                             |
| -------- | ------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| AC-001   | sim          | `ModuleSelectorPage.test.tsx` (display, imagem 16:9, raio 16, borda)                                                  | pass                                  |
| AC-002   | sim          | `ModuleSelectorPage.test.tsx` (tile 48, status com ponto, altura 88)                                                  | pass                                  |
| AC-003   | sim          | `ModuleSelectorPage.test.tsx` (folha; visitante ao login com retorno; autenticado ao status; quatro formas de fechar) | pass                                  |
| AC-004   | sim          | `ModuleSelectorPage.test.tsx` (atalho para `/translation-library`)                                                    | pass                                  |
| AC-005   | sim          | `ModuleSelectorPage.test.tsx` (`__DEV__` falso)                                                                       | pass                                  |
| AC-006   | sim          | `i18n.test.ts` (paridade de `launcher`); testes com `fontScale` 2 do ambiente                                         | pass em teste; capturas iOS pendentes |
| AC-007   | sim          | testes da 010 (`ModuleSelectorPage.test.tsx`, `PlatformStatusPage.test.tsx`) verdes; gates abaixo                     | pass                                  |

## Gates

| Comando             | Resultado                                                                          |
| ------------------- | ---------------------------------------------------------------------------------- |
| `pnpm typecheck`    | pass                                                                               |
| `pnpm lint`         | pass                                                                               |
| `pnpm lint:fsd`     | pass                                                                               |
| `pnpm test:ci`      | pass — 147 suítes, 1140 testes                                                     |
| `pnpm format:check` | fail — só arquivos com mudanças anteriores a esta feature                          |
| `pnpm specs:check`  | fail — apenas os 13 checksums de review divergentes anteriores; nenhum erro da 059 |
| `pnpm check`        | fail — interrompido pelo `specs:check`; demais etapas executadas separadamente     |

## Mudanças fora da spec

- Nenhuma.

## Conclusão

Os 7 critérios estão implementados com evidência automatizada. Verdict `verification-pending` porque TASK-007
(capturas no iOS Simulator) continua aberta. Review feita pelo próprio implementador, sem auditor externo.
