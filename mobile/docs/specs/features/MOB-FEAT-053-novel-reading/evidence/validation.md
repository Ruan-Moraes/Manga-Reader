# Validação — MOB-FEAT-053

Data: 2026-09-10. Estado: verification-pending.

## Implementação e cobertura

- AC-001: escala textual independente, coluna 640 dp, safe areas, ilustração proporcional e barras sobrepostas. textReader.test e TextViewport.test.
- AC-002: feature configure-text-reader, seleção acessível, reset e traduções nos três idiomas. TextReaderControls.test e ContentReader.test.
- AC-003: envelope v4, normalização, migração v3 (além dos cenários legados existentes), restart, falha/retry e isolamento GET/PATCH/logout. settingsStore.test.
- AC-004: medidas nativas de células, captura de bloco/fração, reflow sem remount, fallback fora da janela e cancelamento por arraste. TextViewport.test simula fonte, entrelinha, margens, orientação e escala do sistema. Progresso pondera comprimento e fração; capítulo curto/fim = 100%.
- AC-005: fixture sintética localizada com 246 blocos, diálogos, títulos, separadores, imagem e parágrafos variados. Não representa catálogo nem integração de capítulos publicados.

## Inspeção iOS

iPhone 17, iOS 26.5, simulador. Metro recarregado antes da inspeção.

- [Padrão Nunito, leitura imersiva e ilustração](ios-default.png): margens, hierarquia e texto legíveis no retrato inspecionado.
- [Georgia e fundo escuro com barras](ios-serif-dark.png): escolha aplicada imediatamente, inclusive às barras; progresso textual 0% no início. Barras sobrepõem conteúdo sem deslocá-lo.
- Ação acessível Mostrar controles abre barras; painel expõe seleção de fonte, tamanho, entrelinha, margens, fundo e reset.
- Reset acionado nativamente: APP/18/COMFORTABLE/MEDIUM/APP restaurados; TAP_OR_SWIPE permaneceu selecionado.
- CUA scroll retornou `noWindowsAvailable`; não foi possível validar deslocamento longo ou a âncora por gesto físico. A inspeção de AX não equivale a uma sessão completa de VoiceOver.

## Gates

Typecheck e ESLint passaram durante implementação. Resultado final dos gates registrado no review.
A execução completa encontrou inicialmente um teste com seletor ambíguo “Papel”, agora presente em dois grupos independentes; o teste foi delimitado ao grupo original “Fundo”. Nenhum comportamento de imagens foi removido.

## Verificação pendente — TASK-006

- Matriz nativa em tela pequena/tablet, paisagem, fonte ampliada, alto contraste e Android.
- VoiceOver/TalkBack reais, gestos concorrentes e restauração de parágrafo longo após reflow fora da janela virtualizada.
- Capítulo longo no mesmo aparelho/build/cenário antes e depois: frames, fluidez e memória. Nenhuma medição comparável foi realizada; testes Jest não são benchmark.
- Reinício físico do aplicativo com preferências; persistência/restart já cobertos com storage mock.

Não declarar implemented enquanto estas evidências nativas estiverem abertas. Histórico de MOB-FEAT-051/052 preservado.
