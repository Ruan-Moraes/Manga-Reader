---
id: MOB-FEAT-###
type: feature
title: Título da Target Spec
status: draft
implementation_gate: open
blocked_by: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
supersedes: []
superseded_by: []
---

# MOB-FEAT-### — Título

## Objetivo

Definir o resultado para usuário/produto.

## Contexto e contratos relacionados

- Baselines/decisões afetados e `OBS-*` substituídos.

## Requisitos e regras

- Comportamentos explicitamente desejados.

## Casos de erro

- Falhas observáveis e resposta esperada.

## Critérios de aceite

### AC-001 — Resultado verificável

Dado um estado, quando ocorrer uma ação, então o resultado observável deve ser inequívoco.

## Estratégia de evidência

| Critério | Teste/evidência esperada |
| -------- | ------------------------ |
| AC-001   | Tipo e nível do teste    |

## Gate de implementação

- Estado: `open`
- Dependências: nenhuma
- Motivo: não aplicável

Quando bloqueada, usar `implementation_gate: blocked`, listar Target Specs em `blocked_by` e explicar o motivo. Aprovação humana não remove a trava: Task Planner e Executor recusam a feature até todas as dependências estarem `implemented` e o gate ser alterado para `open`.

## Fora de escopo

- Limites explícitos da entrega.

## Aprovação humana

- Aprovador: pendente
- Data: pendente

Não criar `tasks.md` antes de status `approved` e aprovação preenchida.
