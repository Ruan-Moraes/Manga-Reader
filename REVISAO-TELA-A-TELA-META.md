# META — Revisão tela a tela do app mobile: design e performance

## Objetivo

Percorrer as 23 telas do app mobile, uma de cada vez, e resolver os problemas de design e de performance de cada
uma. A meta termina quando todas as linhas da tabela do
[plano de revisão](mobile/docs/plans/2026-11-13-revisao-tela-a-tela.md) estiverem `feito` ou
`feito, sem verificação física`, ou quando um bloqueio concreto for identificado e registrado.

Em cada atualização, informar a tela atual, a etapa dela e o progresso total (telas concluídas de 23).

Progresso: 23 de 23 telas concluídas.

## Regra de trabalho: aprovação antes de cada tela

Nenhuma tela é alterada sem aprovação explícita do usuário. Para cada tela:

1. **Analisar.** Abrir a tela no simulador e ler o código. Levantar os problemas de design e de performance
   pelos critérios do [roteiro de auditoria](mobile/docs/plans/auditoria-design-mobile.md), com capturas do
   estado atual.
2. **Planejar.** Apresentar ao usuário a lista de problemas encontrados e as correções propostas. Separar o que
   é só visual do que muda comportamento, porque mudança de comportamento exige Target Spec aprovada, conforme o
   [`mobile/AGENTS.md`](mobile/AGENTS.md).
3. **Aguardar aprovação.** Só começar a alterar código depois de o usuário aprovar o plano daquela tela. A
   aprovação de uma tela não vale para a próxima.
4. **Executar e verificar.** Corrigir, rodar os gates do plano (`pnpm typecheck`, testes da área,
   `pnpm lint:fsd`, Prettier nos arquivos tocados) e conferir no simulador.
5. **Registrar.** Atualizar a linha da tela na tabela do plano e o estado abaixo.

## Fontes de verdade

1. `CLAUDE.md` / `AGENTS.md` da raiz, `mobile/AGENTS.md` e `mobile/README.md`.
2. [Plano de revisão tela a tela](mobile/docs/plans/2026-11-13-revisao-tela-a-tela.md): ordem, método e tabela.
3. [Roteiro de auditoria de design](mobile/docs/plans/auditoria-design-mobile.md) e
   [resultado](mobile/docs/plans/auditoria-design-mobile-resultado.md).

## Estado em 2026-11-13

- **Tela 3 (etapa 3 da tradução): design em andamento.** Feito: cartão de projeto preparado, modal de falha
  parcial, folha "Salvar em", estado de carregamento das capabilities e a
  [MOB-FEAT-067](mobile/docs/specs/features/MOB-FEAT-067-capabilities-retry/spec.md) ("Tentar novamente",
  `in-progress`). Falta ver no simulador o estado indisponível e o carregamento, e fazer a passagem de
  performance.
- **Tela 1 (Seletor de módulos): feita, sem verificação física.** Títulos limitados a 2× da fonte do sistema, imagem
  decorativa oculta dos leitores de tela e imagens de destaque em WebP. Pendente: imagem menor com fonte
  ampliada, que depende de spec.
- **Tela 2 (Traduzir: importar, organizar, idiomas, validação): feita, sem verificação física.** Linha solta removida,
  ações da página com problema com texto, resumo menor, lista compacta, "Limpar e recomeçar" discreto, indicador ao
  abrir a galeria e miniaturas só em memória. Pendente: aceitar HEIC, que depende de spec.
- **Tela 4 (Biblioteca de traduções): feita, sem verificação física.** Consulta em lote das tentativas, carga única
  ao abrir, nomes dos idiomas, "Nova obra" compacta sem obras e hora no título dos capítulos.
- **Tela 5 (Obra): feita, sem verificação física.** Carga única ao abrir, título do cabeçalho fora dos botões
  (compartilhado), nomes dos idiomas, "Capítulo N" e menu "⋯".
- **Tela 6 (Gerenciar obra): feita, sem verificação física.** Nomes dos idiomas e nome da obra numa linha na
  linha "Nome".
- **Tela 7 (Leitor de resultado local): feita, sem verificação física.** Sem filtro a 100%, páginas só em memória,
  barra de status na leitura imersiva, título de capítulo sem obra e aviso de página sem texto no painel. Falta
  conferir um capítulo de obra (setas e fim do capítulo).
- **Tela 8 (Leitor da plataforma): feita, sem verificação física.** Cache por origem da imagem (corrige a tela 7) e
  escolha de retomada com moldura e voltar. Capítulo real não visto: backend local desligado.
- **Tela 9 (Prévia de novel): sem mudanças.** Analisada pelo código; não aberta no simulador porque o switch do modo
  desenvolvedor não respondia no simulador (na tela 14 viu-se que era o toque instantâneo do simulador).
- **Tela 10 (Entrar): feita, sem verificação física.** Arte em WebP e escondida do leitor de tela no Android,
  placeholder "Sua senha", preenchimento automático e tecla Ir. Login real não testado: backend local desligado.
- **Tela 11 (Cadastro): feita, sem verificação física.** Título no cabeçalho, autofill de conta nova com tecla Ir,
  placeholder "Crie uma senha", erro "E-mail é obrigatório." e olho como no Entrar. Depois, com specs aprovadas:
  MOB-FEAT-068 (formato do e-mail e erro de confirmação) e MOB-FEAT-064 (links legais em Entrar, Cadastro, Sobre e
  consentimento de tradução). Falta abrir os links num Android.
- **Tela 12 (Recuperar senha): feita.** Mascote "pensando" em WebP (800 KB → 61 KB, também nos estados vazios),
  título no cabeçalho, autofill e tecla Enviar. Pendente: igualar a checagem de e-mail à do Cadastro (pede spec).
- **Tela 13 (Configurações): feita.** Dica do leitor de tela por linha e índice sem renderizações à toa enquanto
  as subtelas são usadas.
- **Tela 14 (Aparência): feita.** Switch desligado visível quando o tema do app difere do aparelho (vale para
  todos os switches) e rótulo "Sistema" numa linha. Também confirmou o tema escuro no Entrar.
- **Tela 15 (Leitor, ajustes): feita.** Folha mantém o conteúdo enquanto desce e tamanho do texto em "pt".
- **Tela 16 (Idiomas de conteúdo): feita, sem verificação física.** Aviso de login e carregamento na fonte do app,
  com spinner; a mesma correção foi aplicada à tela 18 (Privacidade). O editor exige conta e não foi visto.
- **Tela 17 (Idioma do app): feita.** Datas com mês por extenso corrigidas no aparelho (o Hermes trocava o mês
  pelo "de"). Pendente: a tela da obra ignora o formato de data escolhido (pede spec).
- **Tela 18 (Privacidade): feita, sem verificação física.** Diálogo mantém o texto ao fechar e carregamento em vez
  de tela vazia; o painel exige login e foi revisto pelo código.
- **Tela 19 (Dados): feita.** Armazenamento em linguagem simples, descrição offline sem repetição e sem "nenhum
  dado offline" antes da medição ou quando ela falha.
- **Tela 20 (Sobre): feita.** Linha da versão sem seta enganosa e descrição dos links fiel ao que existe; pendências
  antigas (switch e links vazios) resolvidas.
- **Tela 21 (Status da plataforma): feita, sem verificação física.** Topo alinhado ao resto do app e "Sair da
  conta" ocupado durante a saída, sem toque duplo. Exige login; revista pelo código.
- **Links legais de Entrar e Cadastro (pedido direto):** no Cadastro, os nomes das políticas são links dentro da frase
  de aceite; no Entrar, frase "Ao entrar, você concorda…" logo abaixo do botão.
- **Tela 22 (Plataforma): feita, sem verificação física.** Perfil com fonte do app, sem status repetido e "Sair" sem
  toque duplo; Início, Biblioteca e Fórum são avisos de "em breve". Abas não expostas; revista pelo código.
- **Tela 23 (Modal e rota inexistente): feita.** 404 com um único voltar (MOB-FEAT-058 atualizada) e página Modal
  removida; `/modal` cai na 404.
- **Tela 3 (etapa 3 da tradução): feita.** Lote com buscas indexadas (sem custo quadrático em capítulos longos) e
  MOB-FEAT-067 vista no simulador com o gateway indisponível.
- **Revisão concluída nas 23 telas.** Pendências que pedem spec ou verificação física estão em "Pendências conhecidas"
  do documento da revisão.
- Nada desta revisão foi commitado ainda.
