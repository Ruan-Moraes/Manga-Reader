# Review — MOB-FEAT-024

- Spec revisada: `spec.md`
- Implementação/revisão: commits 1ed803c5e76f2c3d76c3f06ad3d5c3f46170f1c0 (selo e fade) e
  f981c0c8cdc3851b896568b41f504fe670bfe117 (toast)
- Gate na entrada do planejamento: `open`
- Dependências verificadas: `MOB-FEAT-022` em `verification-pending`
- Verdict: `verification-pending`

## Findings

- **Média:** o fade não foi visto no simulador nem no aparelho. Nos testes, a animação usa o driver nativo; o teste
  confere a chamada (de 0 a 1 em 300 ms) e a remoção do original ao final, não o efeito visual.
- **Média:** o toast não foi visto no simulador nem no aparelho. A largura vem de `useWindowDimensions`, que no Jest
  não segue o `SafeAreaProvider`; o teste só confere o canto (direita e acima da área segura) e o limite de 360.
- **Informativo:** o toast é um porte do web (`shared/ui/toast`), não um componente compartilhado: o mobile não usa
  código do web. Mudanças de estilo no web precisam ser repetidas aqui.
- **Informativo:** o toast usa `ActivityIndicator` e tokens de tema; não há cor fixa no código.

## Verificação no simulador iOS (2026-11-20)

Ambiente: iPhone 18 Pro Max (simulador) com Expo Go, contra o gateway real; 4 páginas de Pepper&Carrot en.

O que foi visto (com o selo por página, antes da troca pelo toast):

- O leitor abriu sozinho com a primeira página pronta.
- As páginas ainda em processamento mostravam o original com o selo "Traduzindo…".
- Segundos depois, a página 2 trocou para a tradução e o selo sumiu, enquanto a página 3 seguia com o selo.

O que falta:

- A duração do fade não foi medida. As capturas são quadros parados, tirados a cada ~5 s.
- O aparelho físico não foi testado.
- O toast, que substituiu o selo, ainda não foi visto no simulador.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                                                                     | Resultado |
| -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| AC-001   | sim          | `LocalTranslationReaderPage.test.tsx`: toast nos três locales, contagem, dispensar, "Tradução pronta"; `Toast.test.tsx`; página sem selo | pass      |
| AC-002   | sim          | `ImageSurface.test.tsx`: fade após carregar, movimento reduzido, sem fade inicial                                                        | pass      |
| AC-003   | sim          | `CreateTranslationProjectPanel.test.tsx`: estados nos três locales                                                                       | pass      |

## Gates

| Comando                                | Resultado                                            |
| -------------------------------------- | ---------------------------------------------------- |
| `npx jest --pool=forks`                | pass: 123 suítes, 986 testes                         |
| `npx tsc --noEmit`                     | pass, salvo o erro já existente de `SessionGate.tsx` |
| `node scripts/checks/validate-fsd.mjs` | pass                                                 |

## Mudanças fora da spec

- As chaves antigas `offline.project.preparedTitle` e `preparedDescription` foram substituídas por
  `offline.project.card.<estado>`.

## Conclusão

Os três critérios passam em testes. Falta ver o fade e o toast no simulador ou no aparelho (TASK-005).
