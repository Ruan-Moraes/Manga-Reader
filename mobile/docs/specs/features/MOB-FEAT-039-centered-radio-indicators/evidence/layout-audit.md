# Auditoria de layout — MOB-FEAT-039

Data: 2026-08-26

## Diagnóstico

`ChoiceCards`, `ChoiceGroup` e as opções de `SelectField` alinhavam a linha por
`flex-start`. Com duas linhas de copy, o indicador permanecia próximo ao topo e
a diferença era especialmente perceptível no Android. `SegmentedControl` já
usava o centro vertical.

## Estrutura final

- As quatro variantes usam `alignItems: 'center'` na linha do rádio.
- Não existe offset vertical específico para Android ou iOS.
- Indicadores permanecem com tamanho fixo e `flexShrink: 0`.
- Copy continua flexível, com título e descrição na mesma coluna.
- Bordas permanecem constantes em 2 px entre todos os estados.

## Resultado

Atende AC-001..AC-005 sem divergências conhecidas.
