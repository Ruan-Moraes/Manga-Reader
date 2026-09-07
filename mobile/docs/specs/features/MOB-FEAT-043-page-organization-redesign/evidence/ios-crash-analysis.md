# Investigação do crash de arraste no iOS

Data: 2026-08-30. Critérios: AC-002, AC-004, AC-006 e AC-008.

## Bibliotecas e integração

O sortable pertence ao slice; não usa Drax. Gesture Handler 2.28.0 reconhece o
gesto, Reanimated 4.1.7 anima e Worklets 0.5.1 agenda as transições para RN.
React Native 0.81.5 e Expo 54.0.37 completam a instalação verificada.
Essas versões atendem `expo/bundledNativeModules.json`; o
`compatibility.json` instalado do Reanimated também aceita RN 0.81 e Worklets 0.5.
A [matriz oficial](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/)
confirma essa combinação. Não há evidência de incompatibilidade que justifique
trocar ou atualizar as bibliotecas neste diagnóstico.

O provider contém GestureHandlerRootView. O bundle iOS gerado pelo Metro contém
onStart/onUpdate/onFinalize transformados em worklets pelo plugin 0.5.1.

## Dois aborts na montagem nativa

Os relatórios `Expo Go-2026-08-30-144635.ips` e
`Expo Go-2026-08-30-144652.ips` registram aborts às 14:45:55 e 14:46:50:

```text
NSRangeException: range {6, 1} beyond bounds [0 .. 3] / [0 .. 1]
-[__NSArrayM removeObjectsInRange:]
-[RCTViewComponentView unmountChildComponentView:index:]
RCTMountingManager performTransaction
```

Nossa lista alternava `removeClippedSubviews={!drag.dragging}` em cada gesto.
No código nativo de RN 0.81.5, desligar clipping não remonta as views destacadas
nem limpa o array de acompanhamento; religar pode reconstruir uma lista parcial.
Isso explica a remoção com índice inválido nos logs e corresponde ao bug de RN
corrigido em [react-native#56211](https://github.com/facebook/react-native/pull/56211),
[commit 91e3f77](https://github.com/facebook/react-native/commit/91e3f773b7e571a503b57e09a1cb8a44ff26cd1e).
A API do GitHub e o patch oficial foram consultados; essa correção não existe
no arquivo nativo instalado de 0.81.5.

A mitigação mantém clipping desativado durante toda a vida da lista no iOS.
Android conserva o comportamento anterior. A janela virtualizada permanece
`windowSize=5`, lote de 8; desligar clipping nativo não renderiza todas as páginas.
Não foram alterados node_modules, lockfile, versões, persistência ou o atraso
contratual de 200 ms nesta correção.

## Terceiro abort: causa ainda não confirmada

`Expo Go-2026-08-30-144918.ips`, às 14:49:14, tem outra pilha:

```text
HermesRuntimeImpl::throwPendingError
worklets::WorkletEventHandler::process
reanimated::ReanimatedModuleProxy::handleEvent
RNGestureHandlerManager sendEventForReanimated
RNBetterPanGestureRecognizer activateAfterLongPress
```

Esse relatório não contém a mensagem da exceção JS. Ele antecede a mitigação
e o reinício, mas não pode ser atribuído ao clipping nem a Fast Refresh sem
nova evidência. A captura de stdout/stderr foi iniciada em um processo novo do
Expo Go, no iPhone 17 Simulator / iOS 26.5, para uma repetição do gesto real.

Via debugger Hermes, os callbacks de produção foram executados com
`runOnUISync` no runtime UI nativo: início, movimento e cancelamento passaram.
O movimento alterou `targetIndex` de 0 para 1, mantendo `activeIndex=0`;
o cancelamento não persistiu ordem. A configuração inspecionada conserva
`activateAfterLongPress=200`. O runtime Android conectado não foi tocado.
Essa execução não passa pelo reconhecedor físico nem pelo dispatcher nativo de
eventos e não encerra a investigação desse terceiro abort.

## Regressão e limites

Antes da correção, dois novos casos RNTL falharam por clipping estar ligado no
iOS. Depois, 3 suítes do slice / 37 testes passaram. Os casos verificam Grade e
Lista com 100 imagens, clipping estável em repouso/início/cancelamento/drop,
janela limitada e persistência somente no drop válido. `pnpm check` final é
registrado no review.

TASK-010 continua aberta para toque longo real, auto-scroll, cancelamento,
persistência, rotação, temas e diagnóstico do terceiro abort. A feature permanece
`verification-pending`; testes com mocks e callbacks nativos isolados não
certificam ausência de crash no gesto completo ou fluidez com 100 imagens.

## Refinamento posterior

O refinamento aprovado encontrou um abort novo em `_measure(null)` e uma sessão
que não terminava na Lista por referência anexada tarde. Ambos foram corrigidos
na integração do slice e receberam regressões que falham antes da correção.
Os testes nativos de callback de ida/volta em Grade e Lista terminaram em
repouso após recarga. Ver `drag-polish.md` para logs, evidência e limites.
Esses resultados não atribuem retroativamente uma causa ao terceiro abort das
14:49:14 nem encerram a matriz de gestos físicos.
