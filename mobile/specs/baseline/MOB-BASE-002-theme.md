---
id: MOB-BASE-002
type: baseline
title: Tema e tokens visuais
status: superseded
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: [MOB-FEAT-002]
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

O settings store representa a escolha como `DARK`, `LIGHT` ou `SYSTEM` dentro de um envelope local versionado no SecureStore. `SYSTEM` produz override `null`; as antigas chaves separadas de tema e idioma são migradas para o envelope.

### OBS-004 — Sincronização externa

Mudança de `initialOverride` atualiza o estado interno. `setOverride` também chama `onOverrideChange`, usado por `AppProviders` para persistir a escolha.

## Evidências

| Observação                | Código/teste/comando                                                 | Resultado esperado                            |
| ------------------------- | -------------------------------------------------------------------- | --------------------------------------------- |
| OBS-001, OBS-002, OBS-004 | `src/shared/theme/__tests__/ThemeProvider.test.tsx`                  | Sistema, override e callback verificados      |
| OBS-003                   | `src/features/manage-settings/model/__tests__/settingsStore.test.ts` | Envelope, migração e persistência verificados |
| OBS-002                   | `pnpm typecheck`                                                     | Mapas satisfazem `ThemeTokens`                |

## Desconhecidos

- Classes NativeWind `mr-*` não estão ligadas ao provider para alternância automática.

## Conflitos com intenção futura

- Nenhum; a integração futura entre NativeWind e o provider continua indefinida.

## Não garantias

- Valores visuais atuais não são congelados como identidade futura.
- O baseline não cobre fidelidade visual por screenshot.
