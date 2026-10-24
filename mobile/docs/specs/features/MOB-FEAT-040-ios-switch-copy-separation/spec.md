---
id: MOB-FEAT-040
type: feature
title: Separação segura entre copy e switch no iOS
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-039]
created: 2026-08-26
updated: 2026-08-26
supersedes: []
superseded_by: []
---

# MOB-FEAT-040 — Separação segura entre copy e switch no iOS

## Objetivo

Impedir que título ou descrição invadam a área visual do `Switch` nativo no
iOS, preservando alinhamento, wrap e comportamento equivalentes no Android.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-037` e `MOB-FEAT-039` sem mudar valores ou persistência.
- O desenho intrínseco do switch no iOS exige uma coluna de controle reservada.
- A solicitação explícita de correção em 2026-08-26 constitui aprovação humana.

## Requisitos e regras

- A copy ocupa somente o espaço restante e pode encolher até `minWidth: 0`.
- A coluna do switch possui largura explícita suficiente para seu desenho nativo.
- O switch fica centralizado verticalmente em relação à copy no layout horizontal.
- Em font scale elevado, o layout empilhado mantém o controle à direita.
- Foco, pressão e mudança de valor não alteram a geometria externa.
- APIs, semântica, tokens, callbacks e persistência permanecem inalterados.

## Casos de erro

- Título longo não pode passar por baixo do switch no iOS.
- Descrição com wrap não pode ocupar a coluna reservada do controle.
- Font scale elevado não pode truncar conteúdo essencial.
- A correção não pode deslocar ou cortar o switch no Android.

## Critérios de aceite

### AC-001 — Coluna reservada

O switch possui uma coluna com largura explícita e sem shrink em todas as
instâncias compartilhadas.

### AC-002 — Copy contida

Título e descrição usam somente a coluna flexível restante, com wrap seguro.

### AC-003 — Alinhamento

No layout horizontal, o switch fica centralizado verticalmente em relação ao
bloco de copy; no empilhado, permanece alinhado à direita.

### AC-004 — Geometria estável

Foco, pressão e mudança de valor não alteram altura, borda ou distribuição.

### AC-005 — Compatibilidade

Android, APIs, semântica, opções, callbacks, i18n e persistência não mudam.

### AC-006 — Qualidade

Testes dirigidos, gates FSD e `pnpm check` passam integralmente.

## Estratégia de evidência

| Critério | Evidência esperada                    |
| -------- | ------------------------------------- |
| AC-001   | teste da largura e shrink do controle |
| AC-002   | teste da coluna flexível de copy      |
| AC-003   | teste de alinhamento por layout       |
| AC-004   | teste comparativo de borda            |
| AC-005   | consumidores e typecheck              |
| AC-006   | gates completos                       |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-039` implementada.
- Escopo autorizado: `SwitchRow`, testes, coverage e documentação da correção.

## Fora de escopo

- Redesenhar visualmente o switch nativo.
- Alterar regras de negócio das configurações.
- Criar implementação exclusiva para uma tela.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-26
- Decisão: correção solicitada e implementação autorizada.
