---
id: MOB-BASE-006
type: baseline
title: Navegação e controle de acesso
status: observed
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: []
---

# MOB-BASE-006 — Navegação e controle de acesso

## Contexto

Fotografia das rotas Expo Router, stacks/tabs e redirects executados pelo SessionGate.

## Comportamento observado

### OBS-001 — Root e rota inicial

O root declara `(tabs)` como rota inicial e monta stack com grupos tabs/auth e not-found, sem headers.

### OBS-002 — Grupo de autenticação

O grupo auth contém login, register e forgot em stack com transição lateral.

### OBS-003 — Tabs

O grupo autenticado expõe Home, Library, Forum e Profile, com labels i18n e ícones. As três primeiras telas são placeholders; Profile oferece dados de usuário quando presentes e logout.

### OBS-004 — Redirect de visitante

Depois da hidratação, usuário sem sessão fora do grupo auth é substituído por `/(auth)/login`.

### OBS-005 — Redirect de autenticado

Depois da hidratação, usuário autenticado dentro do grupo auth é substituído por `/(tabs)`.

### OBS-006 — Bloqueio durante hidratação

O SessionGate retorna `null` até a hidratação de tokens concluir.

## Evidências

| Observação      | Código/teste/comando                                    | Resultado esperado               |
| --------------- | ------------------------------------------------------- | -------------------------------- |
| OBS-001–OBS-003 | `app/` e `src/application/navigation/RootNavigator.tsx` | Árvore de rotas observada        |
| OBS-004–OBS-006 | `src/application/gates/__tests__/SessionGate.test.tsx`  | Redirects e bloqueio verificados |

## Desconhecidos

- Deep links, recuperação de estado e navegação offline não possuem comportamento especificado.

## Conflitos com intenção futura

- O redirect obrigatório para login conflita com a direção futura de fluxo principal sem autenticação obrigatória.

## Não garantias

- Rotas placeholders não prometem conteúdo futuro.
- A ordem e composição atual das tabs não são Target Spec.
