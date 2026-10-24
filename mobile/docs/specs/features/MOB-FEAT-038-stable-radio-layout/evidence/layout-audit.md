# Auditoria de layout — MOB-FEAT-038

Data: 2026-08-26

## Diagnóstico

Cards, grupos simples, segmentos e opções do select alternavam a borda externa
entre 1 e 2 px. Em caixas com altura automática, a seleção ou o foco alterava a
medida final e deslocava o conteúdo subsequente.

## Estrutura final

- Todas as superfícies de rádio usam borda externa constante de 2 px.
- Seleção e foco mudam cor, fundo e ponto interno, não geometria.
- Grupos com descrição alinham a linha por `flex-start`.
- Indicadores usam tamanho fixo e `flexShrink: 0`.
- Copy usa `flex: 1` ou shrink controlado e `minWidth: 0`.
- Segmentos mantêm a mesma caixa antes e depois da seleção.

## Compatibilidade

Sem alteração de APIs, opções, callbacks, i18n ou persistência. Semântica de
radio, selected, disabled e radiogroup permanece equivalente.

## Resultado

Atende AC-001..AC-006 sem divergências conhecidas.
