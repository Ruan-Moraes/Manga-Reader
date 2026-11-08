# Review — MOB-FEAT-058

- Spec revisada: `spec.md`
- Implementação/revisão: commit cca433daf5c9994527681ec9650588734c0ea71f
- Gate na entrada do planejamento: `open`
- Dependências verificadas: MOB-FEAT-057 (`verification-pending`)
- Verdict: `verification-pending`

## Findings

Nenhum finding de código aberto. Observações:

1. **Informativa — "Voltar ao início" deixou de usar voltar.** Antes, o botão chamava `navigateBackOrReplace`, que
   voltava para a tela anterior quando havia histórico. Agora sempre substitui a rota por `/` (AC-001); voltar à tela
   anterior é a ação "Voltar", separada (AC-002).
2. **Informativa — texto do botão.** `notFound.goHome` mudou de "Ir para o início" para "Voltar ao início" (e
   equivalentes) nos três idiomas. Nenhum outro consumidor usa a chave.
3. **Informativa — ilustração nos testes.** O ambiente Jest do React Native usa `fontScale` 2, então a ilustração fica
   oculta nos testes de página, como manda a 057. A presença da ilustração é coberta pelos testes da 057.
4. **Informativa — estado vazio com retomada.** Quando há pedido de retomada, o estado vazio oferece "Abrir capítulo
   solicitado" em vez de "Sair do leitor", como já acontecia; o botão de sair continua no cabeçalho.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                           | Resultado                             |
| -------- | ------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------- |
| AC-001   | sim          | `NotFoundPage.test.tsx` (conteúdo, replace para `/`, sem "Buscar obras")                       | pass                                  |
| AC-002   | sim          | `NotFoundPage.test.tsx` (com e sem histórico)                                                  | pass                                  |
| AC-003   | sim          | `ReaderPageStates.test.tsx` (loading como status)                                              | pass                                  |
| AC-004   | sim          | `ReaderPageStates.test.tsx` (alerta, uma nova tentativa); `ReaderPage.test.tsx` (com retomada) | pass                                  |
| AC-005   | sim          | `ReaderPageStates.test.tsx` (vazio com sair; retomada com papéis do tema)                      | pass                                  |
| AC-006   | sim          | `i18n.test.ts` (paridade); testes de página com `fontScale` 2 do ambiente                      | pass em teste; capturas iOS pendentes |
| AC-007   | sim          | gates abaixo; `coverage.json`                                                                  | pass                                  |

## Gates

| Comando             | Resultado                                                                              |
| ------------------- | -------------------------------------------------------------------------------------- |
| `pnpm typecheck`    | pass                                                                                   |
| `pnpm lint`         | pass                                                                                   |
| `pnpm lint:fsd`     | pass                                                                                   |
| `pnpm test:ci`      | pass — 147 suítes, 1131 testes                                                         |
| `pnpm format:check` | fail — só arquivos com mudanças anteriores a esta feature (os mesmos da review da 057) |
| `pnpm specs:check`  | fail — apenas os 13 checksums de review divergentes anteriores; nenhum erro da 058     |
| `pnpm check`        | fail — interrompido pelo `specs:check` acima; demais etapas executadas separadamente   |

## Mudanças fora da spec

- Nenhuma.

## Conclusão

Os 7 critérios estão implementados com evidência automatizada. Verdict `verification-pending` porque TASK-006
(capturas no iOS Simulator em claro, escuro, fonte ampliada e 320 pt) continua aberta. Review feita pelo próprio
implementador, sem auditor externo.
