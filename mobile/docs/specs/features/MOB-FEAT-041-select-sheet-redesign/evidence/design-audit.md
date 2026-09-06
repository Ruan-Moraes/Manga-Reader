# Auditoria de design — MOB-FEAT-041

Data: 2026-08-27

## Diagnóstico da referência enviada

- O primeiro refinamento fixou a folha em pelo menos 72% da viewport, deixando
  uma área vazia desproporcional em listas curtas.
- Card externo, cards internos, ícone ilustrativo e botão de fechamento com
  superfície competiam pela atenção.
- Anéis vazios repetidos davam peso visual desnecessário às opções não
  selecionadas.

## Estrutura final

- A folha usa base de 46%, máximo de 88% e teto de 720 pt/dp.
- A quantidade de opções aumenta a altura necessária até o máximo disponível;
  viewports baixas limitam o mínimo ao máximo calculado.
- Alça, título e fechamento transparente formam um cabeçalho fixo e conciso.
- A região rolável usa `flex: 1`; as opções formam uma lista contínua de 64
  pt/dp, com divisores discretos.
- Somente a opção selecionada apresenta check de 24 pt/dp em uma reserva fixa
  de 28 pt/dp, evitando desalinhamento.
- O gatilho usa somente valor e chevron.
- Borda constante preserva geometria em normal, foco, pressão e seleção.
- Safe area inferior, scrim e fechamento nativo permanecem preservados.

## Resultado

Atende AC-001..AC-005 sem divergências conhecidas.
