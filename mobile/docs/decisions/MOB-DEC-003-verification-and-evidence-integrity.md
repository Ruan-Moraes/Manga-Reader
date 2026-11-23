---
id: MOB-DEC-003
type: decision
title: Integridade de verificação, evidência e drift
status: accepted
created: 2026-08-09
updated: 2026-08-09
supersedes: []
superseded_by: []
---

# MOB-DEC-003 — Integridade de verificação, evidência e drift

## Contexto

O status `implemented` vinha sendo usado mesmo com tasks manuais abertas, alguns critérios não possuíam evidência classificada e reviews registravam uma working tree sem referência reproduzível. Isso permitia que relatórios verdes divergissem dos próprios artefatos.

## Decisão

Adicionar `verification-pending` às Target Specs. Esse status informa que o código necessário existe e pode satisfazer dependências técnicas já executadas, mas a feature não está concluída porque existe ao menos uma task de verificação aberta. O review deve usar o mesmo verdict e a promoção para `implemented` só ocorre depois que todas as tasks forem concluídas com evidência real.

Todo `AC-*` terá exatamente uma linha de rastreabilidade em `tasks.md`, exatamente uma linha de resultado em `review.md` e ao menos uma entrada `evidence` em `coverage.json`. Features `implemented` ou `verification-pending` terão `drift-audit.md` persistido. Reviews dessas features apontarão para commit imutável ou para um checksum SHA-256 reproduzível do runtime, recursos, scripts, configuração e artefatos SDD; `review.md` e `drift-audit.md` ficam fora do hash porque são os documentos que o registram.

O validador rejeita `implemented` com task aberta, `verification-pending` sem task aberta ou verdict correspondente, ausência de drift/evidência, contadores de reconciliação não derivados e checksums divergentes.

## Alternativas consideradas

- Manter `implemented` e tratar verificações físicas como nota de release: rejeitado porque uma task normativa aberta não pode coexistir com conclusão.
- Rebaixar para `in-progress`: rejeitado porque quebraria artificialmente dependências cujas implementações já foram executadas.
- Fabricar ou reconstruir evidência manual: rejeitado porque evidência deve registrar uma execução real.

## Consequências

- `MOB-FEAT-005` permanece utilizável como dependência, mas não concluída até a matriz física iOS/Android.
- O manifesto e os reviews ficam mais explícitos e verificáveis.
- Qualquer mudança em código runtime invalida checksums de reviews baseados na working tree e exige nova revisão documental.

## Relações

- Rege `docs/specs/README.md`, `docs/specs/_templates/`, `scripts/checks/validate-specs.mjs` e todas as Target Specs.
- Decisão aceita por autorização humana explícita em 2026-08-09.
