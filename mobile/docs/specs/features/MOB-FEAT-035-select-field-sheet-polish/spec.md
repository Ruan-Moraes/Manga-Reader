---
id: MOB-FEAT-035
type: feature
title: Refinamento do campo select e da folha de opções
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-034]
created: 2026-08-24
updated: 2026-08-24
supersedes: []
superseded_by: []
---

# MOB-FEAT-035 — Refinamento do campo select e da folha de opções

## Objetivo

Dar mais identidade, hierarquia e previsibilidade ao `SelectField` fechado e à
folha de opções aberta, com comportamento equivalente no iOS e Android.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-031..034` sem alterar valores, stores ou persistência.
- A solicitação explícita de melhoria e implementação em 2026-08-24 constitui
  aprovação humana.
- O controle permanece genérico em `shared/ui` e todos os consumidores atuais
  recebem o mesmo contrato visual e acessível.

## Requisitos e regras

- O campo fechado deve destacar o valor corrente, comunicar abertura e possuir
  estados normal, pressionado, focado, aberto e desabilitado.
- A folha deve abrir de baixo para cima, apresentar alça, título, contexto da
  seleção e fechamento explícito.
- Opções devem possuir alvo integral, indicador de rádio, título, descrição
  opcional e seleção que não dependa somente de cor.
- Toque no scrim, botão fechar e back do Android devem fechar sem alterar valor.
- Selecionar uma opção deve emitir uma única mudança e fechar a folha.
- Safe areas, barra de navegação Android, orientação e listas extensas devem ser
  respeitadas.

## Casos de erro

- Lista vazia não pode travar abertura, fechamento ou back do sistema.
- Textos longos devem truncar somente o resumo do cabeçalho; opções permanecem
  legíveis e roláveis.
- Redução de movimento deve remover a transição espacial sem remover feedback
  de estado.
- Campo desabilitado não abre a folha nem perde sua semântica.

## Critérios de aceite

### AC-001 — Campo com hierarquia

Valor, ícone e indicador de expansão formam um controle coeso, com contraste e
alvo mínimo válidos em claro e escuro.

### AC-002 — Folha de opções

A abertura usa bottom sheet com alça, cabeçalho fixo e lista rolável, sem
encostar em recortes ou na navegação do sistema.

### AC-003 — Opções e estados

Cada opção expõe semântica de rádio e estados selecionado, pressionado, foco e
desabilitado, sem depender exclusivamente de cor.

### AC-004 — Contrato multiplataforma

Scrim, botão fechar e back fecham a folha; a seleção funciona igualmente no
iOS e Android sem API exclusiva de plataforma.

### AC-005 — Compatibilidade

Consumidores e API pública existentes permanecem compatíveis; i18n e
persistência não mudam.

### AC-006 — Qualidade

Testes do campo e da folha, auditoria nativa iOS, análise Android e `pnpm check`
passam integralmente.

## Estratégia de evidência

| Critério | Evidência esperada                            |
| -------- | --------------------------------------------- |
| AC-001   | teste de layout e auditoria do campo fechado  |
| AC-002   | teste do modal e auditoria do bottom sheet    |
| AC-003   | teste de semântica e seleção                  |
| AC-004   | teste de fechamento e análise multiplataforma |
| AC-005   | testes dos consumidores e typecheck           |
| AC-006   | auditoria nativa e gates completos            |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-034` implementada.
- Escopo autorizado: `SelectField`, seus testes, consumidores sem alteração de
  contrato, cobertura e documentação desta melhoria.

## Fora de escopo

- Busca dentro da lista ou seleção múltipla.
- Alterar opções de qualidade, fuso horário ou outros dados de produto.
- Adicionar dependência externa de select ou bottom sheet.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-24
- Decisão: melhoria solicitada e implementação autorizada.
