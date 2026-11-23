# Evidência automatizada — MOB-FEAT-035

Data: 2026-08-24

## Cobertura dirigida

- `sharedUi.test.tsx`: largura e hierarquia do campo, propriedades
  multiplataforma do `Modal`, sheet, descrições, rádio selecionado, scrim e
  `onRequestClose` sem alteração de valor.
- Consumidores mantêm a API existente e foram exercitados pela suíte completa.

## Gates

| Gate                | Resultado                          |
| ------------------- | ---------------------------------- |
| teste dirigido      | 1 suíte, 22 testes, zero falhas    |
| `pnpm typecheck`    | pass                               |
| `pnpm lint`         | pass                               |
| `pnpm lint:fsd`     | pass; zero problemas               |
| `pnpm format:check` | pass                               |
| `pnpm test:ci`      | 84 suítes, 435 testes, zero falhas |
