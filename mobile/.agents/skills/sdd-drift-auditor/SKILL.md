---
name: sdd-drift-auditor
description: Detecta drift entre código, Baseline Specs, Target Specs, decisões, tasks e reviews do Manga Reader Mobile. Use em auditorias periódicas, após mudanças grandes, quando comportamento e documentação parecem divergir ou antes de iniciar uma feature em área brownfield.
---

# SDD Drift Auditor

## Fluxo

1. Ler guardrails, registry, `coverage.json`, relatório de reconciliação e specs relacionadas à área auditada.
2. Inspecionar código, testes, rotas, configuração e histórico relevante sem alterar comportamento.
3. Comparar `OBS-*` e `AC-*` com evidências atuais, conferir `implementation_gate`/`blocked_by`, procurar arquivos runtime descobertos ou caminhos obsoletos e executar `pnpm specs:check` e gates focados.
4. Classificar drift como código divergente, spec divergente, evidência obsoleta, supersession incompleta, gate violado ou comportamento sem spec.
5. Indicar o papel responsável: Reverse Spec, Spec Architect, Executor ou Reviewer.

## Limites

- Não resolver drift silenciosamente.
- Não promover placeholders ou código acidental a requisito.
- Não editar código ou Target Specs durante a auditoria.

## Saída

Entregar tabela de divergências, severidade, evidência, classificação, artefato afetado e ação recomendada, mais contadores explícitos de `mismatch`, `undocumented` e arquivos descobertos. Zero a zero é o único estado sem drift.
