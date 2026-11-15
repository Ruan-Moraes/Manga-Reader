# Plano para o próximo chat — páginas não traduzidas e controles do leitor

Data: 11 de novembro de 2026

## Pedido e resultado esperado

No leitor de capítulos parcialmente traduzidos, distinguir páginas cuja tradução ainda não começou de páginas que realmente falharam. Uma página não iniciada deve apresentar uma indicação neutra e a ação **“Traduzir esta página”**, sem cores, ícones ou textos de erro. Uma falha comprovada deve continuar identificada como falha, com a opção adequada de tentar novamente.

Corrigir também o relato no Android: no modo paginado, após as barras superior e inferior desaparecerem, tocar na página às vezes não as faz reaparecer. O usuário precisa sair e entrar no leitor para recuperar as setas. As barras devem poder ser recuperadas conforme a preferência de gestos ativa, sem sair do leitor.

Este arquivo é um plano para implementação em outro chat. Nenhuma correção desses dois problemas foi realizada nesta etapa.

## Contexto e preservação

- O repositório tem trabalho não commitado extenso, inclusive alterações do gateway, diagnóstico, fila durável e tradução em segundo plano. Execute `git status` e preserve tudo; não faça reset, limpeza ou formatação global.
- Leia `AGENTS.md`, `mobile/README.md`, as instruções SDD e as specs MOB-FEAT-052, MOB-FEAT-055, MOB-FEAT-063 e MOB-FEAT-066 relevantes. Confira o código e o estado atual antes de editar; o repositório prevalece sobre este plano.
- Mantenha o consentimento, o armazenamento privado, a tradução uma página por vez e a proteção contra reenvio automático de tentativas incertas. Não apague dados do aplicativo nem peça desinstalação.
- O processamento em segundo plano e as notificações da 066 estão em verificação. O APK de teste entregue anteriormente é `toonlira-android-stopping-test.apk`; não suponha que o fluxo nativo completo já foi aprovado.

## 1. Páginas não traduzidas, falhas e estado incerto

1. Reproduzir com um capítulo parcialmente traduzido que contenha pelo menos uma página nunca enviada, uma página traduzida, uma falha real e uma tentativa de resultado incerto. Investigar a relação entre `translation_pages.status`, a última tentativa e o progresso do lote; não presumir que `FAILED` sozinho prove que aquela página foi enviada. Considerar também interrupções antes do envio e páginas pendentes quando outro lote termina.
2. Examinar `mobile/src/widgets/remote-processing/ui/PageRetryIndicator.tsx`, `model/useChapterBatch.ts`, `model/chapterBatch.ts` e a montagem do leitor em `mobile/src/pages/offline-translation/ui/LocalTranslationReaderPage.tsx`. Hoje o indicador usa elementos visuais de perigo e texto de retry para páginas elegíveis; seu efeito também observa `batch.running` globalmente. Verificar se isso pode marcar como falha uma página que não participou da execução.
3. Modelar a apresentação a partir de evidência efetiva por página:
   - **Não iniciada:** mostrar “Página não traduzida” e ação “Traduzir esta página”; usar ícone e cores neutros, sem alusão a erro ou repetição.
   - **Em andamento:** indicar processamento apenas da página pertinente.
   - **Falha comprovada:** manter mensagem e tratamento de falha, com ação para tentar novamente, sujeita ao consentimento existente.
   - **Resultado incerto:** conservar apresentação de incerteza e consulta ao recibo; não reenviar automaticamente.
   - **Traduzida:** remover o indicador após validar e salvar o resultado privado.
4. Alterar textos e rótulos acessíveis em `pt-BR`, `en-US` e `es-ES`. Manter a aparência coerente com os tokens de tema, tamanhos de toque e leitores de tela.
5. Adicionar regressões em `PageRetryIndicator.test.tsx` e testes de modelo necessários: primeira tradução envia somente a página escolhida após consentimento; falha real continua distinta; página não enviada não vira falha ao encerrar outro lote; estado incerto não é reenviado; sucesso remove o indicador. Evitar usar mídia real ou chamadas pagas nos testes automatizados.

## 2. Barras desaparecidas no modo paginado

1. Reproduzir no Android, anotando preferência de controles, navegação por toque lateral, tipo de ajuste da imagem e se a página cabe na tela ou permite rolagem. Abrir um capítulo, esconder as barras, tocar na área apropriada e confirmar se elas voltam sem sair do leitor. Repetir após trocar páginas e após bloquear/desbloquear o aparelho.
2. Investigar `mobile/src/widgets/content-reader/model/useReaderInteraction.ts`, `readerInteraction.ts`, `ui/ContentReader.tsx`, `ui/ImageViewport.tsx`, `ui/ZoomableSurface.tsx` e `ui/ReaderRevealGesture.tsx`. Verificar entrega de toques, concorrência com pinch/pan, estados de drag/momentum, cancelamento e desmontagem/troca da viewport paginada. O uso de `ScrollView` mesmo quando a imagem cabe e estados de movimento sem evento final são hipóteses, não causas comprovadas.
3. Corrigir a causa demonstrada, preservando os modos e contratos da MOB-FEAT-052: toque e/ou gesto conforme a preferência, navegação lateral e RTL, zoom, leitores de tela, páginas altas que precisam de rolagem e comportamento no modo vertical. Garantir que o leitor não fique permanentemente bloqueado por estado de interação obsoleto.
4. Adicionar regressões que reproduzam a sequência exata encontrada: ocultar, interação paginada, toque de recuperação, visualização das duas barras e navegação pelas setas. Cobrir eventos de movimento cancelados ou incompletos se forem a causa, troca de página e ciclo background/foreground; manter os testes existentes de momentum, zoom e modos de gesto.

## 3. Verificação e entrega

- Rodar testes direcionados do indicador, do modelo de interação, da viewport e do `ContentReader`; rodar `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` e `pnpm check` em `mobile` conforme aplicável. Registrar falhas preexistentes em vez de atualizar checksums históricos sem revisão. Na última rodada, `pnpm check` tinha 17 checksums de reviews divergentes e havia divergências de formatação.
- Validar no Android físico quando disponível: capítulo misto, página nunca enviada, falha verdadeira, estado incerto, controles no modo paginado, setas, imagem alta, rotação se suportada, e recuperação após interrupção. Registrar o que só foi testado em emulador ou testes unitários; não declarar prova física sem observá-la.
- Atualizar specs, tasks, review, drift, coverage e evidências conforme o fluxo SDD e os resultados reais; não concluir features com evidência obrigatória pendente.
- Após validação suficiente, gerar APK de teste com a configuração atual do gateway e a assinatura compatível com o app instalado; conferir pacote, assinatura, URL e hash. Entregar um arquivo com nome novo e, se o acesso ao Drive estiver disponível, usar o Drive do usuário conforme a autorização anterior, sem substituir ou remover arquivos existentes. Informar claramente limitações de teste e pedir instalação sobre o app existente, sem apagar dados.

## 4. Melhorias adicionais nas telas de capítulos e importação

As cinco imagens foram reenviadas e permanecem apenas em Downloads, conforme pedido do usuário. A numeração anterior referia-se à descrição oral e difere da ordem dos anexos. Consulte os arquivos diretamente; não os copie para o projeto:

1. [Lista de capítulos](</Users/ruanmoraes/Downloads/WhatsApp Unknown 2026-11-11 at 08.18.18/WhatsApp Image 2026-11-11 at 08.18.05.jpeg>) — seção “lista de capítulos” abaixo.
2. [Vincular capítulo à obra](</Users/ruanmoraes/Downloads/WhatsApp Unknown 2026-11-11 at 08.18.18/WhatsApp Image 2026-11-11 at 08.18.07 (1).jpeg>) — seção “vincular capítulo” abaixo.
3. [Fila de tradução](</Users/ruanmoraes/Downloads/WhatsApp Unknown 2026-11-11 at 08.18.18/WhatsApp Image 2026-11-11 at 08.18.07.jpeg>) — seção “lista de páginas durante a tradução” abaixo.
4. [Ações da revisão de ordem](</Users/ruanmoraes/Downloads/WhatsApp Unknown 2026-11-11 at 08.18.18/WhatsApp Image 2026-11-11 at 08.18.08 (1).jpeg>) — seção “revisão da ordem” abaixo.
5. [Resumo da etapa de idiomas](</Users/ruanmoraes/Downloads/WhatsApp Unknown 2026-11-11 at 08.18.18/WhatsApp Image 2026-11-11 at 08.18.08.jpeg>) — seção “exibição das imagens” abaixo; o resumo mostra 33 páginas, mas apenas cinco miniaturas.

As imagens são referências de interface; conferir o estado atual do aplicativo antes de implementar. Os caminhos dependem de os arquivos permanecerem em Downloads.

### Lista de capítulos da obra — imagem 1

- Reorganizar cada item para que título, status, página onde a leitura parou, ação principal **Continuar** ou **Ler** e menu de três pontos tenham hierarquia clara e não se sobreponham. Verificar telas estreitas, texto ampliado, temas e acessibilidade.
- Corrigir o estado mostrado para um capítulo cuja tradução começou e foi interrompida: não apresentar **Aguardando**. Na lista de capítulos, preferir **Incompleto**, pois informa que há trabalho ainda não traduzido independentemente do motivo da interrupção. Preservar distinção de falhas reais quando houver evidência e não alterar dados históricos indevidamente.
- Validar a página de leitura exibida e a escolha entre **Ler** e **Continuar** com o progresso realmente salvo. Testar capítulo ainda não iniciado, parcialmente traduzido, concluído e com erro.

### Lista de páginas durante a tradução — imagem 3

- Reorganizar a linha de cada página: miniatura real, número, estado da tradução, posição/estado na fila e ação **Tentar novamente** quando cabível. A imagem mostra páginas com selo “na fila” e subtítulo “Traduzindo...”; distinguir páginas aguardando daquela efetivamente em processamento. A ação de erro deve continuar legível e utilizável sem desalinhamento ou sobreposição.
- Exibir miniaturas reais das páginas locais, com carregamento eficiente e estados adequados quando uma imagem não puder ser carregada; não expor caminhos privados.
- Remover dessa terceira etapa a frase no rodapé “Nada sai do aparelho até você aceitar o envio”. Antes de removê-la, confirmar que o aviso adequado e o consentimento explícito são apresentados nas etapas anteriores; se não forem, apresentá-los no momento apropriado antes de qualquer envio, mantendo as informações exigidas sobre processamento remoto.
- Manter a ação de cancelar fixa e acessível enquanto a lista rola, sem exigir que a pessoa chegue ao fim da lista. Preservar o comportamento autorizado de interrupção, distinguindo cancelamento imediato de parada após a página atual quando aplicável.
- Na lista de páginas, mostrar **Cancelado** para o que foi efetivamente cancelado; na lista de capítulos, usar **Incompleto** quando restarem páginas sem tradução. Uma página em voo com resultado incerto deve permanecer identificada como incerta até reconciliação, sem ser rotulada falsamente como cancelada e sem reenvio automático.
- Testar cancelamento durante envio e antes do envio, resultado incerto, erro real, retomada, longas listas, rolagem, acessibilidade e consentimento.

### Vincular capítulo a uma obra — imagem 2

- Substituir a bolinha de seleção pela imagem/capa da obra em cada item, mantendo um indicador acessível e inequívoco de qual obra está selecionada. Tratar obras sem capa com fallback apropriado.
- Adicionar um campo de busca para localizar rapidamente a obra desejada. Definir e testar busca por título, inclusive sem resultados, limpeza, acentos e preservação da seleção conforme o fluxo existente.
- Verificar listas grandes, desempenho, navegação por teclado/leitor de tela e textos nos três idiomas.

### Exibição das imagens no resumo de idiomas — imagem 5

- Exibir **todas as imagens selecionadas**, removendo qualquer limite visual arbitrário de cinco. A quantidade visível deve acompanhar o espaço disponível e a rolagem, sem truncar a coleção.
- Usar lista ou grade virtualizada: carregar os itens visíveis e uma janela limitada de pré-carregamento, liberando ou reciclando os que saem da janela segundo os mecanismos da plataforma. Não presumir um número fixo de itens visíveis; observar memória e desempenho com coleções grandes.
- Preservar ordem, seleção, redimensionamento e identificação acessível das páginas. Cobrir mais de cinco imagens e rolagem em testes e validar memória em aparelho quando possível.

### Revisão da ordem — imagem 4

- Mover a orientação **“Revise a ordem e confirme quando estiver pronto”** para o topo, de modo que apareça antes da lista.
- Fixar as ações **Limpar e recomeçar** e **Confirmar a ordem** juntas no rodapé, preferencialmente lado a lado. Adaptar o layout para telas pequenas ou fonte ampliada sem cortar o texto, mantendo ambas acessíveis durante a rolagem.
- Preservar o fluxo e eventual confirmação de limpeza, a ordem dos itens e os dados existentes; testar rolagem longa, reordenação, confirmação, cancelamento da limpeza e acessibilidade.

## 5. Integração e critérios gerais das novas telas

- Localizar as telas, estados e componentes existentes antes de implementar; conferir specs e workflow SDD aplicáveis e registrar alterações de intenção conforme a política do projeto.
- Atualizar traduções em português, inglês e espanhol; usar tokens visuais e componentes do projeto. Adicionar testes de regressão para os estados e ações descritos, sem testes que apenas espelhem a implementação.
- Repetir os gates e registrar evidências conforme a seção 3. Incluir revisão visual e funcional em Android físico quando disponível, especialmente com muitos itens, e manter pendente qualquer evidência ainda não observada.

## 6. Acesso e controle do modo desenvolvedor

- Substituir o desbloqueio atual de sete toques na versão por esta sequência: **sete toques, aguardar cinco segundos, mais sete toques, aguardar cinco segundos e, por fim, um toque** na versão do aplicativo. O modo só deve ser desbloqueado após completar a sequência.
- Definir o estado da sequência de modo explícito e testável: os períodos de espera devem exigir pelo menos cinco segundos; toques prematuros, interrupções e saída da tela devem ter comportamento seguro e previsível, sem desbloqueio acidental. Preservar o controle de acesso já existente e não armazenar segredos no aplicativo.
- Na página de configurações/sobre, substituir a opção visual de navegação com seta por um controle integrado ao design da página, que permita **habilitar ou desabilitar** o modo desenvolvedor diretamente depois de desbloqueado. O estado deve ser claro, acessível e persistido conforme o mecanismo existente de configuração de desenvolvedor. Verificar o comportamento de usuários que já desbloquearam ou ativaram o modo para não perder preferências inesperadamente.
- Todo conteúdo que já deriva do modo desenvolvedor deve continuar seguindo esse controle; ao desabilitar, ocultar os recursos e detalhes exclusivos de desenvolvimento de acordo com o contrato existente.
- Incluir textos e acessibilidade em `pt-BR`, `en-US` e `es-ES`, testes com relógio simulado para a sequência completa, esperas, toques antecipados, interrupção e habilitação/desabilitação, além de validação visual e funcional em Android quando disponível. Atualizar as specs e evidências aplicáveis.

## Resultado da implementação

- Mobile: 169 suítes e 1.278 testes aprovados. TypeScript, ESLint e FSD passaram. O `pnpm check` encontra os 17 checksums históricos divergentes. A checagem de formatação ainda encontra divergências sem reformatação global.
- Backend: reactor Maven passou com zero falhas e zero erros após iniciar o MongoDB local. TypeScript e FSD do web passaram.
- Android API 37: atualização sobre a assinatura anterior, importação de oito imagens sintéticas, rolagem até a última miniatura, busca sem resultados, fila local, consentimento e recusa. No leitor, recuperação das duas barras por toque, setas, página alta e ciclo de bloqueio/desbloqueio. Em Sobre, desbloqueio e persistência do switch.
- APK `artifacts/toonlira-android-reader-flow-test.apk` com pacote `com.toonlira.app`, versão `1.0.0` (código 1), certificado do APK de teste anterior e origem HTTPS vigente. SHA-256 `81f37c7950255e46609fb3546a497656f25d3d6f64e1ccc9eb969c7818354a6e`.
- A matriz de Android físico e a validação de tradução real continuam abertas. Os testes de falha, cancelamento e resultado incerto usaram transporte simulado.
