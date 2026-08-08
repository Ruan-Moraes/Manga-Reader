---
id: MOB-BASE-002
type: baseline
title: Tema e tokens visuais
status: observed
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: []
---

# MOB-BASE-002 — Tema e tokens visuais

## Contexto

Fotografia do mecanismo de tema claro/escuro e da persistência do override.

## Comportamento observado

### OBS-001 — Seleção do esquema

Sem override, o provider escolhe dark somente quando `useColorScheme()` retorna `dark`; os demais valores usam light. Um override `dark` ou `light` tem precedência.

### OBS-002 — Tokens por esquema

O provider expõe `tokens`, `colorScheme`, `override` e `setOverride`. Os mapas `darkTokens` e `lightTokens` implementam a mesma interface de cores e métricas.

### OBS-003 — Persistência do override

`settingsStore` persiste `dark` ou `light` no SecureStore. `null` remove a chave e volta a seguir o sistema.

### OBS-004 — Sincronização externa

Mudança de `initialOverride` atualiza o estado interno. `setOverride` também chama `onOverrideChange`, usado por `AppProviders` para persistir a escolha.

## Evidências

| Observação                | Código/teste/comando                                | Resultado esperado                       |
| ------------------------- | --------------------------------------------------- | ---------------------------------------- |
| OBS-001, OBS-002, OBS-004 | `src/shared/theme/__tests__/ThemeProvider.test.tsx` | Sistema, override e callback verificados |
| OBS-003                   | `src/shared/store/__tests__/settingsStore.test.ts`  | Set/delete no SecureStore verificados    |
| OBS-002                   | `pnpm typecheck`                                    | Mapas satisfazem `ThemeTokens`           |

## Desconhecidos

- Classes NativeWind `mr-*` não estão ligadas ao provider para alternância automática.

## Conflitos com intenção futura

- Nenhum; a integração futura entre NativeWind e o provider continua indefinida.

## Não garantias

- Valores visuais atuais não são congelados como identidade futura.
- O baseline não cobre fidelidade visual por screenshot.
