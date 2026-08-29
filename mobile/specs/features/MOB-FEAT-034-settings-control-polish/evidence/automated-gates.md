# Evidência automatizada — MOB-FEAT-034

Data: 2026-08-24

## Cobertura dirigida

- `sharedUi.test.tsx`: switch, cards de tema, paleta e regressão matemática do
  slider em 0, 5, 20, 95 e 100; frame externo mantém os insets 47/34 e o
  conteúdo rolável não duplica padding de safe area.
- `ReaderSettingsControls.test.tsx`: cinco fundos, patches independentes,
  saturação, stepper e switch.
- `AppearanceAccessibilityControls.test.tsx`: tema e status passivos.
- `SettingsIndex.test.tsx` e `SettingsIndexPage.test.tsx`: status opcional sem
  perda de login ou ação.

## Gates

| Gate                | Resultado                                     |
| ------------------- | --------------------------------------------- |
| testes dirigidos    | 5 suítes, 32 testes, zero falhas              |
| `pnpm specs:check`  | pass; zero drift e zero arquivo sem cobertura |
| `pnpm typecheck`    | pass                                          |
| `pnpm lint`         | pass                                          |
| `pnpm lint:fsd`     | pass; zero problemas                          |
| `pnpm format:check` | pass                                          |
| `pnpm test:ci`      | 84 suítes, 434 testes, zero falhas            |
