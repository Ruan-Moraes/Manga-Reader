---
id: MOB-BASE-004
type: baseline
title: Fluxos de autenticação e contrato com a Core
status: observed
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: []
---

# MOB-BASE-004 — Fluxos de autenticação e contrato com a Core

## Contexto

Fotografia das telas de login, cadastro e recuperação e do serviço que integra com a API Core. Não define autenticação como requisito futuro do fluxo principal.

## Comportamento observado

### OBS-001 — Login

Login envia e-mail trimado e senha para `POST /auth/sign-in`, persiste usuário/tokens e navega para tabs. Falhas são apresentadas como credenciais inválidas. O checkbox “manter sessão” não altera o armazenamento.

### OBS-002 — Cadastro

Cadastro exige e-mail e nome não vazios, senha com oito caracteres e aceite dos termos. Confirmação só falha quando preenchida e diferente; newsletter e textos de termos não são enviados/navegados. Sucesso autentica e abre tabs.

### OBS-003 — Recuperação

Recuperação valida formato simples de e-mail e chama `POST /auth/forgot-password`. Sucesso e qualquer exceção levam ao estado neutro “verifique seu e-mail”. A ação visual de tentar novamente apenas reinicia cooldown; o texto “voltar ao login” na tela enviada retorna ao formulário e então permite nova chamada.

### OBS-004 — Mapeamento da resposta Core

Sign-in e sign-up esperam `ApiResponse<AuthResponse>` flat e mapeiam campos de usuário/tokens, usando strings vazias e role `MEMBER` como fallback. `GET /auth/me` usa o mesmo mapper.

### OBS-005 — Logout remoto tolerante a falha

Logout tenta `POST /auth/logout` com refresh token no body. Erro remoto é absorvido para permitir a saída local pelo chamador.

### OBS-006 — Controles incompletos visíveis

Botões Google/Apple são renderizados sem handler. Credenciais demo aparecem somente em `__DEV__`.

### OBS-007 — Toolkit visual de autenticação

A feature exporta header/logo, campos, checkbox, footer, botões primário e ghost, linha social, credenciais demo, ícones SVG e medidor de força. Esses componentes consomem tokens e fontes; o medidor pontua comprimento, dígitos, combinação de caixa, símbolo e comprimento de doze caracteres, limitado a quatro níveis traduzidos.

## Evidências

| Observação               | Código/teste/comando                                         | Resultado esperado                                   |
| ------------------------ | ------------------------------------------------------------ | ---------------------------------------------------- |
| OBS-001–OBS-003, OBS-006 | `src/pages/{login,register,forgot}` e `src/features/auth/ui` | Fluxos e controles observáveis no código             |
| OBS-004, OBS-005         | `src/features/auth/model/__tests__/authService.test.ts`      | Endpoints, payloads, mapper e tolerância verificados |
| OBS-004                  | `src/features/auth/model/authService.ts`                     | Contrato esperado pela aplicação                     |
| OBS-007                  | `src/features/auth/ui`                                       | Toolkit e branches visuais observados                |

## Desconhecidos

- Não há intenção aprovada para login social, newsletter, termos ou “lembrar sessão”.
- Não há fluxo mobile de reset password, apesar das traduções existentes.
- Não está definido se exceções locais inesperadas devem ser indistinguíveis de uma resposta neutra de recuperação.

## Conflitos com intenção futura

- O texto atual pressupõe conta e biblioteca remota; a direção mobile-first prevê experiência principal sem depender da plataforma completa.

## Não garantias

- Validações e fallbacks atuais não são regras futuras.
- Controles sem efeito não são features entregues.
