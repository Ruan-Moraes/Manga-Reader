# Review — MOB-FEAT-034

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:fe36e4ae0652a15629be2bd2578585101e48391976c70da9aa8b284eb8691144
- Gate na entrada do planejamento: `open`
- Dependência verificada: `MOB-FEAT-033`
- Verdict: `verification-pending`

## Critérios e evidências

| Critério | Evidência                                               | Resultado            |
| -------- | ------------------------------------------------------- | -------------------- |
| AC-001   | `SwitchRow`, teste dirigido e auditoria nativa          | pass                 |
| AC-002   | `ChoiceCards`, teste e aparência no simulador           | pass                 |
| AC-003   | `SwatchPicker`, reader e auditoria nativa               | pass                 |
| AC-004   | `RangeSlider`, regressão Android e inspeção no emulador | verification-pending |
| AC-005   | `SettingsSyncStatus`, índice e testes                   | pass                 |
| AC-006   | árvore assistiva, auditoria nativa e gates              | pass                 |

## Findings

Nenhum finding bloqueante permanece. O slider mantém um valor local durante o
gesto, ignora repetições do mesmo step e persiste somente ao soltar, evitando
retorno e trabalho global por frame. A escolha de fundo permanece controlada
sem borda selecionada, com cinco células não colapsáveis e rótulos individuais;
as larguras numéricas são derivadas da medição real do grupo para impedir o
colapso observado no iOS. Espaçamento e pré-carregamento seguem os intervalos
do web.

Em 2026-09-05, a pesquisa do `@react-native-community/slider` confirmou que o
controle não é controlado e possui relato aberto de salto/flicker no Android
após release. O componente foi substituído por um gesto local com Reanimated e
Gesture Handler já presentes no Expo SDK 54. O valor do thumb fica no UI thread
durante o pan e cruza para o consumidor uma vez em `onEnd`.

A regressão agora cobre os dois sentidos de arraste, prop anterior, evento de
movimento posterior ao release, cancelamento, toque no trilho, extremos e as
duas particularidades Android: `translationX` reiniciado na ativação e ponto
terminal entregue somente no evento de término. A inspeção no emulador Android
confirmou 100%→50% e 0%→50%, inclusive após a persistência, sem salto. Falta a
confirmação no aparelho físico que reproduzia o defeito antes de promover o
verdict.

## Gates

Os resultados completos estão em `evidence/automated-gates.md`.

## Conclusão

Os controles preservam os contratos de preferências e melhoram hierarquia,
toque, leitura e consistência sem ampliar o domínio funcional. A única
pendência é a validação no aparelho Android físico.

Revalidação global de 2026-08-30: checksum da working tree atualizado após a
manutenção dos TODOs de auth/review local. A referência é global por definição
do validador; não representa nova inspeção nativa desta feature.
