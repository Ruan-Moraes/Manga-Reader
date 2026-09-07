# Auditoria nativa — MOB-FEAT-035

Data: 2026-08-24

## Ambiente

- iOS Simulator, iPhone 17, iOS 26.5, tema escuro.
- Tela de configurações do leitor com scroll e safe area reais.
- Android avaliado por contrato nativo e testes; validação física permanece
  disponível ao usuário conforme informado na solicitação.

## Resultado observado

| Superfície     | Resultado                                                                   |
| -------------- | --------------------------------------------------------------------------- |
| Campo fechado  | largura integral; ícone, valor e chevron em uma linha estável               |
| Bottom sheet   | alça, cabeçalho fixo, seleção atual, close e lista com boa hierarquia       |
| Opções         | rádio, copy e check alinhados; seleção não depende apenas de cor            |
| Safe areas     | folha respeita o inset inferior e não conflita com o conteúdo ao fundo      |
| Acessibilidade | header, botão fechar, campo expandido e opções radio presentes na árvore AX |

## Contrato Android

- `Modal` usa `presentationStyle="overFullScreen"`,
  `navigationBarTranslucent`, `statusBarTranslucent` e animação `slide`.
- `onRequestClose` trata o back físico sem alterar a preferência.
- `SafeAreaView edges={['bottom']}` protege gestos e barra de navegação.
- Elevação Android e sombra iOS usam a mesma superfície e os tokens públicos.

## Resultado

Sem bloqueios no iOS. A implementação atende AC-001..AC-006; a verificação em
aparelho Android complementará a evidência visual, sem pendência funcional
conhecida.
