---
id: MOB-DEC-006
type: decision
title: Taxonomia única para documentação mobile
status: accepted
created: 2026-09-05
updated: 2026-09-05
supersedes: []
superseded_by: []
---

# MOB-DEC-006 — Taxonomia única para documentação mobile

## Contexto

Specs, relatórios e planos mobile estão espalhados entre a raiz do módulo,
`mobile/specs` e `mobile/docs`, tornando ambígua a fonte de verdade e frágeis os
links relativos.

## Decisão

Adotar `mobile/docs` como raiz documental: `specs/` para contratos SDD,
`decisions/` para ADRs, `plans/` para execução ativa, `references/` para material
informativo, `active/` para relatórios transitórios e `legacy/` para histórico.
O índice `mobile/docs/README.md` documenta autoridade e ciclo de vida.

`mobile/README.md` e `mobile/AGENTS.md` permanecem na raiz por serem pontos de
entrada operacionais. Movimentos preservam conteúdo; exclusões exigem aprovação
humana individual.

## Alternativas consideradas

- Manter a distribuição atual: rejeitada pela ambiguidade e links quebrados.
- Colocar tudo em `specs/`: rejeitada porque planos e referências não são
  contratos normativos.

## Consequências

- Scripts SDD e referências precisarão de atualização coordenada.
- A árvore passa a comunicar status e autoridade sem duplicar conteúdo.
- O histórico continuará disponível mesmo quando deixar de ser normativo.

## Relações

- Rege `MOB-FEAT-048`, `mobile/docs`, scripts SDD e links do README mobile.
