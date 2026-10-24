# Migração para Expo SDK 57

Plano executado em 2026-09-05 para migrar diretamente do Expo SDK 54 ao SDK 57,
preservar o comportamento do produto e estabelecer `src/app` como raiz do Expo
Router.

## Resultado

- Expo 57, React Native 0.86.3, React 19.2.3 e TypeScript 6.0.3 alinhados;
- dependências Expo reconciliadas por `expo install --check`;
- rotas movidas para `src/app`, com `src/application` preservada como app layer
  lógica;
- bundle Hermes iOS e fluxos críticos validados no iPhone 17/iOS 26.5;
- gates TypeScript, Jest, ESLint e FSD executados;
- documentação consolidada sob `mobile/docs`.

## Fontes normativas e evidências

- [`MOB-FEAT-046`](../../specs/features/MOB-FEAT-046-expo-sdk-57/spec.md) —
  dependências e compatibilidade do SDK;
- [`MOB-FEAT-047`](../../specs/features/MOB-FEAT-047-routes-under-src-app/spec.md)
  — raiz de rotas;
- [`MOB-FEAT-048`](../../specs/features/MOB-FEAT-048-mobile-documentation-taxonomy/spec.md)
  — taxonomia documental;
- [`MOB-DEC-005`](../../decisions/MOB-DEC-005-router-and-application-layers.md) e
  [`MOB-DEC-006`](../../decisions/MOB-DEC-006-mobile-documentation-taxonomy.md).

## Encerramento

A matriz passou no Pixel 10a emulado com Android 17/API 37, e a verificação em
Android físico foi executada e atestada por Ruan Moraes em 2026-09-06, sem
bloqueio reportado. Com isso, `MOB-FEAT-046` foi promovida para `implemented` e
o plano de migração não possui pendências abertas.
