# Evidência automatizada — MOB-FEAT-037

Data: 2026-08-26

## Cobertura dirigida

- `sharedUi.test.tsx`: ausência de posição absoluta, coluna flexível de copy,
  switch sem shrink, alternância pela linha e empilhamento em font scale 200%.
- `AppearanceAccessibilityControls.test.tsx`: animações, movimento reduzido e
  alto contraste preservam persistência e semântica.
- `ReaderSettingsControls.test.tsx`: marcação automática preserva o patch.
- `PrivacyControlsPanel.test.tsx`: analytics preserva seleção e restrições.

## Gates

| Gate                | Resultado                          |
| ------------------- | ---------------------------------- |
| testes dirigidos    | 4 suítes, 36 testes, zero falhas   |
| `pnpm typecheck`    | pass                               |
| `pnpm lint`         | pass                               |
| `pnpm lint:fsd`     | pass; zero problemas               |
| `pnpm format:check` | pass                               |
| `pnpm test:ci`      | 84 suítes, 436 testes, zero falhas |
