# Android físico — MOB-FEAT-021

Validação iniciada em 2026-10-25 e retomada em 2026-10-26. Dispositivo próprio
Samsung Galaxy S21+ (SM-G996B), Android 15/API 35, arm64, densidade configurada
420 dpi. Build debug nativo concluído (338 tarefas, 11m18s); APK de 87.915.301
bytes instalado preservando os dados. Diretórios CNG e ferramentas permanecem
locais e ignorados. Identificadores, logs, XML e screenshots não entram no Git.

## Aquisição e persistência

A página sintética própria reutiliza os bytes das respostas reais já autorizadas.
No Android, download usa streams controlados da fixture; não houve HTTPS GCS,
provider pago, VM ou upload novo. Parser, limites, SHA-256, move privado, decoder
nativo, SQLite e claim são os componentes de produção. Identidade, consulta e ACK
são controlados. A prova HTTPS GCS pertence separadamente ao iOS simulado.

| Verificação            | Resultado                                               |
| ---------------------- | ------------------------------------------------------- |
| Primeiro processamento | REMOTE, READY, 1 região, dois streams, claim true       |
| SQLite                 | v9, foreign_keys=1 antes de BEGIN, zero violações       |
| Reinício               | zero downloads, claim false, mesmo WebP íntegro         |
| Página traduzida       | Português legível, sem overlay DEMO                     |
| Original               | Inglês legível; alternância preserva os arquivos        |
| Saída do leitor        | Retorno ao launcher, sem reabertura automática          |
| Reabertura manual      | Ação Abrir leitor abre novamente o resultado persistido |

Primeiro recibo: 2026-10-25T16:58:27.262Z. Recibos de reinício incluem
2026-10-25T17:07:14.591Z e 2026-10-26T23:39:08.687Z, ambos sem download e sem
novo claim. Horários são os dos recibos; nenhum relógio foi alterado.

WebP SHA-256: `f1105ab88129704acfc3d8168a2120f30cd254f09c4ccee36d658108445a10b3`.
Manifesto SHA-256: `909ad504695001d1d6ee35bee8837e79bd4afb8fa8702eb98c898f9331813586`.
Texto: “Olá! Consigo ler esta página. Vamos começar nossa aventura.”

## Matriz de interface

Casos controlados usam os componentes reais com adaptadores de leitura, sem
alterar o resultado persistido. Em pt-BR/en-US/es-ES foram conferidos: os cinco
estágios, erro/recuperação/expiração, aviso inicial de página sem texto e overflow
com texto integral. A ação original permaneceu disponível. Alvo original medido
em 136 px, aproximadamente 51,8 dp, acima de 48 dp.

O teste revelou aviso sem texto escondido junto aos controles: corrigido para
permanecer visível no rodapé, com regressão nos três idiomas e conferência nativa.
Também foram corrigidos textos antigos de READY/preparação e adicionada a ação
manual de reabertura. Regressões RNTL cobrem os três idiomas; READY e reabertura
foram conferidos nativamente em português. Não atribuir a esses casos um gateway
operacional ou uma tradução nova.

O harness usa as rotas reais do Expo Router e os providers do app por um contexto
privado estático. A barra QA foi removida antes do TalkBack. Trocas de locale no
harness podem remontar a raiz e voltar ao launcher; não são prova de navegação
normal persistente entre locales.

## Acessibilidade e retirada

TalkBack ativado com autorização explícita: serviço Samsung vinculado,
touchExplorationEnabled=true e foco azul visível na página e no painel do leitor.
O painel abriu e fechou. ADB injeta eventos que podem ativar controles diretamente;
por isso não comprova exploração por gestos nem a fala dos nomes. A volta ao
leitor foi observada, mas não foi comprovado retorno do foco ao controle de origem.
AC-008/TASK-009 permanecem abertos para essa conferência com interação humana.

A configuração anterior foi restaurada e comparada exatamente: acessibilidade 0,
nenhum serviço habilitado, atalho vazio e alvos do botão ausentes. Nenhum atalho
TalkBack foi ativado. A configuração de fundo do leitor usada no teste foi
reposta para Escuro. Arquivos originais, projeto e resultado foram preservados.

## Limites

APK debug depende de Metro para JavaScript: comprova dados offline, não release
frio sem rede. Houve aviso não bloqueante do LogBox; não se afirma ausência de
warnings. Não houve comprovação de fala por áudio nem percurso completo ao vivo
cloud→providers→gateway→app. A 020 conserva in-progress; publicação desabilitada.
Os gates finais e o verdict corrente estão no [review](../review.md).

## Gates finais

`pnpm check` completo aprovado em 2026-10-26: 121 suítes e 953 testes;
26 regressões de governança e seis de boundaries, sem falhas. Tipos, ESLint,
FSD, formatação e links documentais aprovados; 936 arquivos classificados.
A suíte emite avisos React act de ícones assíncronos; nenhum teste foi suprimido.
Backend e web conservam as evidências anteriores, sem alterações nesta etapa.

## Confirmação humana — 2026-10-26

Ruan confirmou explicitamente, em resposta à conferência solicitada de ativar
TalkBack, abrir o leitor, deslizar entre controles e usar Ver original:
“Conferi: nomes falados e Ver original funcionam; TalkBack desativado”.
Essa evidência humana complementa o foco visível registrado e a matriz trilíngue,
fechando AC-008/TASK-009. Consulta ADB posterior confirmou acessibilidade 0 e
nenhum serviço habilitado. Não atribuir ao relato uma medição de retorno ao
controle de origem, de áudio gravado ou de build release. A ressalva anterior
sobre ADB permanece válida; a pendência de fala/gestos foi resolvida pelo usuário.
