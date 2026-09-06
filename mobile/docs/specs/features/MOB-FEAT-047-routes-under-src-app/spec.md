---
id: MOB-FEAT-047
type: feature
title: Rotas Expo Router sob src/app
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-046]
created: 2026-09-05
updated: 2026-09-05
supersedes: []
superseded_by: []
---

# MOB-FEAT-047 — Rotas Expo Router sob src/app

## Objetivo

Mover as cascas de rota do Expo Router para `src/app`, mantendo
`src/application` como app layer lógica e preservando URLs, typed routes e
fronteiras FSD.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-046` para evitar misturar falhas de runtime com falhas de
  resolução de rotas.
- Supersede a restrição operacional de `MOB-DEC-004` por `MOB-DEC-005`.

## Requisitos e regras

- Mover somente cascas de rota; páginas, features, entities e providers mantêm
  suas responsabilidades atuais.
- Atualizar alias `@/`, Jest, validador FSD, cobertura SDD e referências de docs.
- Imports externos continuam usando APIs públicas de slices.
- A topologia e os nomes públicos das rotas permanecem inalterados.

## Casos de erro

- Rota não descoberta, deep import ou inversão FSD bloqueia a conclusão.
- Referência residual ao diretório raiz `app/` deve ser corrigida ou registrada
  como menção histórica explícita.

## Critérios de aceite

### AC-001 — Descoberta e topologia preservadas

O Expo Router descobre `src/app` e expõe a mesma árvore de rotas.

### AC-002 — Alias e ferramentas coerentes

TypeScript, Jest, lint FSD e mapa SDD resolvem a nova raiz sem exceções amplas.

### AC-003 — Fronteira route shell versus application

`src/app` contém apenas arquivos do Router e importa a API pública de
`src/application`; a app layer lógica permanece sem lógica de domínio.

## Estratégia de evidência

| Critério | Teste/evidência esperada                           |
| -------- | -------------------------------------------------- |
| AC-001   | export/bundle e navegação iOS após a movimentação  |
| AC-002   | typecheck, Jest, lint:fsd e validação de cobertura |
| AC-003   | auditoria de árvore/imports e `MOB-DEC-005`        |

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-046`
- Motivo: `MOB-FEAT-046` foi executada e está `verification-pending` somente pela
  matriz Android, condição aceita como dependência concluída pelo workflow SDD.

## Fora de escopo

- Alterar URLs, telas ou regras de acesso.
- Renomear `src/application` ou fundir providers com as cascas de rota.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-09-05
