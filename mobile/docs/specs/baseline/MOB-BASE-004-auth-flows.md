---
id: MOB-BASE-004
type: baseline
title: Fluxos de autenticação e contrato com a Core
status: observed
created: 2026-08-08
updated: 2026-08-09
supersedes: []
superseded_by: []
---

# MOB-BASE-004 — Fluxos de autenticação e contrato com a Core

## Contexto

Fotografia das telas de login, cadastro e recuperação e do serviço que integra com a API Core. Não define autenticação como requisito futuro do fluxo principal.

## Comportamento observado

### OBS-001 — Login

Login envia e-mail trimado e senha para `POST /auth/sign-in` e inicia a sessão persistida. O `SessionGate` consome uma allowlist de `returnTo` e encaminha para o destino interno permitido ou para `/platform/status`; tabs incompletas não são expostas. Falhas são apresentadas como credenciais inválidas.

### OBS-002 — Cadastro

Cadastro exige e-mail e nome não vazios, senha com oito caracteres, confirmação idêntica e aceite dos termos. Os textos de termos e privacidade não navegam. Sucesso inicia a sessão, e o gate aplica o mesmo retorno interno seguro do login.

### OBS-003 — Recuperação

Recuperação valida formato simples de e-mail e chama `POST /auth/forgot-password`. Sucesso e qualquer exceção levam ao estado neutro “verifique seu e-mail”. Depois do cooldown, “tentar novamente” repete a chamada sem revelar se a conta existe; “voltar ao login” retorna ao formulário.

### OBS-004 — Mapeamento da resposta Core

Sign-in e sign-up esperam um envelope flat da Core e exigem identidade, tokens e role válidos antes de iniciar a sessão. `GET /auth/me` valida identidade e role sem exigir novos tokens. Tipos de usuário pertencem a `entities/user`; orquestração e contratos de request/response pertencem a `features/authenticate`.

### OBS-005 — Logout remoto tolerante a falha

Logout tenta `POST /auth/logout` com refresh token no body. Erro remoto é absorvido e a ação pública de `features/authenticate` sempre conclui a limpeza local da sessão.

### OBS-006 — Controles sem affordance falsa

Credenciais demo aparecem somente em `__DEV__`. Termos e privacidade permanecem como texto informativo do checkbox, sem estilo de link ou controle interativo enquanto não houver destino aprovado.

### OBS-007 — Toolkit visual de autenticação

A feature `authenticate` exporta header/logo, checkbox, footer, credenciais demo, ícones SVG e medidor de força. Campo e botão usam as primitivas públicas de `shared/ui`; os wrappers antigos foram removidos. O medidor pontua comprimento, dígitos, combinação de caixa, símbolo e comprimento de doze caracteres, limitado a quatro níveis traduzidos.

## Evidências

| Observação               | Código/teste/comando                                                 | Resultado esperado                                   |
| ------------------------ | -------------------------------------------------------------------- | ---------------------------------------------------- |
| OBS-001–OBS-003, OBS-006 | `src/pages/{login,register,forgot}` e `src/features/authenticate/ui` | Fluxos e controles observáveis no código             |
| OBS-004, OBS-005         | `src/features/authenticate/api/__tests__/authenticateApi.test.ts`    | Endpoints, payloads, mapper e tolerância verificados |
| OBS-004                  | `src/features/authenticate/api/authenticateApi.ts`                   | Contrato esperado pela aplicação                     |
| OBS-007                  | `src/features/authenticate/ui`; `src/shared/ui`                      | Toolkit e primitives observados                      |

## Desconhecidos

- Não há intenção aprovada para login social, newsletter, termos ou “lembrar sessão”.
- Não há fluxo mobile de reset password, apesar das traduções existentes.
- Não está definido se exceções locais inesperadas devem ser indistinguíveis de uma resposta neutra de recuperação.

## Conflitos com intenção futura

- O texto atual pressupõe conta e biblioteca remota; a direção mobile-first prevê experiência principal sem depender da plataforma completa.

## Não garantias

- Validações e fallbacks atuais não são regras futuras.
- Controles sem efeito não são features entregues.
