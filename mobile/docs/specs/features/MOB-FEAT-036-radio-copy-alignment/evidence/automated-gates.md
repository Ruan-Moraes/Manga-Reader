# Evidência automatizada — MOB-FEAT-036

Data: 2026-08-26

## Cobertura dirigida

- `sharedUi.test.tsx`: linha horizontal, indicador fixo, bloco flexível,
  alinhamento dos cards pela linha do título, seleção semântica e empilhamento
  entre opções em font scale de 200%.
- `TranslationLanguageSelectionPanel.test.tsx`: consumidores reais preservam
  seleção de origem/destino e contratos existentes.
- `AppearanceAccessibilityControls.test.tsx` e
  `ReaderSettingsControls.test.tsx`: rádios reais das configurações preservam
  seleção e persistência/patches.

## Gates

| Gate                | Resultado                          |
| ------------------- | ---------------------------------- |
| testes dirigidos    | 3 suítes, 31 testes, zero falhas   |
| `pnpm typecheck`    | pass                               |
| `pnpm lint`         | pass                               |
| `pnpm lint:fsd`     | pass; zero problemas               |
| `pnpm format:check` | pass                               |
| `pnpm test:ci`      | 84 suítes, 435 testes, zero falhas |
