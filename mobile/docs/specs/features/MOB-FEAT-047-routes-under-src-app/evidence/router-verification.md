# Evidência — rotas sob `src/app`

- Data: 2026-09-05
- Ambiente: Expo Go 57.0.9, iPhone 17, iOS 26.5.

## Descoberta e runtime

- O CLI registrou `Using src/app as the root directory for Expo Router` tanto no
  Metro quanto no export.
- `expo export --platform ios` gerou o bundle Hermes com 2.217 módulos.
- No simulador, a home abriu e navegou para o draft local de tradução e para o
  índice de configurações; o retorno à home preservou o histórico.
- Nenhuma tela vermelha, rota ausente ou erro fatal foi observado.

## Ferramentas e fronteiras

- TypeScript e ESLint passaram com `@/` resolvendo a partir de `src/`.
- Steiger, o validador FSD e seus seis testes passaram com `src/app` reconhecida
  como casca superior.
- Jest ignora somente a raiz de rotas e manteve as integrações da app layer em
  `src/application`.
- O diretório raiz antigo `mobile/app` não existe mais.
