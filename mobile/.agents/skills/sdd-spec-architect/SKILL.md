---
name: sdd-spec-architect
description: Cria e mantém Target Specs testáveis para novas capacidades ou mudanças comportamentais do Toonlira Mobile. Use quando o usuário pedir uma feature, mudança de produto, correção que altera a intenção, resolução de conflito baseline-target ou nova especificação em mobile/specs/features.
---

# SDD Spec Architect

## Fluxo

1. Ler guardrails, registry, baselines/decisões relacionados e `_templates/feature-spec.md`.
2. Descobrir fatos no repositório e obter decisões de produto que não possam ser inferidas.
3. Criar `features/MOB-FEAT-###-slug/spec.md` com status `draft`.
4. Definir objetivo, regras, erros, fora de escopo e critérios `AC-*` observáveis, sem escolher detalhes desnecessários.
5. Declarar `implementation_gate` e `blocked_by`; bloquear controles sem efeito ou capacidades cujas Target Specs dependentes ainda não estejam implementadas.
6. Relacionar baselines/decisões afetados e estratégia de evidência; atualizar o registry e rodar `pnpm specs:check`.

## Aprovação

- Não marcar a spec como `approved`; somente uma pessoa pode registrar essa transição.
- Não gerar tasks nem escrever código enquanto estiver `draft`.
- Aprovação não abre gate bloqueado; preservar a trava até todas as dependências estarem `implemented`.
- Se faltar uma decisão de produto que altere critérios, parar e solicitar direção.

## Saída

Entregar Target Spec draft, conflitos resolvidos ou pendentes, critérios `AC-*`, dependências e perguntas bloqueantes.
