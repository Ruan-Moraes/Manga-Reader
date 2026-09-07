---
id: MOB-FEAT-038
type: feature
title: Alinhamento e geometria estável dos rádios
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-037]
created: 2026-08-26
updated: 2026-08-26
supersedes: []
superseded_by: []
---

# MOB-FEAT-038 — Alinhamento e geometria estável dos rádios

## Objetivo

Alinhar indicador e copy dos controles com semântica de rádio e impedir que
seleção ou foco alterem altura, largura ou distribuição da página.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-031..037` sem alterar valores ou persistência.
- O defeito decorre de bordas com espessura variável entre estado normal e
  selecionado/focado.
- A solicitação explícita de correção em 2026-08-26 constitui aprovação humana.

## Requisitos e regras

- Borda externa deve manter a mesma espessura em normal, pressionado,
  selecionado e foco; estados mudam apenas tokens visuais internos e de cor.
- Indicador e primeira linha da copy devem compartilhar o mesmo alinhamento.
- Descrição cresce abaixo do título sem centralizar ou deslocar o indicador.
- Indicador nunca encolhe; copy usa largura flexível e wrap seguro.
- O contrato vale para cards, grupos simples, segmentos e opções do select.
- Semântica `radiogroup`, `radio`, `selected` e `disabled` permanece intacta.

## Casos de erro

- Selecionar alternativas consecutivas não pode mover conteúdo abaixo do grupo.
- Foco por teclado não pode alterar dimensões.
- Copy longa ou descrição ausente não pode desalojar o indicador.
- Font scale elevado não pode causar sobreposição ou truncamento essencial.

## Critérios de aceite

### AC-001 — Geometria constante

Estado normal, selecionado e focado usam a mesma espessura de borda e preservam
as mesmas dimensões externas.

### AC-002 — Alinhamento

Indicador fica alinhado à primeira linha do título, com gap consistente e copy
flexível.

### AC-003 — Estados visuais

Seleção, foco e pressão continuam distinguíveis por cor, fundo e preenchimento,
sem depender da mudança de espessura.

### AC-004 — Responsividade e acessibilidade

Telas estreitas e font scale de 200% preservam conteúdo, alvos e semântica.

### AC-005 — Compatibilidade

APIs, opções, callbacks, i18n e persistência existentes não mudam.

### AC-006 — Qualidade

Testes dirigidos, gates FSD e `pnpm check` passam integralmente.

## Estratégia de evidência

| Critério | Evidência esperada                    |
| -------- | ------------------------------------- |
| AC-001   | teste comparando bordas entre estados |
| AC-002   | teste da linha, indicador e copy      |
| AC-003   | testes de seleção, pressão e foco     |
| AC-004   | testes de wrap/font scale e semântica |
| AC-005   | testes dos consumidores e typecheck   |
| AC-006   | gates completos                       |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-037` implementada.
- Escopo autorizado: componentes de rádio em `shared/ui`, testes, coverage e
  documentação desta correção.

## Fora de escopo

- Alterar opções ou regras de negócio.
- Substituir componentes por dependência externa.
- Redesenhar switches, sliders ou steppers.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-26
- Decisão: correção solicitada e implementação autorizada.
