# Auditoria de layout — MOB-FEAT-037

Data: 2026-08-26

## Diagnóstico visual

A captura fornecida mostra a descrição de “Marcar automaticamente como lido”
continuando sob o switch. O runtime correspondia ao `SwitchRow` com controle
absoluto e compensação manual por `paddingRight`.

## Estrutura final

- O posicionamento absoluto e a compensação manual foram removidos.
- Copy e switch são irmãos em um contêiner flexível.
- A copy usa `flex: 1` e `minWidth: 0`, portanto quebra antes do switch.
- O switch usa `flexShrink: 0`, reservando sua largura real no iOS e Android.
- Em font scale menor que 160%, o switch fica à direita e alinhado ao topo.
- Em font scale de 160% ou mais, o switch fica abaixo da copy e alinhado à
  direita, sem ocultar conteúdo.

## Compatibilidade

A API do componente, callbacks, valores, persistência e i18n permanecem
inalterados. A linha inteira continua acionável e o switch mantém label,
checked, disabled e foco.

## Resultado

Atende AC-001..AC-006 sem divergências conhecidas.
