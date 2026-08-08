---
id: MOB-BASE-001
type: baseline
title: Fundação e bootstrap do aplicativo
status: observed
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: []
---

# MOB-BASE-001 — Fundação e bootstrap do aplicativo

## Contexto

Fotografia da inicialização global, providers, hidratação de settings, fontes, splash, Query e boundaries estruturais existentes em 2026-08-08.

## Comportamento observado

### OBS-001 — Ordem de inicialização

O root importa CSS, i18n e Reanimated, mantém a splash aberta e compõe `SettingsGate → AppProviders → SessionGate → RootNavigator`.

### OBS-002 — Gate de settings e fontes

O `SettingsGate` carrega cinco variantes Nunito Sans e hidrata configurações persistidas. Ele não renderiza filhos nem esconde a splash até fontes e settings estarem prontos; erro de fonte é relançado.

### OBS-003 — Providers globais

`AppProviders` conecta o override persistido ao `ThemeProvider`, envolve a árvore em `SafeAreaProvider` e instala um `QueryClientProvider`.

### OBS-004 — Defaults de server state

O Query Client global usa uma tentativa de retry e stale time de cinco minutos para queries.

### OBS-005 — Boundaries atualmente verificados

Rotas em `app/` são cascas finas para pages. Slices de pages e feature auth expõem barrels. ESLint restringe deep imports e caminhos legados; Steiger analisa `src/`, mas ignora `src/application/**` e testes.

### OBS-006 — Metadados e integrações Expo

O aplicativo declara orientação portrait, esquema `mobile`, estilo de interface automático, suporte a tablet no iOS, ícones adaptativos no Android, typed routes e os plugins Router, Splash Screen, Font, SecureStore e WebBrowser. O gesto preditivo de voltar do Android está desabilitado.

### OBS-007 — Plataforma web

O alvo web usa Metro com saída estática e favicon próprio. O root HTML define `lang="en"`, metadados básicos, reset de scroll e fundo branco ou preto conforme `prefers-color-scheme`.

### OBS-008 — Configuração de build e resolução

Babel usa o preset Expo, Metro integra NativeWind pelo `global.css`, TypeScript resolve o alias `@/*`, e Expo/NativeWind fornecem as declarações de ambiente consumidas pelo projeto.

## Evidências

| Observação | Código/teste/comando                                  | Resultado esperado                             |
| ---------- | ----------------------------------------------------- | ---------------------------------------------- |
| OBS-001    | `app/_layout.tsx`                                     | Ordem de gates e navigator observável no JSX   |
| OBS-002    | `src/application/gates/SettingsGate.tsx`              | Render bloqueado até hidratação/fontes         |
| OBS-003    | `src/application/providers/AppProviders.tsx`          | Tema, safe area e Query compostos              |
| OBS-004    | `src/application/providers/QueryProvider.tsx`         | `retry: 1`, `staleTime: 300000`                |
| OBS-005    | `pnpm lint` e `pnpm lint:fsd`                         | Imports e estrutura aceitos pelos gates atuais |
| OBS-006    | `app.json`                                            | Metadados, plugins e flags de plataforma       |
| OBS-007    | `app/+html.tsx`; `app.json`                           | Shell HTML e build web estático                |
| OBS-008    | `babel.config.js`; `metro.config.js`; `tsconfig.json` | Presets, CSS e alias observados                |

## Desconhecidos

- Não há evidência automatizada de comportamento da splash em dispositivo real.
- A camada `application` é uma convenção local fora das camadas canônicas inspecionadas pelo Steiger.
- O atributo `lang` do shell web é fixo e não acompanha o idioma ativo do i18n.

## Conflitos com intenção futura

- Nenhum conflito de produto foi resolvido neste baseline.

## Não garantias

- Este baseline não exige que futuras features usem o Query Client.
- O ignore de `application` registra o gate atual; não declara essa exceção como arquitetura ideal permanente.
