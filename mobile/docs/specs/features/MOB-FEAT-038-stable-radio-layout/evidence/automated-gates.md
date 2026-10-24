# Evidência automatizada — MOB-FEAT-038

Data: 2026-08-26

## Cobertura dirigida

- `sharedUi.test.tsx`: compara borda selecionada/não selecionada em cards,
  grupo simples, segmentos e opções do select; verifica alinhamento, shrink e
  copy flexível.
- Testes de Aparência, Região, Leitor e Privacidade preservam callbacks,
  valores e persistência dos consumidores.

## Gates

| Gate                | Resultado                          |
| ------------------- | ---------------------------------- |
| testes dirigidos    | 5 suítes, 39 testes, zero falhas   |
| `pnpm typecheck`    | pass                               |
| `pnpm lint`         | pass                               |
| `pnpm lint:fsd`     | pass; zero problemas               |
| `pnpm format:check` | pass                               |
| `pnpm test:ci`      | 84 suítes, 437 testes, zero falhas |
