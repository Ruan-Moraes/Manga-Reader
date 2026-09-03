# Auditoria visual — MOB-FEAT-044

Data: 2026-08-31. Simulator iPhone 17, iOS 26.5, tema claro, pt-BR.
Inspeção por Computer Use, app real servido pelo Metro existente.

## Executado

- Fluxo reaberto com draft existente, sem importar, excluir ou reordenar páginas.
- Etapa 3/5: título preservado, dois campos empilhados, nota e confirmação sem
  rolagem no viewport inspecionado. Sem título secundário nem quadradinhos.
- Campos com fundo claro, borda, raio, seta discreta e nome legível.
  Evidência: `ios-fields.png`.
- Destino abre folha inferior; PT-BR primeiro, selecionado, com Recomendado como
  descrição acessível e visual. Sete idiomas visíveis, inclusive duas variantes
  de chinês; fechar devolve os campos. Evidência: `ios-target-sheet.png`.
- Escolher Japonês como destino mantém Japonês na origem, exibe erro e bloqueia
  confirmação sem persistir par inválido. Evidência: `ios-invalid-pair.png`.

## Achado e correção

O primeiro smoke mostrou labels e valores sem a superfície esperada: estilos
callback diretamente no Pressable não apareciam no iOS/NativeWind. A variante
input passou a aplicar a superfície em View dentro do render prop; os testes
verificam esse nó e a captura final confirma fundo, contorno e espaçamento.
A variante default e a folha existentes foram preservadas.

## Limitações explícitas

- `adb devices` executou após liberação da porta local do daemon, mas não havia
  dispositivo Android conectado. Não há validação visual Android nesta sessão.
- Dark mode, três locales, fonte confortável, movimento reduzido e callbacks
  assistivos têm evidência automatizada, mas falta a matriz visual nativa de
  temas/locales/fontes ampliadas/telas compactas e VoiceOver/TalkBack reais.
- A árvore AX comprova labels e estados, não a experiência completa de um leitor
  de tela. Testes com refs simuladas não comprovam temporização do foco nativo.
- A sessão compartilhada voltou a navegar no fluxo durante a auditoria; não se
  inferiu restauração ou aprovação visual a partir desse estado posterior.

Status: verification-pending. Não houve início de OCR, upload ou tradução.
