---
name: sdd-reverse-spec
description: Extrai Baseline Specs do código brownfield do Toonlira Mobile sem inferir intenção futura. Use ao tocar comportamento mobile ainda sem spec, documentar uma capacidade existente, registrar integração atual com a Core ou separar observação, conflito e desconhecido.
---

# SDD Reverse Spec

## Fluxo

1. Ler os guardrails, o template `_templates/baseline-spec.md`, o registry e `coverage.json`.
2. Inspecionar rotas, código, configuração, testes e documentação da capacidade; usar Core/web somente como contexto.
3. Registrar comportamentos como `OBS-*`, com evidência reproduzível e código relacionado.
4. Separar desconhecidos, efeitos incompletos e conflitos de direção de produto.
5. Criar ou atualizar a Baseline Spec, registry e entradas individuais dos arquivos tocados no manifesto; executar `pnpm specs:check`.

## Regras

- Escrever somente o que o código demonstra hoje.
- Não usar “deve” para transformar legado em Target Spec.
- Não corrigir bugs, preencher lacunas ou detalhar placeholders artificialmente.
- Se houver intenção futura, registrar conflito e encaminhar ao Spec Architect.

## Saída

Entregar baseline `observed`, lista de `OBS-*`, evidências, entradas arquivo→OBS, desconhecidos, conflitos e itens deliberadamente fora da spec. Parar se restar arquivo runtime descoberto.
