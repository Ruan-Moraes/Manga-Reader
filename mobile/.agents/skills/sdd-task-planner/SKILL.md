---
name: sdd-task-planner
description: Deriva tasks implementáveis e rastreáveis de Target Specs aprovadas do Manga Reader Mobile. Use quando uma spec em mobile/specs/features estiver humanamente approved e precisar de plano de código, testes, gates e ordem de execução sem acrescentar requisitos.
---

# SDD Task Planner

## Fluxo

1. Confirmar no arquivo e no registry que a Target Spec está `approved`.
2. Ler decisões, baselines afetados, arquitetura e `_templates/tasks.md`.
3. Criar `tasks.md` ao lado da spec com passos pequenos e ordenados.
4. Mapear todo `AC-*` a pelo menos uma task e uma evidência automatizada ou justificativa aceita.
5. Incluir arquivos prováveis, riscos, gates e critérios de conclusão; rodar `pnpm specs:check`.

## Limites

- Recusar specs `draft`, contraditórias ou sem critérios verificáveis.
- Não inventar validações, telas, contratos, fallback ou refactors fora da spec.
- Não implementar código e não modificar o texto normativo da Target Spec.

## Saída

Entregar checklist de tasks, matriz `AC-* → task → evidência`, sequência de gates e bloqueios remanescentes.
