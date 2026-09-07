---
id: MOB-FEAT-048
type: feature
title: Taxonomia da documentação mobile
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-047]
created: 2026-09-05
updated: 2026-09-05
supersedes: []
superseded_by: []
---

# MOB-FEAT-048 — Taxonomia da documentação mobile

## Objetivo

Concentrar documentação mobile em `mobile/docs`, separando contratos normativos,
decisões, planos ativos, referências e legado sem perder histórico.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-047` para que caminhos documentados reflitam a árvore final.
- É regida por `MOB-DEC-006` e pela política documental do monorepo.

## Requisitos e regras

- `mobile/README.md`, `mobile/AGENTS.md` e automações locais permanecem na raiz.
- Specs normativas ficam em `docs/specs`, decisões em `docs/decisions`, planos em
  `docs/plans`, referências em `docs/references` e material obsoleto em `docs/legacy`.
- Links relativos, scripts SDD, registry e coverage devem continuar válidos.
- Nenhum documento é apagado sem aprovação individual; conteúdo movido preserva
  histórico e recebe sinalização quando for meramente informativo ou legado.

## Casos de erro

- Link quebrado, artefato não registrado ou arquivo sem classificação bloqueia a
  conclusão.
- Duplicidade de fonte normativa deve ser resolvida por referência, não por cópia.

## Critérios de aceite

### AC-001 — Estrutura documental navegável

`mobile/docs/README.md` explica a taxonomia e conduz às fontes de verdade.

### AC-002 — SDD operacional após a mudança

Registry, coverage e scripts encontram todos os artefatos nos novos caminhos.

### AC-003 — Histórico preservado e links íntegros

Nenhum arquivo é perdido e as referências mobile apontam para destinos existentes
ou registram explicitamente uma ausência histórica.

## Estratégia de evidência

| Critério | Teste/evidência esperada                        |
| -------- | ----------------------------------------------- |
| AC-001   | inspeção da árvore e navegação pelo índice      |
| AC-002   | `pnpm specs:check` e auditoria de cobertura     |
| AC-003   | inventário Git e verificador de links relativos |

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-047`
- Motivo: `MOB-FEAT-047` foi implementada e definiu a estrutura de runtime.

## Fora de escopo

- Reorganizar a documentação global de backend/web.
- Apagar documentos redundantes sem nova aprovação humana individual.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-09-05
