# Revisão tela a tela: design e performance

Vamos percorrer cada tela do app mobile, uma de cada vez, e resolver os problemas de design e de performance que aparecerem nela. Cada passagem termina com a tela corrigida, verificada no simulador e registrada na tabela de acompanhamento abaixo.

Este plano é informativo e define a ordem e o método do trabalho. Os critérios de design e de medição de FPS ficam no [roteiro de auditoria de design](auditoria-design-mobile.md), e os achados consolidados ficam no [resultado da auditoria](auditoria-design-mobile-resultado.md). Uma correção que muda comportamento, como uma ação nova, um fluxo diferente ou uma regra de estado, precisa de uma Target Spec aprovada antes do código, como define o [`AGENTS.md`](../../AGENTS.md). Ajustes só visuais seguem direto.

## Como percorrer uma tela

1. **Abrir no simulador.** Usar dados de teste realistas, com títulos longos, várias páginas, falhas, lista vazia e lista cheia. Capturar os estados relevantes antes da mudança.
2. **Levantar problemas de design.** Hierarquia de texto, espaçamento, alinhamento, consistência com o kit em `shared/ui`, estados vazios, de carregamento e de erro, feedback de toque, tema claro e escuro, fonte ampliada e os três idiomas.
3. **Levantar problemas de performance.** Renderizações desnecessárias, listas sem virtualização, imagens sem cache ou sem tamanho, trabalho síncrono no carregamento, telas vazias enquanto esperam a rede, animações fora do driver nativo e rolagem com quadros perdidos.
4. **Apresentar o plano e aguardar aprovação.** Mostrar ao usuário os problemas levantados e as correções propostas, separando o que é só visual do que muda comportamento. Nenhum código da tela é alterado antes da aprovação explícita, e a aprovação de uma tela não vale para a próxima. A meta da revisão fica em [`REVISAO-TELA-A-TELA-META.md`](../../../REVISAO-TELA-A-TELA-META.md).
5. **Corrigir pela origem.** Quando o problema vem de um componente compartilhado, corrigir em `shared/ui` e conferir os outros consumidores. Respeitar FSD, tokens de tema e i18n nos três idiomas.
6. **Verificar.** Rodar `pnpm typecheck`, os testes da área, `pnpm lint:fsd` e o Prettier nos arquivos tocados. Conferir o resultado no simulador. A performance é medida em build release no aparelho físico, conforme a seção 3 do roteiro de auditoria.
7. **Registrar.** Atualizar a linha da tela na tabela com o status, o que mudou e o que ficou pendente.

## Ordem das telas

A ordem segue o caminho mais usado: primeiro o fluxo de tradução local, depois a biblioteca e o leitor, por fim conta, configurações e plataforma.

| #   | Tela                                                       | Arquivo                                                                | Design                        | Performance                   | Observações                                                      |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| 1   | Seletor de módulos                                         | `pages/launcher/ui/ModuleSelectorPage.tsx`                             | feito                         | feito, sem verificação física | Ver "Já feito". Imagem menor com fonte ampliada depende de spec. |
| 2   | Traduzir capítulo: importar, organizar, idiomas, validação | `pages/offline-translation/ui/OfflineTranslationPage.tsx`              | feito                         | feito, sem verificação física | Ver "Já feito". HEIC rejeitado depende de spec.                  |
| 3   | Traduzir capítulo: etapa 3 (lote, destino, falhas)         | `pages/offline-translation/ui/OfflineTranslationPage.tsx`              | feito                         | feito                         | Ver "Já feito" e "Pendências conhecidas".                        |
| 4   | Biblioteca de traduções                                    | `pages/offline-translation/ui/LocalTranslationLibraryPage.tsx`         | feito                         | feito, sem verificação física | Ver "Já feito". Lista sem virtualização ficou para depois.       |
| 5   | Obra                                                       | `pages/offline-translation/ui/LocalWorkPage.tsx`                       | feito                         | feito, sem verificação física | Ver "Já feito". "Ler" sem páginas prontas depende de spec.       |
| 6   | Gerenciar obra                                             | `pages/offline-translation/ui/LocalWorkManagePage.tsx`                 | feito                         | feito, sem verificação física | Ver "Já feito".                                                  |
| 7   | Leitor de resultado local                                  | `pages/offline-translation/ui/LocalTranslationReaderPage.tsx`          | feito                         | feito, sem verificação física | Ver "Já feito". Capítulo de obra (setas, fim) não conferido.     |
| 8   | Leitor de capítulos da plataforma                          | `pages/reader/ui/ReaderPage.tsx`                                       | feito, sem verificação física | feito, sem verificação física | Ver "Já feito". Sem backend local: capítulo real não conferido.  |
| 9   | Prévia de novel (dev)                                      | `pages/reader/ui/NovelReaderPreviewPage.tsx`                           | feito, sem verificação física | feito, sem verificação física | Sem mudanças; não aberta no simulador.                           |
| 10  | Entrar                                                     | `pages/login/ui/LoginPage.tsx`                                         | feito                         | feito, sem verificação física | Login real não testado: backend local desligado.                 |
| 11  | Cadastro                                                   | `pages/register/ui/RegisterPage.tsx`                                   | feito                         | feito, sem verificação física | Cadastro real não testado: backend local desligado.              |
| 12  | Recuperar senha                                            | `pages/forgot/ui/ForgotPage.tsx`                                       | feito                         | feito                         | Envio real não testado: backend local desligado.                 |
| 13  | Configurações (índice)                                     | `pages/settings-index/ui/SettingsIndexPage.tsx`                        | feito                         | feito                         |                                                                  |
| 14  | Aparência                                                  | `pages/settings-appearance/ui/SettingsAppearancePage.tsx`              | feito                         | feito                         |                                                                  |
| 15  | Leitor (ajustes)                                           | `pages/settings-reader/ui/SettingsReaderPage.tsx`                      | feito                         | feito                         |                                                                  |
| 16  | Idiomas de conteúdo                                        | `pages/settings-content-languages/ui/SettingsContentLanguagesPage.tsx` | feito, sem verificação física | feito                         | Editor não visto: exige login.                                   |
| 17  | Idioma do app                                              | `pages/settings-locale/ui/SettingsLocalePage.tsx`                      | feito                         | feito                         |                                                                  |
| 18  | Privacidade                                                | `pages/settings-privacy/ui/SettingsPrivacyPage.tsx`                    | feito, sem verificação física | feito, sem verificação física | Painel exige login; visto só o aviso.                            |
| 19  | Dados                                                      | `pages/settings-data/ui/SettingsDataPage.tsx`                          | feito                         | feito                         |                                                                  |
| 20  | Sobre                                                      | `pages/settings-about/ui/SettingsAboutPage.tsx`                        | feito                         | feito                         |                                                                  |
| 21  | Status da plataforma                                       | `pages/launcher/ui/PlatformStatusPage.tsx`                             | feito, sem verificação física | feito, sem verificação física | Exige login; revista pelo código.                                |
| 22  | Plataforma: início, biblioteca, fórum, perfil              | `pages/home`, `pages/library`, `pages/forum`, `pages/profile`          | feito, sem verificação física | feito, sem verificação física | Abas não expostas; revista pelo código.                          |
| 23  | Modal e rota inexistente                                   | `pages/modal`, `pages/not-found`                                       | feito                         | feito                         | Modal removido; `/modal` cai na 404.                             |

Status possíveis: `pendente`, `em andamento`, `feito`, `feito, sem verificação física`.

## Já feito

Passagens de design na etapa 3 do fluxo de tradução, em 2026-11-13. Type-check e testes passaram em todas; nada foi commitado ainda.

- **Projeto preparado no aparelho** (`features/create-translation-project`): o texto solto virou um cartão com ícone de escudo, descrição em cinza e um rodapé com páginas, idiomas e estado.
- **Modal de falha parcial** (`widgets/remote-processing/ui/ChapterBatchPanel.tsx`): ganhou ícone de alerta, a descrição foi separada e as páginas com problema aparecem numa lista com etiquetas de estado. O aviso de cópia ganhou ícone e cor. O texto copiado não mudou.
- **Folha "Salvar em"** (`pages/offline-translation/ui/SaveDestination.tsx`): a busca ganhou ícone e botão de limpar (nova chave `clearSearch` nos três idiomas). "Sem obra" ficou separada das obras, sem linha quando a lista está vazia. A seleção agora usa borda e círculo marcado, e o estado vazio ficou centralizado com ícone.
- **Carregamento da etapa 3** (`widgets/remote-processing/ui/ChapterBatchPanel.tsx`): enquanto o projeto e as capabilities do gateway carregam, o cartão do capítulo agora vem seguido de um indicador com "Verificando o serviço de tradução…" (`LoadingBlock`, nova chave `batch.loading` nos três idiomas), em vez de a tela ficar só com o cartão. Vale também para a folha de nova tentativa. Coberto por teste. No simulador o gateway respondeu rápido, então só o estado carregado foi conferido.
- **Performance do lote** (`widgets/remote-processing/model/useChapterBatch.ts`): o estado de cada página vinha de buscas lineares (`find`/`includes`) repetidas várias vezes por página a cada renderização, o que deixava cada atualização do lote quadrática em capítulos longos. Agora usa índices (`Map`/`Set`) montados uma vez por mudança, e o painel e o indicador de nova tentativa usam `isEligible`. Sem mudança visível; os 114 testes do lote passaram iguais.
- **MOB-FEAT-067 vista no simulador** (gateway apontado para um endereço que recusa conexão, depois restaurado): aparece "O processamento remoto está indisponível ou desativado." com "Tentar novamente", "Traduzir" fica desativado e uma nova falha devolve a ação. O sucesso da nova consulta fica coberto por teste.
- **Folha "Salvar em", segunda passagem** (`pages/offline-translation/ui/SaveDestination.tsx`, pedido direto com captura): a lista de obras não ocupa mais toda a altura, então "Número ou nome do capítulo" fica logo abaixo da obra escolhida; saiu o rótulo "Buscar obras" que repetia o placeholder (continua para leitores de tela); todas as opções viraram cartões iguais, com a escolhida em destaque e o título "Suas obras" (nova chave `offline.flow3.yourWorks`) no lugar da linha; "Sem obra" ganhou ícone próprio e as obras sem capa um ícone de livro. Conferido no simulador.
- **Espaçamento do header padronizado** (pedido direto, 2026-11-14): antes havia quatro espaços diferentes acima do header (0, 4, 8 e 16) e três entre o header e o conteúdo (16, 32 e 48), então o voltar mudava de altura entre as telas. Agora o `NavigationHeader` (`shared/ui`) define os dois: 8 acima (`spacing.sm`) e 16 abaixo (`spacing.md`). O `ScreenScaffold` e as telas que usam o header direto (Configurações, Status da plataforma, Entrar, Cadastro, Recuperar senha, Perfil, Leitor e 404) não somam espaço próprio no topo. O espaço entre seções (`layout.sectionGap`) passa a contar só abaixo do header; com `belowHeader`, as etapas continuam a 4 do header e o conteúdo a 16 delas. Teste em `sharedUi.test.tsx`. Falta conferir no simulador.

**Tela 1, Seletor de módulos** (2026-11-13, plano aprovado):

- **Títulos com fonte muito ampliada** (`shared/ui/AppText.tsx`): os papéis `display` e `title` param de crescer em 2× a fonte do sistema. Acima disso, palavras partiam no meio ("Toonlir / a"). O corpo continua crescendo livre, e os 200% da MOB-FEAT-057 seguem valendo. Vale para os títulos de todas as telas.
- **Imagem de destaque decorativa** (`pages/launcher/ui/EditorialHero.tsx`): saiu a descrição fixa em português e a imagem ficou oculta também para o TalkBack.
- **Imagens de destaque em WebP**: `launcher-hero` e `launcher-hero-light` caíram de cerca de 2,4 MB para cerca de 250 KB cada, sem mudar a resolução. A prévia de novel usa o mesmo arquivo.
- Conferido no simulador nos dois temas, em fonte normal e na máxima. Falta medir a abertura em build release no aparelho físico.

**Tela 2, Traduzir: importar, organizar, idiomas e validação** (2026-11-13, plano aprovado):

- **Linha solta na correção** (`features/validate-local-media`): o botão principal ficava num bloco com borda em cima, mas é desenhado no rodapé fixo; sobrava só a borda. A borda saiu.
- **Ações da página com problema com texto**: "Ver problema" e "Substituir" (chaves `viewIssue` e `replaceShort` nos três idiomas), no lugar dos dois ícones sem rótulo.
- **Resumo da validação menor**: "5 prontas · 1 com problema" passou do tamanho de título para o de rótulo.
- **Miniaturas da validação só em memória**: deixaram de ser gravadas no cache em disco, como nas outras telas do fluxo.
- **Modo Lista compacto** (`features/review-local-media-import`): miniatura de 60 pt, título em tamanho de rótulo e lixeira centralizada; a linha caiu de cerca de 130 pt para cerca de 93 pt.
- **"Limpar e recomeçar" discreto**: virou ação de texto abaixo do botão principal, que ocupa a largura toda.
- **Progresso ao abrir a galeria** (`features/import-local-media`): o botão do rodapé mostra o indicador enquanto a galeria do sistema abre.
- Conferido no simulador nos dois temas com 6 páginas, uma rejeitada. O indicador da galeria foi conferido só por teste.

**Tela 4, Biblioteca de traduções** (2026-11-13, plano aprovado):

- **Uma consulta em lote em vez de uma por página** (`entities/remote-processing-attempt`, `widgets/local-translation-library`): a contagem de páginas com falha buscava a última tentativa de cada página não pronta em sequência, a cada volta à tela. Agora `listLatestByPages` traz todas numa consulta só (em blocos de 500), usando o índice único `(page_id, attempt_number)`. Resultado igual, coberto por teste com SQLite real.
- **Carga única ao abrir** (`pages/offline-translation/ui/LocalTranslationLibraryPage.tsx`): a estante carregava ao montar e de novo no primeiro foco. Agora o foco só recarrega ao voltar para a tela.
- **Nomes dos idiomas**: "Japonês → Português (Brasil)" no lugar de "ja → pt-BR", nos três idiomas.
- **"Nova obra" compacta sem obras**: faixa de 64 pt na largura toda em vez do tile 2:3 de meia largura; com obras, continua na grade.
- **Hora no título dos capítulos sem obra**: "Capítulo de 13/11/2026, 07:38" distingue capítulos do mesmo dia.
- Conferido no simulador nos dois temas com 6 capítulos sem obra.

**Tela 5, Obra** (2026-11-13, plano aprovado):

- **Carga única ao abrir** (`pages/offline-translation/ui/LocalWorkPage.tsx`): mesmo ajuste da biblioteca, com `useScreenRefocus`.
- **Título do cabeçalho fora dos botões** (`shared/ui/NavigationHeader.tsx`): o título reserva dos dois lados a largura do lado mais largo (voltar ou ações) e vai até 2 linhas. Antes ocupava 68% fixos e, com dois botões à direita, encostava na engrenagem. Vale para todas as telas com esse cabeçalho.
- **Nomes dos idiomas no resumo da obra**: helper `useLanguageNames` compartilhado com a biblioteca.
- **"Capítulo N" para nomes numéricos**: "1" aparece como "Capítulo 1" (nova chave `work.chapterNumbered` nos três idiomas); nomes com texto seguem iguais.
- **Menu do capítulo "⋯"**: igual ao da biblioteca e dos cartões de obra.
- Conferido no simulador nos dois temas com uma obra de nome longo e um capítulo.

**Tela 6, Gerenciar obra** (2026-11-13, plano aprovado):

- **Nomes dos idiomas no resumo** (`widgets/local-translation-library/ui/WorkManage.tsx`), com o `useLanguageNames` da tela 5.
- **Nome da obra numa linha na linha "Nome"**: nova opção `metaNumberOfLines` no `ListRow` (padrão 2, outras telas iguais); aqui 1, porque o nome completo já aparece no topo e na folha de renomear.
- Sem problema de performance próprio: a carga da biblioteca inteira é o mesmo padrão da tela 5, deixado de fora.
- Conferido no simulador nos dois temas com a obra de nome longo.

**Tela 7, Leitor de resultado local** (2026-11-13, plano aprovado):

- **Sem filtro de saturação a 100%** (`widgets/content-reader/ui/ImageSurface.tsx`): a camada de filtro só entra quando a saturação muda; antes toda página tinha uma camada extra mesmo sem efeito.
- **Páginas locais só em memória**: o leitor deixou de copiar as páginas locais para o cache em disco (ajustado na tela 8 para manter o disco nas páginas do servidor).
- **Barra de status some na leitura imersiva** (`ContentReader.tsx`): esconde junto com os controles e volta com eles. Vale também para o leitor da plataforma e a prévia de novel.
- **Título de capítulo sem obra**: "Capítulo de 12/11/2026" com "Sem obra" na linha de baixo, em vez de "Leitor local". A hora ficou de fora porque a barra do leitor tem uma linha só e cortava o título.
- **Aviso "Nenhum texto…" dentro do painel inferior** (slot `statusContent`): aparece com os controles; na leitura imersiva a página usa a tela toda.
- Conferido no simulador nos dois temas, com e sem controles, num capítulo sem obra com 5 páginas prontas.

**Tela 8, Leitor de capítulos da plataforma** (2026-11-13, plano aprovado):

- **Cache por origem da imagem** (`widgets/content-reader/ui/ImageSurface.tsx`, `readerCachePolicy`): arquivos locais só em memória; páginas do servidor em memória e disco. Corrige a mudança da tela 7, que faria um capítulo da plataforma ser baixado de novo a cada abertura.
- **"Continuar de onde parou?" na mesma moldura dos outros estados** (`pages/reader/ui/ReaderPage.tsx`): área segura e botão de voltar visível; antes a única saída era o gesto do sistema.
- Sem problema de performance próprio: a consulta do capítulo já usa o cache de 5 minutos e o progresso é gravado em lote a cada 350 ms.
- Sem backend local: só o estado de erro foi visto no simulador; o capítulo real e a escolha de retomada ficaram cobertos por teste.

**Tela 9, Prévia de novel** (2026-11-13): analisada pelo código, sem mudanças. Documento curto, textos nos três idiomas e ilustração já em WebP; herda as mudanças do leitor das telas 7 e 8. Não foi aberta no simulador porque o modo desenvolvedor não ligou (ver pendência da tela 20).

**Tela 10, Entrar** (2026-11-13, plano aprovado):

- **Arte em WebP** (`assets/images/login-hero*.webp`): os PNGs foram trocados por WebP de cerca de 240 KB cada.
- **Arte decorativa escondida também no Android** (`features/authenticate/ui/AuthHeader.tsx`): `importantForAccessibility="no-hide-descendants"` junto do `accessibilityElementsHidden` que já existia.
- **Placeholder da senha** "Sua senha" nos três idiomas, no lugar dos pontos.
- **Preenchimento automático e tecla Ir** (`pages/login/ui/LoginPage.tsx`): e-mail e senha anunciados ao gerenciador de senhas; a tecla Ir do teclado envia quando os dois campos estão preenchidos.
- Visto no simulador nos temas claro e escuro (o escuro conferido na tela 14, com a arte escura). O login real não foi testado porque o backend local está desligado.

**Tela 11, Cadastro** (2026-11-13, plano aprovado):

- **Título "Criar conta" no cabeçalho**, como o "Entrar" da tela 10 (chave `navigation.register` nos três idiomas).
- **Preenchimento automático de conta nova** (`pages/register/ui/RegisterPage.tsx`): e-mail como usuário, nome como nome e as duas senhas como senha nova, para o iOS sugerir senha forte e salvar no gerenciador. A tecla Ir da confirmação envia o formulário.
- **Placeholder da senha** "Crie uma senha", porque a regra dos 8 caracteres já aparece embaixo da barra de força.
- **Erro "E-mail é obrigatório."** escrito igual ao rótulo do campo (só pt-BR).
- **Botão do olho** no mesmo estilo do Entrar.
- Sem problema de performance: formulário leve, sem imagem nem lista.

**Tela 11, comportamento** (2026-11-13, specs aprovadas):

- **MOB-FEAT-068, validação do cadastro:** e-mail sem formato válido mostra "Formato de e-mail inválido."; com a senha vazia ou curta, a confirmação não acusa erro; com senha válida, confirmação vazia mostra "Confirmação de senha é obrigatória.".
- **MOB-FEAT-064, links legais:** `app.json` passa a configurar os destinos `toonlira-rm.web.app/legal/terms` e `/privacy`. Entrar e Cadastro mostram "Termos de uso" e "Política de privacidade" numa linha própria; Sobre lista os dois em "Links oficiais" (resolve a lista vazia anotada na tela 20); os consentimentos de tradução de página única e de lote ganharam erro e "Tentar abrir de novo" quando o navegador falha.
- Visto no simulador iOS: Termos abriu no Safari, Sobre lista os links e o envio vazio não mostra mais "As senhas não coincidem".

**Tela 12, Recuperar senha** (2026-11-13, plano aprovado):

- **Mascote "pensando" em WebP** (`assets/images/mascot-pensando.webp`): de 800 KB (PNG 1024 px) para 61 KB (600 px), no padrão dos outros mascotes. Vale também para os estados vazios do `StateView`.
- **Título "Recuperar senha" no cabeçalho** nas duas etapas, como Entrar e Criar conta (chave `navigation.forgot`).
- **Preenchimento automático e tecla Enviar** no e-mail: oferece a conta salva e envia pelo teclado.
- Visto no simulador: título, tecla Enviar levando à tela "Verifique seu e-mail" e mascote em WebP. Sem backend, a tela de enviado aparece de qualquer forma (resposta neutra, como previsto).
- Desempenho: o temporizador do reenvio é limpo ao sair; nada mais a ajustar.

**Tela 13, Configurações (índice)** (2026-11-13, plano aprovado):

- **Dica do leitor de tela por linha** (`widgets/settings-index/ui/SettingsIndex.tsx`): todas as linhas anunciavam "Abrir Configurações"; agora cada uma anuncia o próprio destino ("Abrir Aparência e acessibilidade"). O Perfil, que usa o mesmo componente, passou a montar a dica do mesmo jeito.
- **Menos renderizações** (`pages/settings-index/ui/SettingsIndexPage.tsx`): a página lia cinco stores inteiros e, como fica montada embaixo das subtelas, redesenhava a cada ajuste feito nelas. Agora lê só os campos do status de cada linha (`useShallow`); o teste confirma que um campo alheio não gera nova renderização.
- Visual sem mudanças: grupos, ícones, descrições e "Login necessário" já estavam corretos no simulador.

**Tela 14, Aparência** (2026-11-13, plano aprovado):

- **Switch desligado visível em qualquer combinação de tema** (`shared/ui/SwitchRow.tsx`, `ios_backgroundColor`): com o app num tema diferente do aparelho, o fundo desligado seguia o aparelho e ficava branco sobre branco. Vale para todos os switches do app.
- **Rótulo "Sistema"** (antes "Seguir o sistema", que quebrava em duas linhas); a frase abaixo do seletor já explica a opção. Três idiomas.
- Visto no simulador: tema do app acompanha o aparelho; app "Claro" com aparelho escuro mostra os switches desligados com a cor do tema.
- Sem mudança: "Animações decorativas" e "Reduzir movimento" são controles próximos; unificar é decisão de produto.

**Tela 15, Leitor (ajustes)** (2026-11-13, plano aprovado):

- **Folha não desce vazia** (`pages/settings-reader/ui/SettingsReaderPage.tsx`): a página limpava a folha aberta no mesmo instante em que mandava fechar, e o que descia era um cartão em branco só com o X. Agora guarda a última folha e mantém título e conteúdo durante a saída.
- **Tamanho do texto em "pt"** em vez de "sp" (unidade técnica do Android, soletrada pelo leitor de tela), nos três idiomas.
- Sem problema de performance: os ajustes leem só os campos que usam.
- Sem mudança: "Navegação" deixa escolher direção "Direita para esquerda" com o modo "Vertical"; se a direção vale nesse modo é regra do leitor (pede spec).

**Tela 16, Idiomas de conteúdo** (2026-11-13, plano aprovado; aplicado também à 18, Privacidade):

- **Fonte do app no aviso de login e no carregamento** (`pages/settings-content-languages`, `pages/settings-privacy`): o aviso "Entre para acessar esta configuração" e o "Sincronizando" usavam `Text` cru, na fonte do sistema; agora usam `AppText`.
- **Carregamento com spinner**: o "Sincronizando" virou `LoadingBlock`, com indicador e aviso ao leitor de tela.
- Testes novos para as duas páginas (antes sem teste). O editor de idiomas exige conta e só foi revisto pelo código.

**Tela 17, Idioma do app** (2026-11-13, plano aprovado):

- **Datas com mês por extenso no aparelho** (`shared/locale/formatters.ts`): no Hermes, o `formatToParts` rotula o "de" de "8 de nov." como mês, e os exemplos de "Dia, mês" e "Mês, dia" saíam "8 de" e "de 8". Agora dia, mês e ano são formatados separadamente; "Dia/mês" segue como estava. O teste simula o rótulo do Hermes e falha com o código antigo. Conferido no simulador: "8 nov." e "nov. 8".
- Layout sem mudanças.

**Tela 18, Privacidade** (2026-11-13, plano aprovado; analisada pelo código porque o painel exige login):

- Aviso de login e carregamento antes da conta: corrigidos com a tela 16.
- **Diálogo de confirmação mantém o texto ao fechar** (`features/update-privacy/ui/PrivacyControlsPanel.tsx`): ao fechar a confirmação de "desativar analytics", o diálogo trocava para o texto de "não rastrear" durante a saída. Agora guarda qual confirmação abriu.
- **Carregamento em vez de tela vazia** enquanto as preferências chegam do servidor (`privacy.loading`, três idiomas).

**Tela 19, Dados** (2026-11-13, plano aprovado):

- **Linha de armazenamento em linguagem simples** (`features/data-controls/ui/DataControlsPanel.tsx`): "Exportações temporárias" com o tamanho ao lado, no lugar de "0 B em exportações temporárias controladas pelo app / Uso temporário". Chaves `storageLabel` e `storageUsage` removidas.
- **Descrição de "Dados offline" sem repetição**: fica só na seção, não na linha de limpar.
- **Sem "nenhum dado offline" falso**: enquanto mede, a linha aparece carregando; se a medição falhar, diz que não foi possível medir (`offline.measureError`, três idiomas). Ajuste ao plano: na falha, a ação de limpar não aparece, porque limpar depende da medição (a lista do que será removido).

**Tela 20, Sobre** (2026-11-13, plano aprovado):

- **Linha "Versão" sem seta** (`shared/ui/ListRow.tsx`, nova opção `showChevron`): a linha só é tocável pelo desbloqueio escondido do modo desenvolvedor e parecia abrir outra tela. O valor "1.0.0" passou a encostar na borda direita, como o switch abaixo.
- **Descrição de "Links oficiais"** "Documentos e páginas oficiais do projeto." (três idiomas), sem prometer ajuda e código que não estão configurados.
- Pendências antigas resolvidas: o switch do modo desenvolvedor funciona (o "não respondia" era o toque instantâneo do simulador) e "Links oficiais" lista Termos e Privacidade (MOB-FEAT-064).

**Tela 21, Status da plataforma** (2026-11-13, plano aprovado; analisada pelo código porque exige login):

- **Espaço no topo igual ao resto do app** (`pages/launcher/ui/PlatformStatusPage.tsx`): `spacing.xs` em vez de `spacing.xl`.
- **"Sair da conta" ocupado durante a saída**: o segundo toque é ignorado e a volta ao início acontece uma vez, mesmo se limpar a sessão local falhar. Correção da análise: falha de rede no logout já era tratada pela API; o problema real era o toque duplo.

**Links legais em Entrar e Cadastro** (2026-11-13, pedidos diretos durante a tela 22; desenho escolhido a partir de referências: Too Good To Go, VSCO, Oracle e eBay):

- **Cadastro**: os nomes "Termos de uso" e "Política de privacidade" viraram links dentro da própria frase de aceite; só os nomes abrem o documento e tocar no resto da frase ou na caixa marca o aceite (`features/authenticate/ui/AuthCheckbox.tsx`). Saiu a linha de links separada.
- **Entrar**: frase pequena logo abaixo do botão, "Ao entrar, você concorda com os Termos de uso e a Política de privacidade." (`SignInLegalNotice`, chaves `login.legalPrefix/legalAnd/legalEnd` nos três idiomas). Saiu a linha de links do rodapé.
- Erro ao abrir o navegador continua com aviso e "Tentar abrir de novo" (`LegalLinkError`).

**Tela 22, Plataforma** (2026-11-13, plano aprovado; analisada pelo código porque as abas exigem login e ainda não aparecem):

- Início, Biblioteca e Fórum: avisos de "em breve", sem mudanças.
- **Perfil** (`pages/profile/ui/ProfilePage.tsx`): nome e e-mail na fonte do app (`AppText`) em vez do `Text` cru; a linha de Configurações deixou de repetir "Abrir Configurações" como status (a seta e a dica do leitor de tela já dizem isso); "Sair" fica ocupado, ignora o segundo toque e volta ao início uma vez. Testes novos (a página não tinha).

**Tela 23, Modal e rota inexistente** (2026-11-13, plano aprovado):

- **404 com um único voltar** (`pages/not-found/ui/NotFoundPage.tsx`): saiu o link "Voltar" do conteúdo, que repetia o botão do cabeçalho. MOB-FEAT-058 (requisito e AC-002) atualizada com a aprovação.
- **Modal removido** (`app/modal.tsx`, `pages/modal`, chave `modal.title`): era resto do modelo do Expo, sem entrada no app. `/modal` agora cai na 404. MOB-BASE-008/OBS-003, registro e `coverage.json` atualizados.

**Animações, etapa 1: escala de movimento** (2026-11-14, plano aprovado; ver [plano de animações](2026-11-14-animacoes.md)):

- **Tokens** (`shared/theme/appearance.ts`): `MOTION_DURATIONS` passa a `instant` 0, `fast` 120, `base` 200, `sheet` 280, `exit` 180 e `pulse` 1200 (ciclo completo). Com movimento reduzido todas as chaves vão a 0. Novas curvas `MOTION_EASING` (`standard`, `enter`, `exit`, `pulse`) para `Animated`.
- **Consumidores**: a folha inferior entra em 280 e sai em 180; o diálogo central entra em 200 e sai em 180; toast, folha e diálogo usam as curvas do tema. O esqueleto lê `motion.pulse` (600 por metade, antes 700). Os controles do leitor usam `motion.base` (antes 160 fixos). O encadeamento de folhas no iOS deriva de `exit` + 170 de margem (continua 350).
- O arrastar e soltar da revisão de importação mantém os tempos próprios de gesto (Reanimated).
- Testes em `designKitTokens.test.tsx`, `motionScale.test.tsx` (novo) e `ContentReader.test.tsx`. MOB-FEAT-057 atualizada com a escala. Falta conferir os valores no simulador.

**Animações, etapa 2: toque e hover** (2026-11-14, plano aprovado, sem ripple no Android):

- **Token `surfaceHover`** nas quatro paletas (escura `#282722`, clara `#F2EFE8`, alto contraste `#262626` e `#f2f2f2`), entre `surface` e `surfacePressed`, com texto AA.
- **`usePressFeedback`** (`shared/ui/usePressFeedback.ts`): pressionado e hover em valores compartilhados do Reanimated. Pressionar é imediato; soltar e o hover animam em `motion.fast` (0 com movimento reduzido). Usado por `Button`, `IconButton`, `BackButton` e `ListRow`, que não re-renderizam mais a cada toque.
- **Toque:** botões com fundo encolhem para 0.97 (antes 0.985 no `Button` e 0.96 no `BackButton`); `IconButton bare` responde pela opacidade 0.6 e ganha círculo de hover; a `ChoiceRow` troca a opacidade 0.72 por fundo de toque, com margem negativa para o texto não sair do lugar.
- **`PressableBox`** informa `hovered` e `focused`. `ChoiceGroup`, `ChoiceCards` e `ActionSheet` usam esses estados (hover `surfaceHover`); `ChoiceGroup` e `ChoiceCards` perderam o estado de foco próprio.
- **Foco visível** por `outline` em `ListRow`, `ChoiceRow` e linhas do `ActionSheet`.
- **`WorkDetail`:** linha de capítulo pressionada usa `surfacePressed`; ponteiro ou foco, `surfaceHover`.
- Testes em `pressFeedback.test.tsx` (novo) e `designKitTokens.test.tsx`; testes que liam `props.style` como objeto passaram a usar `StyleSheet.flatten`, e os mocks de Reanimated ganharam `createAnimatedComponent`, `interpolate`, `interpolateColor` e `withTiming`. Falta conferir no simulador: o simulador não respondia aos toques nesta sessão.

**Animações, etapa 3: transições entre páginas** (2026-11-14, [MOB-FEAT-069](../specs/features/MOB-FEAT-069-page-transitions/spec.md) aprovada):

- **Módulo único** `shared/navigation/transitions.ts`: troca de módulo (`fade`, 200 ms no iOS), ir mais fundo (desliza da direita, voltar a partir de qualquer ponto da tela), fluxo que fecha (sobe de baixo, 280 ms, gesto só pela borda) e leitor (`fade`, gesto só pela borda). Com animações desligadas, tudo `none`; os gestos continuam.
- **Raiz com `Stack.Screen` para cada rota:** biblioteca de traduções como troca de módulo; Configurações, obra e gerenciar obra como ir mais fundo; "Traduzir capítulo" como fluxo que fecha; leitor, prévia e leitor de tradução local como leitor. Antes, biblioteca, obra, leitor local e o fluxo herdavam o `fade` de 500 ms.
- **Pilhas internas** (Configurações, Auth, Plataforma, leitores) usam o módulo em vez de repetir a regra; as abas da plataforma trocam com `fade`.
- Testes em `transitions.test.ts`, `RootNavigator.test.tsx` e `StackLayouts.integration.test.tsx` (novo). Falta conferir no simulador (iOS e Android).

**Abertura do app** (2026-11-14, proposta aprovada):

- **Continua o splash:** o `StartupFeedback` (gates de preferências, sessão e sincronização) e a espera do `ThemeProvider` desenham o mesmo logo do splash nativo, com a mesma imagem, os mesmos 240 pt, a mesma posição centralizada e o mesmo fundo. A troca do splash para o app não salta.
- **Barra fina** no `accent`, logo abaixo do desenho do logo (que termina a 74% da imagem), com um segmento deslizando no ritmo de `motion.pulse`. Com movimento reduzido, fica parada.
- **Uma frase só:** "Abrindo o Toonlira…" entra depois de 800 ms, com fade de `motion.base`, e é a mesma em todas as etapas. Antes, três textos trocavam em menos de um segundo. O leitor de tela continua ouvindo a etapa exata ("Verificando a sessão…" etc.).
- Teste em `startupFeedback.test.tsx`. Falta conferir no aparelho, principalmente se o logo bate com o splash no Android 12+, que desenha o ícone do splash de outro jeito.

**Animações, etapa 4b: fechar a folha puxando** (2026-11-14, [MOB-FEAT-070](../specs/features/MOB-FEAT-070-sheet-drag-to-close/spec.md) aprovada):

- **Gesto na alça e no cabeçalho:** a folha desce com o dedo e o fundo clareia junto. Fecha se passar de 30% da altura ou num puxão acima de 800 pt/s; senão volta em `motion.base`. Para cima só resiste (no máximo 24 pt). O gesto só ativa depois de 8 pt, para não roubar o toque no X. O corpo não inicia o gesto.
- **Mesmo caminho do X:** chama `onClose` e fecha o teclado. Se quem fecha recusar (pedir confirmação), a folha volta para a posição aberta. Arrasto interrompido pelo sistema também volta.
- **Reanimated:** entrada, saída e gesto movem o mesmo valor na UI thread, com os mesmos tempos e curvas, a medição de altura e o `onClosed`. Com movimento reduzido, o gesto acompanha o dedo e o resto é instantâneo.
- **Android:** o conteúdo do Modal fica dentro de `GestureHandlerRootView`.
- Testes em `bottomSheetDrag.test.tsx` (novo) e `motionScale.test.tsx`. Falta conferir no aparelho (TASK-005).

**Entrada da folha inferior** (2026-11-14, todas as folhas, por exemplo Fuso horário):

- **Sobe a própria altura:** antes partia de 85% da tela mesmo numa folha baixa. O começo da subida, que é a parte mais rápida da curva `out(cubic)`, acontecia fora da tela, e a folha parecia demorar a sair e chegar devagar. Agora ela mede a própria altura e desloca exatamente isso, na entrada e na saída.
- **Começa depois de desenhada:** a entrada espera a primeira medição da folha dentro do Modal, em vez de disparar junto com a abertura, e não perde os primeiros quadros, principalmente no Android. A saída começa na hora.
- Durações e curvas não mudaram (entrada `sheet`, saída `exit`). Teste em `motionScale.test.tsx`. Falta conferir no aparelho.

**Trocas de tela mais rápidas** (2026-11-14, pedido do aprovador; ajuste da [MOB-FEAT-069](../specs/features/MOB-FEAT-069-page-transitions/spec.md)):

- **Tokens próprios de tela:** `screen` 140 ms (fade) e `screenSlide` 220 ms (deslize), mais curtos que os dos elementos da tela, que continuam iguais.
- **Fade** (troca de módulo, leitor, abas): de 200 (abas, 150) para 140 ms. **Fluxo que sobe de baixo:** de 280 para 220 ms.
- **Ir mais fundo no iOS:** troca o push nativo (cerca de 350 ms, sem duração ajustável) por `simple_push` com 220 ms. É o mesmo deslize da direita, sem a sombra do push nativo, e o gesto de voltar continua o nativo.
- **Android:** a pilha nativa não aceita duração, então as trocas de pilha seguem o tempo do sistema; só as abas ficaram mais rápidas.
- Falta conferir no aparelho, principalmente o gesto de voltar com `simple_push` no iOS.

**Animações, etapa 4a: desempenho sem mudar comportamento** (2026-11-14):

- **Esqueleto com relógio único:** todos os `Skeleton` montados leem o mesmo valor, com um só laço, que começa com o primeiro e para quando o último sai. Antes, o `ListSkeleton` de 4 linhas rodava 12 laços fora de sincronia. Com movimento reduzido nenhum laço liga.
- **Barras em `scaleX`** (novo `ProgressFill`): capa da obra, lote de tradução e as duas barras do leitor escalam uma camada cheia a partir da borda inicial, sem mudar `width`. Na tela fica igual; é o preparo para a barra suave da etapa 5.
- **Folha encadeada pelo fim real:** no iOS a próxima folha abre quando a anterior avisa que fechou (`onClosed` do `BottomSheet`, ligado ao `onDismiss` do Modal), com uma rede de segurança de `exit` + 500 ms. Sai o `SHEET_CHAIN_DELAY_MS` fixo de 350 ms. No Android continua na hora.
- **Imagens:** capas e miniaturas da biblioteca e da obra entram com fade de `motion.base` (`useImageFade`), sem fade com animações desligadas. Não entrou `recyclingKey` porque essas telas não usam lista reciclada: as linhas são montadas por chave, e a imagem antiga não reaparece.
- Testes em `motionScale.test.tsx`, `progressFill.test.tsx`, `useImageFade.test.tsx`, `chainedSheet.test.tsx` e `LibraryShelf.test.tsx`. Falta medir no aparelho (Perf Monitor em build de release) e conferir o encadeamento de folhas no iOS.
- **Fica para a 4b, com spec própria:** fechar a folha puxando para baixo (Reanimated e gesture-handler). O `CenterDialog` não migra, porque não tem gesto.

**Carregamento ao abrir página e fundo de toque das linhas** (2026-11-14, só aparência):

- **`LoadingBlock`** (leitor, Privacidade, Idiomas de conteúdo, lote de tradução): só aparece depois de 300 ms, com fade de `motion.base`, e assim não pisca quando os dados chegam rápido. O leitor de tela anuncia o status desde o início. O spinner grande deu lugar a três pontos no `accent`, que pulsam em sequência no ritmo do `Skeleton` (`motion.pulse`), e o rótulo virou legenda. Com animações desligadas, os pontos ficam parados e não há fade; o atraso continua, porque serve contra o piscar e não é enfeite. O leitor mantém o mesmo quadro dos outros estados do leitor (revisão de 2026-11-13).
- **Leitor de tradução local, ao abrir** (toque num capítulo da biblioteca): o cartão de status com spinner foi trocado pelo mesmo quadro do leitor de capítulos, com cabeçalho e "Sair do leitor" mais o `LoadingBlock` acima. O texto passou de "Abrindo o projeto…" para "Abrindo o capítulo…", nos três idiomas.
- **`ItemRow`** (linhas de "Sem obra" na biblioteca): o fundo de toque e de hover pinta o cartão inteiro, inclusive a área do "⋯", em vez de só a área principal. Também ganhou anel de foco por contorno.
- Testes em `designKitStates.test.tsx`, `LibraryShelf.test.tsx` e nas páginas de Privacidade e Idiomas de conteúdo. Falta conferir no aparelho.

## Pendências conhecidas

- **`Button` com carregamento perde o nome acessível** (`shared/ui/Button.tsx`): o texto é trocado pelo spinner e o leitor de tela fica sem rótulo enquanto carrega. Visto na tela 21; vale para todos os botões com `loading`.
- **Teste instável** `ChapterBatchPanel.test.tsx` ("keeps the status strip, the summary and the rows on the same per-page statuses"): falha às vezes na suíte completa (espera de 1 s para a faixa sumir); sozinho passa. É do trabalho da faixa de status do lote, anterior a esta revisão.

- **Tela 17 (Idioma do app), muda comportamento:** a tela da obra (`WorkDetail`) formata a data dos capítulos com um formatador próprio e ignora o formato de data escolhido nas configurações. Usar a preferência pede spec.

- **Tela 12 (Recuperar senha), muda comportamento:** a checagem de e-mail (`.+@.+\..+`) aceita espaços no meio, mais frouxa que a do Cadastro (MOB-FEAT-068). Igualar pede ajuste de spec.

- **MOB-FEAT-064 (links legais): falta a abertura real no Android.** O gateway implantado também precisa expor os mesmos destinos em `GATEWAY_TERMS_URL` e `GATEWAY_PRIVACY_POLICY_URL`.

- **Tela 5: "Ler" em capítulo sem páginas prontas** abre o leitor com os originais, enquanto na biblioteca o mesmo capítulo abre o lote. Alinhar muda comportamento (spec). Também observado: o aviso "Obra criada" pareceu passar da borda direita da tela; falta confirmar se era só a animação de entrada.
- **Tela 2: foto em HEIC é rejeitada.** É o formato padrão do iPhone. Aceitar HEIC (convertendo) é regra nova de validação e precisa de Target Spec. Também ficaram fora, por mudarem comportamento: a folha "Páginas com problema" abrir sozinha e X e Home juntos no cabeçalho.
- **Tela 1: com fonte em 200%, os cartões de módulo ficam abaixo da dobra.** O título e a imagem 16:9 ocupam a tela. Diminuir ou esconder a imagem nesse caso contraria a MOB-FEAT-059/AC-001 e precisa de alteração de spec.
- **Sem "Tentar novamente" para capabilities indisponíveis.** Voltar do leitor recarrega as páginas, mas não refaz a consulta ao gateway; só sair e entrar de novo na tela libera o botão. Por mudar comportamento, depende de Target Spec aprovada: rascunho em [MOB-FEAT-067](../specs/features/MOB-FEAT-067-capabilities-retry/spec.md), aprovado em 2026-11-13 e implementado (ação "Tentar novamente" e nova consulta ao voltar para a tela); falta ver o estado indisponível no simulador.
