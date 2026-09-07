# Evidência — taxonomia documental mobile

- Data: 2026-09-05

## Estrutura e preservação

- `docs/README.md` define autoridade e aponta para specs, decisões, relatórios
  ativos, planos, referências e legado.
- Nove baselines, 42 Target Specs, seis decisões e documentos informativos foram
  movidos sem exclusão de conteúdo.
- `mobile/README.md` e `mobile/AGENTS.md` permanecem como pontos de entrada.

## Validação

- O validador SDD usa `docs/specs`, `docs/decisions` e o relatório em
  `docs/active`.
- `coverage.json` classifica cada grupo da taxonomia e mantém entradas exatas
  para evidências.
- `scripts/checks/check-doc-links.mjs` verifica links relativos de todos os Markdown do
  módulo e integra `pnpm specs:check`.
