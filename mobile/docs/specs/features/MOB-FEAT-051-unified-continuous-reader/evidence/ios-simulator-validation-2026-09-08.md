# Evidência — iOS Simulator — MOB-FEAT-051

- Data: 2026-09-08
- Ambiente: iPhone 17, iOS 26.5, Expo desenvolvimento
- Projeto local: seis páginas, resultado `DEMO`

## Cenários executados

1. A entrada de desenvolvimento abriu o preview textual e expôs heading,
   paragraphs, dialogue/speaker e divider no fluxo contínuo, sem controles de
   imagem.
2. O projeto local abriu no modo vertical restaurado, com múltiplos itens
   montados, tradução demonstrativa sobre a imagem e badge `DEMONSTRAÇÃO`.
3. A barra inferior apresentou posição, `Ver original` e configurações após
   correção do botão que ainda ocupava largura integral.
4. `Ver original` removeu todos os overlays visíveis, mudou a ação para
   `Ver resultado` e preservou `Página 3 de 6`.
5. As configurações contextuais abriram sobre o leitor e mostraram Vertical
   selecionado, além dos controles de imagem existentes.

## Limites da evidência

- A árvore de acessibilidade comprovou fluxo, controles, estado e conteúdo; a
  largura exata/proporção também permanece coberta por testes puros/RNTL.
- Esta execução não mede frames nem memória e não substitui os cenários nativos
  10/67/200.
- A implementação nova ainda não foi revalidada no Android físico.
