---
id: MOB-FEAT-061
type: feature
title: Telas de conta no padrão do kit mobile
status: in-progress
implementation_gate: open
blocked_by: [MOB-FEAT-057]
created: 2026-11-08
updated: 2026-11-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-061 — Telas de conta no padrão do kit mobile

## Objetivo

Alinhar a apresentação de Entrar, Criar conta e Esqueci a senha ao kit mobile do Toonlira Design System, com a mesma
hierarquia de texto do resto do app e sem textos fora do sistema tipográfico, mantendo exatamente os fluxos e as
regras de autenticação atuais.

## Contexto e contratos relacionados

- Muda só a apresentação de `pages/login`, `pages/register` e `pages/forgot` e, quando necessário, do toolkit visual
  de `features/authenticate`.
- Preserva integralmente MOB-BASE-004: OBS-001 a OBS-005 (requests, sessão, retorno seguro, recuperação neutra,
  logout) e OBS-006 (credenciais demo só em `__DEV__`; termos e privacidade como texto, sem link).
- **Substitui parcialmente MOB-BASE-004/OBS-007** na parte visual do cabeçalho e da tela de enviado: passam a valer os
  AC-001 a AC-004 desta spec. O medidor de força e as primitivas de campo e botão continuam como observados.
- Mantém as três telas separadas; não as funde numa tela única como o DESIGN-BRIEF propunha.
- Referência visual: `AccountScreen.jsx` (kit, versão 42).

## Requisitos e regras

### Cabeçalho das três telas

- Cabeçalho de página com eyebrow (tom de acento), título no papel `display` e texto de apoio no papel `body`, tom
  muted, reaproveitando as chaves atuais de `auth` quando existirem.
- Entrar mostra a imagem de login com altura de 152, raio `card` e borda `separator`.

### Entrar

- Campos, "Esqueci a senha" como ação do campo de senha, botão "Entrar" com carregamento e rodapé "Ainda não tem
  conta? Crie uma agora" como hoje, com o rodapé em ação textual.
- Erro de credenciais continua junto do campo, como hoje.
- Credenciais de demonstração continuam só em `__DEV__`.

### Criar conta

- Campos, medidor de força, aceite dos termos e validações como hoje.
- Erros de termos e erros gerais passam a usar `AppText` (papel `caption`, tom de perigo) com papel de alerta, sem
  `Text` cru nem tamanho solto.

### Esqueci a senha

- Formulário como hoje.
- Tela de enviado:
    - ilustração `pensando` (132), pílula "Quase lá" e título no papel `display`, sem `Text` cru;
    - texto neutro que não revela se a conta existe;
    - legenda "Link enviado para <e-mail>";
    - cartão "Próximos passos" com três itens numerados e genéricos: abrir o e-mail, tocar no link e criar a nova senha
      (sem prazos ou fatos que o app não conhece);
    - botão de reenviar com a espera atual de 30 s e a ação "Voltar ao login" em ação textual.

### i18n, tema e acessibilidade

- Textos novos (eyebrows, "Quase lá" se ainda não existir, "Link enviado para", próximos passos) em `auth` nos três
  idiomas.
- Nenhuma cor ou tamanho solto; o título da tela de enviado é anunciado como cabeçalho.

## Casos de erro

- Falha da Core no login: erro de credenciais junto do campo, como hoje.
- Falha ou sucesso na recuperação: sempre a mesma tela de enviado (OBS-003).
- Reenvio durante a espera: botão desabilitado com a contagem.

## Critérios de aceite

### AC-001 — Cabeçalho padrão

Dadas as três telas, quando renderizadas, então mostram eyebrow, título no papel `display` e texto de apoio, e Entrar
mostra a imagem de 152 com raio de cartão.

### AC-002 — Erros no sistema tipográfico

Dados erros de cadastro, quando aparecerem, então usam `AppText` no papel `caption` com tom de perigo e papel de
alerta, sem `Text` cru.

### AC-003 — Tela de enviado

Dado um pedido de recuperação, quando concluir com sucesso ou falha, então a tela de enviado mostra ilustração, pílula,
título, texto neutro, o e-mail informado, os três próximos passos e o reenvio com espera.

### AC-004 — Fluxos preservados

Dados login, cadastro, recuperação, retorno seguro e credenciais demo, quando os testes atuais rodarem, então
continuam verdes, e nenhuma request, validação ou destino muda.

### AC-005 — Sem controles sem efeito

Dadas as três telas, quando renderizadas, então não aparecem "Manter sessão ativa", inscrição em novidades nem links
de termos, porque não têm comportamento aprovado.

### AC-006 — Idiomas, tema e acessibilidade

Dados os três idiomas, claro, escuro, alto contraste, fonte a 200% e 320 pt de largura, quando as telas renderizarem,
então não há texto fixo, cor solta, corte ou ação inalcançável.

### AC-007 — Qualidade

Dadas as telas alteradas, quando os gates rodarem, então os testes de página, i18n e FSD passam e os arquivos estão
mapeados no `coverage.json`.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                            |
| -------- | ----------------------------------------------------------------------------------- |
| AC-001   | RNTL das três páginas (papéis tipográficos, imagem)                                 |
| AC-002   | RNTL de erros do cadastro                                                           |
| AC-003   | RNTL da tela de enviado (sucesso e falha; espera)                                   |
| AC-004   | Testes existentes de `features/authenticate` e páginas de auth verdes               |
| AC-005   | RNTL que confirma ausência dos controles                                            |
| AC-006   | Teste de chaves nos três locales; RNTL com `fontScale` 2; capturas no iOS Simulator |
| AC-007   | `pnpm lint:fsd`, `pnpm typecheck`, testes e `coverage.json`                         |

## Gate de implementação

- Estado: `open`
- Dependências: MOB-FEAT-057 (`verification-pending`, primitivas executadas).

## Fora de escopo

- "Manter sessão ativa", inscrição em novidades e prazo de expiração do link (sem comportamento nem contrato de API).
- Fundir as telas, login social ou qualquer mudança em `features/authenticate/model` e na API.

## Decisões registradas na aprovação

As propostas abaixo foram aceitas como redigidas.

- **D6 — controles sem contrato.** Proposta: deixar "Manter sessão ativa", novidades e o prazo do link fora. As chaves
  `auth.rememberSession` e `auth.newsletterOptIn` existem nos locales sem uso; esta spec não as remove.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-08
- Evidência: resposta “Aprovo as cinco” à apresentação das Target Specs 058–062, aceitando as propostas dos pontos em aberto como redigidas.

Não criar `tasks.md` antes de status `approved` e aprovação preenchida.
