---
name: sdd-reviewer
description: Revisa implementação, testes e tasks do Manga Reader Mobile contra uma Target Spec aprovada. Use após execução, antes de considerar uma feature concluída, ou quando for necessário emitir review rastreável com findings e verdict.
---

# SDD Reviewer

## Fluxo

1. Ler spec aprovada, tasks, decisões, baselines afetados, `coverage.json` e `_templates/review.md`.
2. Comparar cada `AC-*` com comportamento implementado e evidência, sem confiar apenas nos checkboxes.
3. Procurar requisitos ausentes, comportamento extra, regressões, violações FSD/i18n/tema e testes frágeis.
4. Confirmar que cada arquivo implementado está mapeado ao `AC-*` ou baseline correspondente e rodar `pnpm check`.
5. Criar ou atualizar `review.md` com findings priorizados e verdict `approved` ou `changes-requested`.

## Regras

- Não modificar a Target Spec para fazer a implementação passar.
- Não aprovar critério sem evidência adequada.
- Distinguir código divergente de spec divergente; mudança de intenção volta ao Spec Architect e à aprovação humana.

## Saída

Entregar findings com arquivo/local, matriz `AC-* → implementação → evidência`, cobertura de arquivos, gates, mudanças fora de escopo e verdict explícito. Arquivo runtime descoberto ou requisito sem evidência exige `changes-requested`.
