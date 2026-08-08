---
name: sdd-auditor
description: Audita a prontidão e a cobertura do Spec-Driven Development no Manga Reader Mobile. Use ao avaliar registry, baselines, Target Specs, decisões, rastreabilidade, gates, skills ou capacidade de iniciar uma feature sem inventar requisitos.
---

# SDD Auditor

## Fluxo

1. Ler `mobile/AGENTS.md`, `mobile/specs/README.md`, registry, `coverage.json` e o relatório de reconciliação.
2. Inventariar specs, decisões, tasks, reviews, código relacionado e gates sem alterar runtime.
3. Verificar IDs, status, links, supersession, critérios, evidências e cobertura individual de `app/` e `src/` com `pnpm specs:check`.
4. Classificar cada lacuna como ausência de baseline, Target Spec incompleta, evidência ausente, drift ou problema de processo.
5. Entregar relatório priorizado com localização, impacto e próximo papel SDD responsável.

## Limites

- Não criar comportamento de produto nem converter roadmap em requisito.
- Não implementar ou corrigir código durante a auditoria.
- Distinguir falha do workflow de falha já registrada no baseline.
- Tratar `features/` vazio como válido enquanto não houver Target Spec aprovada.

## Saída

Informar contagens de arquivos `behavior`/`evidence`, itens descobertos, verdicts `mismatch`/`undocumented`, inconsistências do registry, gates e encaminhamento. Não declarar prontidão enquanto qualquer contador de paridade for diferente de zero.
