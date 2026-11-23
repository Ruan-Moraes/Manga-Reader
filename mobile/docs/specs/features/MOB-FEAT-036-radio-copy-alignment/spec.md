---
id: MOB-FEAT-036
type: feature
title: Alinhamento entre indicador e copy dos rádios
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-035]
created: 2026-08-26
updated: 2026-08-26
supersedes: []
superseded_by: []
---

# MOB-FEAT-036 — Alinhamento entre indicador e copy dos rádios

## Objetivo

Impedir que título ou descrição de uma opção de rádio apareçam acima, colados
ou desalinhados em relação ao indicador, no iOS e Android.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-031..035` sem alterar valores, stores ou persistência.
- A solicitação explícita de correção em 2026-08-26 constitui aprovação humana.
- A correção cobre `ChoiceGroup` e, após a clarificação do aprovador, os
  `ChoiceCards` usados nas telas de configurações.

## Requisitos e regras

- Cada opção deve possuir uma linha interna estável. Em `ChoiceGroup`, o
  indicador fica à esquerda da copy. Nos cards de configurações, preview/ícone,
  copy e indicador ficam no mesmo eixo horizontal, alinhados pela linha do
  título.
- Título e indicador nunca podem ocupar alturas conflitantes; a descrição cresce
  abaixo do título sem deslocar o indicador para o centro do bloco textual.
- O indicador deve possuir anel e preenchimento selecionado, sem depender de
  cor; toda a opção permanece acionável.
- Pressionado, foco, selecionado e desabilitado devem usar tokens públicos.
- Opções podem quebrar entre linhas ou empilhar entre si, mas a composição
  interna indicador/copy permanece horizontal.
- Font scale elevado força opções empilhadas para preservar legibilidade.

## Casos de erro

- Copy longa não pode empurrar, encolher ou sobrepor o indicador.
- Descrição ausente não pode alterar o eixo vertical do título.
- Opção desabilitada não recebe ação e mantém semântica assistiva.
- Wrap em telas estreitas não pode produzir largura maior que o contêiner.

## Critérios de aceite

### AC-001 — Alinhamento interno

Indicador e título ficam lado a lado e alinhados pela mesma linha visual, com
gap consistente, inclusive nos cards de tema, modo e direção.

### AC-002 — Seleção visível

O rádio selecionado apresenta anel e ponto interno, além de estado semântico.

### AC-003 — Responsividade

Copy longa, tela estreita e font scale de 200% não sobrepõem nem reposicionam o
texto acima do indicador.

### AC-004 — Estados

Normal, pressionado, foco, selecionado e desabilitado são verificáveis e
consomem tokens.

### AC-005 — Compatibilidade

API, consumidores, i18n e persistência existentes permanecem inalterados.

### AC-006 — Qualidade

Testes dirigidos, gates de arquitetura e `pnpm check` passam integralmente.

## Estratégia de evidência

| Critério | Evidência esperada                 |
| -------- | ---------------------------------- |
| AC-001   | teste da linha e ordem visual      |
| AC-002   | teste do indicador e semântica     |
| AC-003   | teste de font scale e wrap         |
| AC-004   | teste de foco, pressão e disabled  |
| AC-005   | testes de consumidores e typecheck |
| AC-006   | suíte e gates completos            |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-035` implementada.
- Escopo autorizado: `ChoiceGroup`, `ChoiceCards`, consumidores de
  configurações, testes, cobertura e documentação.

## Fora de escopo

- Alterar opções ou regras da seleção de idiomas.
- Substituir segmentos ou o rádio do sheet de select.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-26
- Decisão: correção solicitada e implementação autorizada.
