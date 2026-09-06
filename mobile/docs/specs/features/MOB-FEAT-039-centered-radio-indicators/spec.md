---
id: MOB-FEAT-039
type: feature
title: Centralização vertical dos indicadores de rádio
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-038]
created: 2026-08-26
updated: 2026-08-26
supersedes: []
superseded_by: []
---

# MOB-FEAT-039 — Centralização vertical dos indicadores de rádio

## Objetivo

Centralizar verticalmente o indicador circular em relação à altura total de cada
opção de rádio, com resultado equivalente em Android e iOS.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-038` sem reintroduzir variação de altura entre estados.
- O alinhamento pelo topo produz diferença visual mais perceptível no Android.
- A solicitação explícita de correção em 2026-08-26 constitui aprovação humana.

## Requisitos e regras

- O centro vertical do indicador deve acompanhar o centro da superfície clicável.
- O contrato vale para cards, grupos simples, segmentos e opções do select.
- Título e descrição permanecem em uma coluna flexível, sem sobreposição.
- Borda, padding, dimensões e distribuição permanecem constantes ao selecionar.
- Indicador mantém tamanho fixo e `flexShrink: 0`.
- Semântica `radiogroup`, `radio`, `selected` e `disabled` permanece intacta.

## Casos de erro

- Opção com título e descrição não pode manter o círculo junto ao topo.
- Copy longa ou font scale elevado não pode sobrepor o indicador.
- Seleção consecutiva não pode deslocar o grupo ou o conteúdo abaixo dele.
- Android e iOS não podem depender de ajustes verticais divergentes.

## Critérios de aceite

### AC-001 — Centralização compartilhada

Todos os componentes compartilhados com semântica de rádio centralizam o
indicador verticalmente na opção inteira, inclusive quando existe descrição.

### AC-002 — Geometria estável

Selecionar, pressionar ou focar não altera altura, borda ou distribuição.

### AC-003 — Copy responsiva

Copy longa e font scale elevado usam wrap sem sobrepor ou deslocar o indicador
para fora do centro da superfície.

### AC-004 — Paridade entre plataformas

O alinhamento é definido pelo layout compartilhado, sem offset específico que
gere divergência entre Android e iOS.

### AC-005 — Compatibilidade

APIs, opções, callbacks, i18n, persistência e semântica existentes não mudam.

### AC-006 — Qualidade

Testes dirigidos, gates FSD e `pnpm check` passam integralmente.

## Estratégia de evidência

| Critério | Evidência esperada                      |
| -------- | --------------------------------------- |
| AC-001   | testes estruturais dos quatro controles |
| AC-002   | comparação entre estados                |
| AC-003   | testes de descrição e copy flexível     |
| AC-004   | ausência de offsets por plataforma      |
| AC-005   | testes dos consumidores e typecheck     |
| AC-006   | gates completos                         |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-038` implementada.
- Escopo autorizado: componentes de rádio em `shared/ui`, testes, coverage e
  documentação desta correção.

## Fora de escopo

- Alterar valores ou regras de negócio das configurações.
- Redesenhar switches, sliders, steppers ou paletas.
- Adicionar offsets exclusivos para uma plataforma.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-26
- Decisão: correção solicitada e implementação autorizada.
