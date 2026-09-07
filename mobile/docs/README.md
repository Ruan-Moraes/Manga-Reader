# Documentação mobile

Esta é a raiz documental canônica do aplicativo mobile. A classificação abaixo
define autoridade e ciclo de vida; documentos informativos não substituem uma
Target Spec aprovada.

| Diretório                     | Autoridade  | Conteúdo                                                |
| ----------------------------- | ----------- | ------------------------------------------------------- |
| [`specs/`](specs/README.md)   | normativa   | baselines, Target Specs, templates, registry e coverage |
| [`decisions/`](decisions/)    | normativa   | decisões arquiteturais `MOB-DEC-*`                      |
| [`active/`](active/)          | operacional | relatórios correntes que sustentam os gates             |
| [`plans/`](plans/)            | informativa | planos de execução e migrações                          |
| [`references/`](references/)  | informativa | mapas, riscos e análises de apoio                       |
| [`legacy/`](legacy/README.md) | histórica   | material preservado sem autoridade atual                |

Pontos de entrada operacionais permanecem na raiz do módulo:
[`README.md`](../README.md) para execução e [`AGENTS.md`](../AGENTS.md) para os
guardrails SDD.

## Fluxo recomendado

1. Consulte o [`registry`](specs/registry.md) e o
   [`coverage.json`](specs/coverage.json).
2. Trate `specs/` e `decisions/` como fontes normativas.
3. Use planos e referências apenas como contexto; qualquer mudança de intenção
   exige uma Target Spec aprovada.
4. Mova material obsoleto para `legacy/`; exclusão documental exige aprovação
   humana individual.

## Performance

- [Referência normativa — MOB-DEC-007](decisions/MOB-DEC-007-mobile-performance.md).
- [Estado consolidado, diagnóstico histórico e evidências](active/performance-audit.md).
- [Plano de validação e investigações restantes](plans/performance-remediation.md).
- [Skill obrigatória](../.agents/skills/mobile-performance/SKILL.md).
