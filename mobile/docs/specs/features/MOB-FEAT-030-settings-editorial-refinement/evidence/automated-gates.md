# Evidência automatizada — MOB-FEAT-030

Data: 2026-08-22

## Cobertura dirigida

- `SettingsIndexPage.test.tsx`: hierarquia editorial, grupos e regressão de rotas.
- `SettingsNavigation.integration.test.tsx`: manifesto, acesso e destinos reais.
- `SettingsIndex.test.tsx`: ícones, status de apoio e estado de login.
- `sharedUi.test.tsx`: linha de apoio, semântica e alvos compartilhados.
- `ThemeProvider.test.tsx`: escala nativa conjunta de fonte e altura de linha.

O comando dirigido passou com 5 suítes e 24 testes. A regressão completa passou
com 83 suítes e 418 testes, sem falhas.

## Gates executados

`pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm format:check` e
`pnpm test:ci` passaram. O gate SDD final é registrado no review após a
reconciliação de coverage, status e checksums.
