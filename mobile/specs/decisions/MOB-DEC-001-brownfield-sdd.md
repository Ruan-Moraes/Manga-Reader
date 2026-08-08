---
id: MOB-DEC-001
type: decision
title: SDD brownfield com aprovação humana
status: accepted
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: []
---

# MOB-DEC-001 — SDD brownfield com aprovação humana

## Contexto

O mobile já contém fundação e autenticação, mas a direção de produto mudou para uma experiência mobile-first que pode divergir do legado. Documentar o código como requisito congelaria decisões não aprovadas.

## Decisão

Separar Baseline Specs (`OBS-*`) de Target Specs (`AC-*`). Baseline registra somente comportamento demonstrável. Toda feature ou mudança comportamental nasce `draft` e somente uma pessoa pode promovê-la a `approved`; Task Planner e Executor recusam outros status.

O fluxo obrigatório é Reverse Spec, Spec Architect, aprovação humana, Task Planner, Executor, Reviewer e Drift Auditor. O executor não modifica requisitos para acomodar a implementação.

## Alternativas consideradas

- Converter todo código atual em Target Spec: rejeitado porque promoveria legado e placeholders a intenção futura.
- Permitir autoaprovação por agente: rejeitado porque decisões de produto não são dedutíveis do repositório.
- Executar diretamente a partir de prompts: rejeitado por não criar contrato versionado e revisável.

## Consequências

- Mudanças podem parar aguardando aprovação ou decisão de produto.
- Baselines continuam substituíveis e podem conter conflitos explícitos.
- Registry, tasks e reviews passam a ser parte do gate de mudança.

## Relações

- Rege `mobile/AGENTS.md`, `mobile/specs/` e todas as skills SDD locais.
