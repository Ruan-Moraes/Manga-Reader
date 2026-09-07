# Auditoria de layout — MOB-FEAT-036

Data: 2026-08-26

## Diagnóstico confirmado

O `ChoiceGroup` antigo não possuía indicador visual. Além disso, o
`ChoiceCards` das configurações centralizava o indicador contra o conjunto de
título e descrição; por isso o título aparecia acima do controle selecionável.

## Estrutura final

- Opções podem usar linha ou coluna no grupo conforme largura/font scale.
- Toda opção contém uma linha interna horizontal de largura protegida.
- O indicador possui 22×22, `flexShrink: 0`, anel e ponto selecionado.
- A copy possui `flexShrink: 1` e `minWidth: 0`, permanecendo sempre depois do
  indicador.
- Em font scale elevado, as opções empilham entre si sem alterar o eixo interno.
- Nos cards de configurações, preview/ícone, copy e rádio usam
  `alignItems: flex-start`; o indicador de 22×22 não encolhe e permanece
  alinhado à linha do título enquanto a descrição cresce abaixo dela.

## Compatibilidade

Não houve alteração da API, dos códigos de idioma, das preferências do leitor,
dos valores persistidos ou das ações dos consumidores. A árvore assistiva
continua expondo radiogroup, radio, selected e disabled.

## Resultado

Atende AC-001..AC-006 sem divergências conhecidas.
