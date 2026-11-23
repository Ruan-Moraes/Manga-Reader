# Evidência automatizada — MOB-FEAT-042

Data: 2026-08-29

## Cobertura dirigida

- `sharedUi.test.tsx`: affordance, linha horizontal, apresentação inferior,
  estrutura, agrupamento, espaçamento, divisores, altura responsiva, seleção,
  scrim, escape e back.
- Consumidores: fuso e qualidade preservam valores e callbacks; qualidade cobre
  descrições localizadas.
- Resultado dirigido: 4 suites e 37 testes aprovados.
- Regressão final dirigida: 3 suites e 29 testes aprovados para o componente e
  seus consumidores de fuso e qualidade.

## Gates

| Gate                | Resultado                     |
| ------------------- | ----------------------------- |
| testes dirigidos    | pass — 4 suites / 37 testes   |
| `pnpm typecheck`    | pass                          |
| `pnpm lint`         | pass                          |
| `pnpm lint:fsd`     | pass — 5 testes / 0 achado    |
| `pnpm format:check` | pass                          |
| `pnpm test:ci`      | pass — 84 suites / 438 testes |
