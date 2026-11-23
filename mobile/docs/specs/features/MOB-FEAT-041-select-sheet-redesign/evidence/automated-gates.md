# Evidência automatizada — MOB-FEAT-041

Data: 2026-08-27

## Cobertura dirigida

- `sharedUi.test.tsx`: testa limites por viewport e quantidade de opções em 844,
  1000, 320 e entrada inválida; estrutura fixa/rolável; linhas de 64, divisores,
  check único de 28; semântica, seleção e fechamento.
- Consumidores de fuso horário e qualidade preservam callbacks e valores.

## Gates

| Gate                | Resultado                          |
| ------------------- | ---------------------------------- |
| testes dirigidos    | 1 suíte, 25 testes, zero falhas    |
| `pnpm typecheck`    | pass                               |
| `pnpm lint`         | pass                               |
| `pnpm lint:fsd`     | pass; zero problemas               |
| `pnpm format:check` | pass                               |
| `pnpm test:ci`      | 84 suítes, 438 testes, zero falhas |
