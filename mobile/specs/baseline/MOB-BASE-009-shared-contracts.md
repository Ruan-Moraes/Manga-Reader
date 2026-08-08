---
id: MOB-BASE-009
type: baseline
title: Contratos, constantes e hooks compartilhados
status: observed
created: 2026-08-08
updated: 2026-08-08
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

`ROUTES` enumera o grupo tabs, Home, Library, Forum, Profile e as rotas Login, Register e Forgot atualmente existentes.

### OBS-003 — Query keys

`QUERY_KEYS` exporta strings para titles, title, chapters, chapter, user, comments, review, library e notifications. A presença dessas chaves não demonstra queries nem features correspondentes.

### OBS-004 — Credenciais demo

`DEMO_CREDS` contém o e-mail e a senha seedados pelo backend não produtivo e é consumido apenas pela apresentação demo condicionada a `__DEV__`.

### OBS-005 — Envelope e paginação

`ApiResponse<T>` modela data, success, message e statusCode. `PageResponse<T>` modela content, page, size, totais e flag last; o contrato paginado não possui consumidor atual no mobile.

### OBS-006 — Modelos de autenticação

Os tipos compartilhados modelam requests de login/cadastro, tokens, usuário, roles MEMBER/ADMIN/MODERATOR, resposta flat da Core e snapshot da sessão. Campos nullable da resposta são convertidos pela feature auth antes de entrar no estado local.

### OBS-007 — Barrels compartilhados

Os barrels de constant, hook e model reexportam somente os símbolos declarados nos respectivos segmentos.

## Evidências

| Observação       | Código/teste/comando                            | Resultado esperado                                   |
| ---------------- | ----------------------------------------------- | ---------------------------------------------------- |
| OBS-001          | `src/shared/hook/__tests__/useDebounce.test.ts` | Delay, cancelamento e valor mais recente verificados |
| OBS-002–OBS-004  | `src/shared/constant`                           | Valores e consumidores correspondem ao inventário    |
| OBS-005, OBS-006 | `src/shared/model`; `pnpm typecheck`            | Contratos aceitos pelos consumidores atuais          |
| OBS-007          | `src/shared/{constant,hook,model}/index.ts`     | Exports explícitos observados                        |

## Desconhecidos

- Não há convenção aprovada para factories de query keys futuras.
- O contrato `PageResponse` ainda não foi exercitado contra um endpoint mobile.

## Conflitos com intenção futura

- Constantes planejadas não são roadmap nem critérios de aceite.

## Não garantias

- Símbolos sem consumidor não prometem implementação futura.
- Os contratos podem ser substituídos por uma Target Spec aprovada quando integrações reais forem criadas.
