---
id: MOB-FEAT-009
type: feature
title: Autoridade local das preferências do aparelho
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-001, MOB-FEAT-002, MOB-FEAT-003, MOB-FEAT-007, MOB-FEAT-008]
created: 2026-08-09
updated: 2026-08-09
supersedes: []
superseded_by: []
---

# MOB-FEAT-009 — Autoridade local das preferências do aparelho

## Objetivo

Tornar as preferências do aparelho disponíveis e duráveis sem autenticação, conciliando-as com a conta por campo alterado, sem perder edições locais nem sobrescrever dados remotos não relacionados.

## Contexto e contratos relacionados

- Substitui parcialmente a precedência integral da Core descrita em `MOB-FEAT-001/AC-004`; o contrato HTTP integral permanece inalterado, mas somente campos locais explicitamente alterados prevalecem no merge.
- Reutiliza os modelos e controles implementados por `MOB-FEAT-002`, `MOB-FEAT-003`, `MOB-FEAT-005`, `MOB-FEAT-007` e `MOB-FEAT-008`.
- Interface language é local ao aparelho e continua fora do payload da Core.

## Requisitos e regras

- O envelope local deve ter versão 2, migrar dados v1 e guardar preferências do aparelho, idioma da interface, revisão monotônica e paths de campos alterados.
- Defaults de uma instalação nova não são alterações locais e não podem sobrescrever preferências de conta.
- Toda edição confirmada na UI deve atualizar o aparelho, persistir e marcar somente os campos efetivamente modificados; os valores disponíveis permanecem os contratos atuais, inclusive densidade `COMPACT | COMFORTABLE`.
- Ao autenticar, o cliente deve buscar a Core, sobrepor somente dirty paths suportados e enviar o contrato integral mesclado apenas quando houver diferença pendente.
- Confirmação remota limpa somente os dirty paths daquela revisão; resposta obsoleta, troca de identidade ou edição concorrente não pode apagar pendências novas.
- Erro conserva projeção local, dirty paths e retry. Repetição sem pendência não envia PATCH.
- Logout remove projeções privadas e restaura as preferências do aparelho, preservando sessão e dados não relacionados conforme seus contratos proprietários.
- Limpeza de cache não remove preferências ou sessão. Limpeza offline só é oferecida quando um participante real de armazenamento reportar dados.

## Casos de erro

- Envelope futuro desconhecido, timeout ou falha de persistência deve liberar uma superfície de recuperação explícita usando defaults seguros, sem tela vazia.
- Falha de GET/PATCH mantém a edição local visível e retryável.
- Participante de armazenamento offline ausente ou vazio deve produzir estado vazio, não uma confirmação de limpeza fictícia.

## Critérios de aceite

### AC-001 — Migração e persistência local

Dados v1 são migrados para v2 sem perda, e alterações locais sobrevivem a reinício com revisão e dirty paths consistentes.

### AC-002 — Defaults não sobrescrevem conta

Uma instalação sem edição local ativa a conta usando os valores remotos sem emitir PATCH.

### AC-003 — Merge seletivo e contrato integral

Na autenticação, somente dirty paths locais prevalecem sobre a resposta remota, enquanto o PATCH integral preserva todos os demais campos.

### AC-004 — Concorrência, identidade e retry

Respostas antigas, troca de conta e falhas não apagam a revisão local mais recente; retry envia a projeção atual e a repetição confirmada é idempotente.

### AC-005 — Idioma local e valores válidos

O idioma da interface persiste sem entrar no PATCH e densidade continua restrita a `COMPACT | COMFORTABLE`.

### AC-006 — Logout preserva preferências do aparelho

Ao sair, a projeção privada é descartada e as preferências locais confirmadas voltam a ser aplicadas.

### AC-007 — Controles de dados verdadeiros

Cache preserva sessão/preferências e dados offline vazios são apresentados como vazios, sem ação ou sucesso simulado.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                      |
| -------- | ----------------------------------------------------------------------------- |
| AC-001   | Testes do envelope v1→v2, restart, revisão e dirty paths                      |
| AC-002   | Teste de ativação sem PATCH em instalação limpa                               |
| AC-003   | Teste de GET, overlay por path e payload integral preservado                  |
| AC-004   | Testes de edição concorrente, troca de identidade, erro, retry e idempotência |
| AC-005   | Testes de payload sem idioma e enum de densidade                              |
| AC-006   | Teste de logout/restauração local                                             |
| AC-007   | Testes de cache e registro offline vazio                                      |

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-001`, `MOB-FEAT-002`, `MOB-FEAT-003`, `MOB-FEAT-007`, `MOB-FEAT-008`
- Motivo: todas estão implementadas.

## Fora de escopo

- Alterar endpoints ou persistência da Core.
- Sincronizar idioma da interface com a conta.
- Criar uma terceira opção de densidade.
- Armazenar ou traduzir capítulos offline.

## Aprovação humana

- Aprovador: usuário
- Data: 2026-08-09

O usuário aprovou explicitamente o plano completo que definiu estes critérios antes da criação de tasks e código.
