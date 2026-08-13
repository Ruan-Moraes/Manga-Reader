---
id: MOB-BASE-009
type: baseline
title: Contratos, constantes e hooks compartilhados
status: observed
created: 2026-08-08
updated: 2026-08-09
supersedes: []
superseded_by: []
---

# MOB-BASE-009 — Contratos, constantes e hooks compartilhados

## Contexto

Fotografia dos utilitários e tipos compartilhados, inclusive exports planejados ainda sem consumidor de runtime.

## Comportamento observado

### OBS-001 — Debounce

`useDebounce` retorna inicialmente o valor recebido e publica a versão mais recente após o delay, 300 ms por padrão. Mudança de valor ou delay cancela o timer anterior; unmount também cancela o timer.

### OBS-002 — Rotas constantes

`shared/navigation` expõe launcher, tradução offline, plataforma/status/tabs, settings e autenticação, além das allowlists e parsers que aceitam somente retornos internos conhecidos.

### OBS-003 — Query keys proprietárias

Não existe registry global. `entities/chapter` e `entities/reading-progress` expõem factories para seus próprios dados; `features/data-controls`, `manage-content-languages` e `update-privacy` mantêm internamente os scopes que invalidam.

### OBS-004 — Credenciais demo

`DEMO_CREDS` pertence à configuração interna de `features/authenticate` e é consumido apenas pela apresentação demo condicionada a `__DEV__`.

### OBS-005 — Envelope e paginação

`ApiResponse<T>` modela data, success, message e statusCode. `PageResponse<T>` modela content, page, size, totais e flag last; o contrato paginado não possui consumidor atual no mobile.

### OBS-006 — Separação dos modelos de autenticação

`User` e `UserRole` pertencem a `entities/user`; tokens e snapshot pertencem a `entities/session`; requests e resposta flat permanecem internos a `features/authenticate`. `shared/model` conserva apenas envelopes HTTP genéricos.

### OBS-007 — Barrels compartilhados

Os barrels de `navigation`, `hook` e `model` reexportam somente os símbolos declarados nos respectivos segmentos.

## Evidências

| Observação       | Código/teste/comando                                    | Resultado esperado                                   |
| ---------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| OBS-001          | `src/shared/hook/__tests__/useDebounce.test.ts`         | Delay, cancelamento e valor mais recente verificados |
| OBS-002          | `src/shared/navigation`; consumidores de rotas          | Allowlist e parsers correspondem às rotas atuais     |
| OBS-003          | factories/scopes em entities e features proprietárias   | Não há registry global                               |
| OBS-004          | `src/features/authenticate/config/demoCredentials.ts`   | Uso restrito à feature                               |
| OBS-005, OBS-006 | `src/shared/model`; `src/entities/{user,session}`; auth | Contratos aceitos pelos consumidores atuais          |
| OBS-007          | barrels públicos dos segmentos relacionados             | Exports explícitos observados                        |

## Desconhecidos

- Novas query keys devem permanecer no slice proprietário; convenções adicionais dependem de uso real.
- O contrato `PageResponse` ainda não foi exercitado contra um endpoint mobile.

## Conflitos com intenção futura

- Constantes planejadas não são roadmap nem critérios de aceite.

## Não garantias

- Símbolos sem consumidor não prometem implementação futura.
- Os contratos podem ser substituídos por uma Target Spec aprovada quando integrações reais forem criadas.
