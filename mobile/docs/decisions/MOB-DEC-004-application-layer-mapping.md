---
id: MOB-DEC-004
type: decision
title: Mapeamento local da app layer para src/application
status: superseded
created: 2026-08-09
updated: 2026-09-05
supersedes: []
superseded_by: [MOB-DEC-005]
---

# MOB-DEC-004 — Mapeamento local da app layer para src/application

## Contexto

Expo Router reserva `mobile/app/` para arquivos de rota. Usar simultaneamente `src/app` como camada FSD cria nomenclatura ambígua e já havia levado providers e gates globais para um widget, enquanto uma page importava a composição superior.

## Decisão

Mapear a app layer FSD para `src/application`. Ela contém somente bootstrap, providers, gates de conta/sessão/settings e navegação raiz. `mobile/app/` permanece composto por cascas de rota Expo Router e `app/_layout.tsx` importa exclusivamente a API pública de `src/application`.

O Steiger continua validando as camadas canônicas. Um validador local obrigatório inclui `src/application`, fluxo descendente, imports horizontais, cross-references explícitas de entities e uso de APIs públicas. Rotas e parsers seguros permanecem em `shared/navigation` por serem um contrato técnico sem lógica de domínio.

## Alternativas consideradas

- Criar `src/app`: rejeitado pela colisão conceitual e operacional com o diretório de rotas Expo.
- Manter providers em `widgets/application-shell`: rejeitado porque inicialização global é responsabilidade da app layer.
- Colocar composição em `pages/root`: rejeitado porque pages não podem importar a camada superior.

## Consequências

- `widgets/application-shell` e `pages/root` são removidos.
- Providers, gates, `RootNavigator` e `RootApplication` passam a ter uma fronteira única e auditável.
- `src/application` não autoriza lógica de domínio; ações continuam em features e estado de domínio em entities.

## Relações

- Rege `src/application`, `app/_layout.tsx`, `steiger.config.ts` e `scripts/validate-fsd.mjs`.
- Decisão aceita por autorização humana explícita em 2026-08-09.
- Superseded por `MOB-DEC-005` após o Expo Router passar a suportar a raiz
  `src/app`; a separação de responsabilidades de `src/application` foi mantida.
