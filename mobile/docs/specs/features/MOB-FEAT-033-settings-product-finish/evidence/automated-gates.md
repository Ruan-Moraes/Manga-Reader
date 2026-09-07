# Evidência automatizada — MOB-FEAT-033

Data: 2026-08-24

## Cobertura dirigida

- `sharedUi.test.tsx`: seções, cards, segmentos, swatches, foco, seleção,
  loading, disabled, linhas informativas e reflow com font scale de 200%.
- `AppearanceAccessibilityControls.test.tsx`: tema, tamanho, densidade e switches.
- `ReaderSettingsControls.test.tsx`: modo, direção, ajuste, fundo, slider,
  stepper, switch e preview.
- `DataControlsPanel.test.tsx`: disponibilidade, confirmação, loading e ações.
- `SettingsAboutPage.test.tsx`: metadados, descrições, links e retry.

## Gates finais

| Gate                | Resultado                          |
| ------------------- | ---------------------------------- |
| testes dirigidos    | 5 suítes, 34 testes, zero falhas   |
| `pnpm typecheck`    | pass                               |
| `pnpm lint`         | pass                               |
| `pnpm lint:fsd`     | pass; zero problemas               |
| `pnpm format:check` | pass                               |
| `pnpm test:ci`      | 84 suítes, 431 testes, zero falhas |

Os avisos assíncronos de carregamento de fonte dos Ionicons permanecem ruído
conhecido do renderer de testes e não correspondem a falhas ou warnings do app.
