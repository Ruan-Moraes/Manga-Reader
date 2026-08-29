---
id: MOB-FEAT-041
type: feature
title: Redesign completo da folha do select
status: superseded
implementation_gate: open
blocked_by: [MOB-FEAT-040]
created: 2026-08-27
updated: 2026-08-27
supersedes: []
superseded_by: [MOB-FEAT-042]
---

# MOB-FEAT-041 — Redesign completo da folha do select

## Objetivo

Dar mais presença, organização e legibilidade à folha de opções aberta pelo
`SelectField`, usando melhor a altura disponível e refinando as opções sem
alterar o contrato funcional dos consumidores.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-035`, `MOB-FEAT-038` e `MOB-FEAT-039`.
- Uma altura mínima fixa em 72% resolveu o painel curto, mas criou espaço vazio
  excessivo em listas pequenas.
- Cards aninhados, ícone decorativo e controles grandes deixaram a composição
  visualmente carregada e genérica.
- A solicitação explícita de melhoria em 2026-08-27 constitui aprovação humana.

## Requisitos e regras

- A folha usa uma base mínima de 46% e máximo de 88% da altura disponível,
  limitada a 720 pt/dp e expandida conforme a quantidade de opções.
- O cálculo nunca produz mínimo maior que o máximo, inclusive em viewports
  baixas e listas extensas.
- Cabeçalho e alça permanecem fixos; somente a região de opções rola.
- O cabeçalho usa apenas título, alça e fechamento discreto, sem iconografia
  decorativa ou repetição do valor atual.
- Opções formam uma lista contínua com altura mínima de 64 pt/dp, divisores
  discretos e seleção por superfície sutil e check à direita.
- Opções não selecionadas não exibem círculos vazios ou outros indicadores
  concorrentes.
- Seleção, foco e pressão alteram tokens visuais, nunca espessura ou geometria.
- Título e descrição permanecem flexíveis, legíveis e sem sobreposição.
- O gatilho fechado exibe somente valor e chevron, sem ícone ornamental.
- APIs, valores, callbacks, fechamento, i18n e persistência não mudam.

## Casos de erro

- Viewport baixa ou paisagem não pode gerar `minHeight` maior que `maxHeight`.
- Lista extensa deve permanecer rolável sem mover o cabeçalho.
- Lista curta deve manter presença de folha sem produzir uma grande área vazia.
- Copy longa e font scale elevado não podem sobrepor o indicador.
- Lista vazia deve abrir e fechar normalmente.
- Scrim, botão fechar e back do Android não podem alterar o valor.

## Critérios de aceite

### AC-001 — Altura responsiva

A folha respeita base mínima de 46%, máximo de 88%, teto de 720 pt/dp, cresce
conforme o conteúdo e mantém limites válidos em viewports baixas.

### AC-002 — Estrutura da folha

Alça e cabeçalho permanecem fixos, enquanto a lista ocupa o espaço restante e
rola independentemente.

### AC-003 — Design das opções

Opções formam uma lista contínua de pelo menos 64 pt/dp, com divisores,
hierarquia clara, estados tokenizados e um único check de seleção.

### AC-004 — Interação e acessibilidade

Cada linha inteira é acionável, mantém semântica de rádio e expõe seleção,
pressão e foco sem depender apenas de cor.

### AC-005 — Responsividade e compatibilidade

Safe areas, orientação, font scale, iOS e Android funcionam sem alterar API,
valores, callbacks, i18n ou persistência.

### AC-006 — Qualidade

Testes dirigidos, gates FSD e `pnpm check` passam integralmente.

## Estratégia de evidência

| Critério | Evidência esperada                     |
| -------- | -------------------------------------- |
| AC-001   | testes do resolvedor de altura         |
| AC-002   | teste estrutural do sheet e ScrollView |
| AC-003   | teste de card e indicador único        |
| AC-004   | testes de seleção, foco e fechamento   |
| AC-005   | consumidores, safe area e typecheck    |
| AC-006   | review, drift e gates completos        |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-040` implementada.
- Escopo autorizado: `SelectField`, testes, coverage e documentação do redesign.

## Fora de escopo

- Busca, seleção múltipla ou agrupamento de opções.
- Alterar os valores disponíveis em configurações.
- Adicionar dependência externa de bottom sheet.
- Implementar gesto interativo de arrastar para fechar.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-27
- Decisão: melhoria solicitada e implementação autorizada.
