---
name: sdd-executor
description: Implementa Target Specs aprovadas do Toonlira Mobile seguindo tasks rastreáveis, FSD, tema, i18n e testes. Use somente quando spec e registry estiverem approved, tasks existirem e o pedido autorizar implementação.
---

# SDD Executor

## Pré-condições

1. Confirmar status `approved` na spec e no registry.
2. Confirmar `implementation_gate: open` e todas as dependências em `blocked_by` como `implemented`.
3. Confirmar `tasks.md`, critérios `AC-*`, decisões e baselines afetados.
4. Parar se houver contradição, requisito ausente, gate bloqueado ou decisão de produto não resolvida.

## Execução

1. Implementar apenas as tasks aprovadas, respeitando FSD e APIs públicas dos slices.
2. Criar testes/evidências correspondentes aos `AC-*` antes de concluir cada task.
3. Atualizar somente checkboxes e evidências em `tasks.md`; nunca reescrever requisitos.
4. Rodar gates focados durante o trabalho e `pnpm check` ao final.
5. Marcar a implementação pronta para review, sem autoaprovar ou alterar a spec para acomodar o código.

## Saída

Entregar mudanças, matriz de critérios atendidos, gates executados, desvios bloqueantes e handoff obrigatório ao SDD Reviewer.
