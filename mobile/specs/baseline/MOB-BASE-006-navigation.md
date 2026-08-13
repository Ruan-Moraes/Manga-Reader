---
id: MOB-BASE-006
type: baseline
title: Navegação e controle de acesso
status: observed
created: 2026-08-08
updated: 2026-08-09
supersedes: []
superseded_by: []
---

# MOB-BASE-006 — Navegação e controle de acesso

## Contexto

Fotografia das rotas Expo Router, stacks/tabs e redirects executados pelo SessionGate.

## Comportamento observado

### OBS-001 — Root e rota inicial

O root declara `index` como rota inicial pública e monta stack com launcher, auth, plataforma, reader, settings e not-found, sem headers globais.

### OBS-002 — Grupo de autenticação

O grupo auth contém login, register e forgot em stack. A transição lateral é usada quando animações decorativas estão efetivamente habilitadas; com movimento reduzido ou animações desativadas, não há transição.

### OBS-003 — Tabs

As tabs Home, Library, Forum e Profile foram preservadas sob `platform/(tabs)`, com labels i18n e ícones, mas o gate as substitui por `/platform/status`. Seus placeholders não são expostos pela experiência atual.

### OBS-004 — Redirect de visitante

Depois da hidratação, guest permanece no launcher, tradução offline e settings locais. Rotas privadas são substituídas por login; plataforma preserva o destino interno `/platform/status`.

### OBS-005 — Redirect de autenticado

Depois da hidratação, usuário autenticado dentro do grupo auth consome uma vez um `returnTo` permitido ou segue para `/platform/status`. Destinos externos são rejeitados e tabs placeholders também redirecionam para o status.

### OBS-006 — Bloqueio durante hidratação

SettingsGate, ThemeProvider, SessionGate e boundaries de conta mantêm splash ou feedback de progresso localizado durante hidratação; não retornam um frame vazio observável.

## Evidências

| Observação      | Código/teste/comando                                                 | Resultado esperado                        |
| --------------- | -------------------------------------------------------------------- | ----------------------------------------- |
| OBS-001–OBS-003 | `app/`; `src/application/navigation/RootNavigator.tsx`; teste focado | Árvore, aparência e transições observadas |
| OBS-004–OBS-006 | `src/application/gates/__tests__/SessionGate.test.tsx`               | Redirects e bloqueio verificados          |

## Desconhecidos

- Deep links de domínios futuros além das allowlists atuais não possuem comportamento especificado.

## Conflitos com intenção futura

- O conflito anterior de login obrigatório foi resolvido por `MOB-FEAT-010`; leitura e dados privados continuam autenticados.

## Não garantias

- Rotas placeholders não prometem conteúdo futuro.
- A ordem e composição atual das tabs não são Target Spec.
