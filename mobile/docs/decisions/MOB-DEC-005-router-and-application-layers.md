---
id: MOB-DEC-005
type: decision
title: Separação entre rotas Expo e app layer lógica
status: accepted
created: 2026-09-05
updated: 2026-09-05
supersedes: [MOB-DEC-004]
superseded_by: []
---

# MOB-DEC-005 — Separação entre rotas Expo e app layer lógica

## Contexto

O Expo Router do SDK 57 reconhece `src/app` como raiz de rotas. A decisão anterior
evitava esse caminho para não colidir conceitualmente com a app layer FSD, mas
mantê-lo fora de `src` piora aliases, cobertura e navegação da árvore.

## Decisão

Usar `src/app` exclusivamente como diretório físico de cascas de rota do Expo
Router e manter `src/application` como app layer lógica local. A equivalência FSD
é explícita: ambos estão no nível superior, porém `src/app` só declara rotas e
delega composição a `src/application` ou `src/pages` por suas APIs públicas.

O alias `@/` passa a apontar para `src/`. Validadores devem distinguir a camada
física de rotas da camada lógica e proibir lógica de domínio em ambas.

## Alternativas consideradas

- Manter `mobile/app`: rejeitada porque conserva uma segunda raiz de código.
- Renomear `src/application` para `src/app`: rejeitada porque misturaria providers,
  gates e composição global com a convenção baseada em arquivos do Router.

## Consequências

- `MOB-DEC-004` é superseded apenas quanto à localização das rotas; sua regra de
  responsabilidade da app layer é preservada.
- Configurações, testes, coverage e documentação precisam adotar `src/app`.
- A separação incomum fica protegida por validação automatizada.

## Relações

- Rege `MOB-FEAT-047`, `src/app`, `src/application`, `tsconfig.json`, Jest e os
  validadores FSD/SDD.
