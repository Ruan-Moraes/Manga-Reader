# Auditoria de layout — MOB-FEAT-040

Data: 2026-08-26

## Diagnóstico

O wrapper anterior dependia somente da medida intrínseca do `Switch`. No iOS,
o desenho nativo podia ultrapassar a largura efetivamente reservada pelo Yoga,
permitindo que título ou descrição aparecessem sob o controle.

## Estrutura final

- A coluna do controle reserva explicitamente 52 pt/dp e não encolhe.
- A copy horizontal usa basis zero, grow e shrink, sempre com `minWidth: 0`.
- O switch horizontal fica centralizado em relação ao bloco de copy.
- No modo empilhado, a copy ocupa 100% e o controle permanece à direita.
- A borda externa permanece com 2 px em todos os estados.
- Não há posição absoluta nem offset exclusivo de plataforma.

## Resultado

Atende AC-001..AC-005 sem divergências conhecidas.
