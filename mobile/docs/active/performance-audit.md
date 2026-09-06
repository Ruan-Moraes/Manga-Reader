# Auditoria de performance mobile — 2026-09-05

## Estado atual — consolidado em 2026-09-06

**C01–C05 implementadas com testes automatizados; validação de performance nativa
pendente.** Os cinco mecanismos identificados receberam correções em duas rodadas.
Isso não encerra os achados: ainda faltam comparação em build representativo,
verificações físicas e investigação das seis hipóteses MOB-PERF-006…011.

| Correção | Achado       | Implementação atual                                                   | Evidência da rodada                                                             |
| -------- | ------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| C01      | MOB-PERF-002 | Mapa de número lógico por identidade, sem busca por imagem            | [Primeira rodada](performance-evidence/corrections-2026-09-06/review.md)        |
| C02      | MOB-PERF-001 | Leitor vertical virtualizado, offsets por dimensões e retry acessível | [Segunda rodada](performance-evidence/corrections-c02-c05-2026-09-06/review.md) |
| C03      | MOB-PERF-003 | Consultas pontuais e atualização local após commit por página         | [Primeira rodada](performance-evidence/corrections-2026-09-06/review.md)        |
| C04      | MOB-PERF-004 | Leitura incremental com limite de acumulação JS e cancelamento        | [Primeira rodada](performance-evidence/corrections-2026-09-06/review.md)        |
| C05      | MOB-PERF-005 | Download para arquivo temporário pelo cliente autenticado             | [Segunda rodada](performance-evidence/corrections-c02-c05-2026-09-06/review.md) |

O gate da segunda rodada registrou `pnpm check` com 95 suítes e 588 testes passando.
Contagens SQL em Node e testes Jest comprovam mecanismos e comportamento, sem medir
FPS, memória nativa ou latência do aplicativo. As features 005/007/015/017 mantêm
verificação aberta conforme seus contratos SDD; DT-75 permanece aberta.

O [plano de remediação](../plans/performance-remediation.md) organiza o trabalho
restante. Os reviews de cada rodada guardam mudanças, hashes, testes, riscos e
reversão. As seções históricas abaixo preservam a árvore anterior às correções:
linhas, inventário e recomendações originais não descrevem o runtime atual.

## Diagnóstico inicial e alcance — histórico

**Diagnóstico estático concluído nos caminhos prioritários; baseline nativo pendente.**
Foram confirmados cinco mecanismos de custo no cliente: montagem integral do leitor
vertical, buscas repetidas para numeração, reidratação integral do draft por página
validada, limite de resposta aplicado após leitura integral e exportação JSON
materializada. Não foram medidos travamentos, vazamentos, FPS ou latência do app.
Nenhum achado recebe P0/P1 sem a evidência operacional exigida.

A auditoria cobre somente mobile. HTTP é analisado pelo cliente, sem diagnóstico
sobre implementação da Core/gateway. OCR, tradução e renderização local futuras,
assim como tabs não expostas, não são tratadas como fluxos reais. O registry SDD,
não o roadmap, define os contratos vigentes.

A árvore inclui alterações locais anteriores. [Snapshot](performance-evidence/snapshot.json)
registra commit, versões instaladas e hashes de suporte;
[inventário](performance-evidence/inventory.json) registra 406 arquivos de `src`,
incluindo 311 classificados como `behavior`, seus hashes e vínculos SDD.
A listagem Git inicial foi mantida somente como artefato local de trabalho; não
integra os commits. Snapshot e hashes preservam a identificação da árvore auditada.
Os hashes de runtime são a referência precisa para este diagnóstico.

**Limite de cobertura:** inventariar/triagem não equivale a revisão aprofundada de
cada linha. O [índice estático](performance-evidence/static-index.json) contém 280
ocorrências candidatas nos 311 arquivos runtime; ocorrências não são defeitos.
Aprofundamento concentrou-se nos mecanismos descritos abaixo e nas proteções do
mesmo caminho. Áreas sem profiling permanecem parcialmente analisadas.

## Matriz de cobertura da auditoria inicial — histórico

| Área                  | Estado                                           | Caminhos examinados e resultado                                                                                                              | Verificação aberta                                              |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Inicialização         | Parcialmente analisada                           | RootApplication, SettingsGate, SessionGate, providers e tema; fontes/hidratação bloqueiam a árvore, recuperação remota não bloqueia children | Tempo até interação frio/quente; MOB-PERF-009                   |
| Renderização e estado | Parcialmente analisada                           | Seletores do leitor, providers, galeria e controles; montagem integral confirmada                                                            | Profiler das transições, MOB-PERF-006                           |
| Navegação             | Parcialmente analisada                           | Stack Expo Router, redirects, layouts, retorno e listeners; drag remove subscription e interrompe gesto ao sair de active                    | Rotação, ida/volta, retenção e recuperação concorrente          |
| Leitor                | Analisada estaticamente; medição pendente        | Modos vertical/paginado/duplo, offsets, prefetch, retry, progresso e query com signal                                                        | MOB-PERF-001/002/007; frames e memória                          |
| Mídia local           | Analisada estaticamente; medição pendente        | Cópia sequencial, staging, FlatList de revisão, validação e preparação de projeto                                                            | MOB-PERF-003/010; lote e reentrada                              |
| Persistência          | Parcialmente analisada                           | SQLite, reidratação, transações exclusivas, JSON/SecureStore, arquivos privados e medidas por SUM                                            | Contagem/volume SQLite real, disco e MOB-PERF-011               |
| Rede                  | Analisada estaticamente; validação local parcial | QueryClient estável, signals do leitor, refresh single-flight, export, gateway e reconcile                                                   | MOB-PERF-004/005/008; bytes e tempos reais                      |
| Recursos e manutenção | Parcialmente analisada                           | Runtime/configuração inventariados, leases locais e cleanup inspecionados nos caminhos acima                                                 | CPU, memória JS/nativa, bundle/startup, tarefas após background |

A classificação por arquivo/área do inventário é uma triagem por responsabilidade
e caminho; arquivos compartilhados pertencem a várias áreas. Recursos e testes
não foram promovidos artificialmente a comportamento. Outros componentes e
entidades tiveram triagem, sem alegação de ausência de problemas.

## Evidências e ambiente da auditoria inicial — histórico

- Host Darwin arm64; React 19.2.3, React Native 0.86.3, Expo 57.0.20,
  TanStack Query 5.101.0, Zustand 5.0.14; demais versões no snapshot.
- `adb devices -l`: lista vazia após consulta fora do sandbox. Não há Android
  conectado nesta execução; isso não significa ausência de Android no projeto.
- `xcrun simctl list devices booted`: iPhone 17, iOS 26.5 ativo.
  `listapps` identificou Expo Go; nenhuma build release do projeto foi identificada.
  Não houve execução nativa, instalação, alteração de dados ou habilitação de upload.
- `pnpm check` antes dos documentos: 95 suítes/553 testes passaram; detalhes em
  [verificação](performance-evidence/verification.md). Testes com mocks não medem RN.
- Experimento local histórico (`reproduce.js`, não versionado) executou o transporte
  TypeScript real, transpilado em memória com fetch falso. Uma rodada de aquecimento
  e cinco repetições: resposta ASCII de 65.537 bytes sem `Content-Length` provoca
  uma leitura integral antes de `response-too-large`; com tamanho declarado, zero.
  [Resultados brutos](performance-evidence/response-limit.json). A mediana 1 e amplitude
  [1,1] são contagens de chamadas a `text()`, não tempo, memória ou bytes de rede.
- `MOB-FEAT-015/review.md` registra validação Android histórica com 67 imagens,
  inclusive liberação do decoder e correção de falsos CORRUPTED. O texto diz que
  o checksum global posterior não representa nova inspeção nativa. Preservar essa
  evidência, sem extrapolá-la ao código atual ou a iOS.

## Achados priorizados — diagnóstico histórico e estado de correção

P0 = indisponibilidade reproduzida; P1 = degradação relevante medida;
P2 = custo confirmado condicionado a volume/fluxo; P3 = manutenção com nexo causal.
P2 abaixo é provisório quanto à magnitude, sem benefício numérico prometido.
A ordem combina alcance potencial, frequência, risco e dependência de medição;
a implementação atual está no quadro de abertura. A prioridade original permanece
como referência de investigação/aceite, sem afirmar que o mecanismo persiste após
a correção. Responsável pelas validações restantes: **a definir**.

| Ordem | ID           | Diagnóstico                                         | Estado                                                   | Prioridade / complexidade / risco |
| ----- | ------------ | --------------------------------------------------- | -------------------------------------------------------- | --------------------------------- |
| 1     | MOB-PERF-001 | Leitor vertical monta todas as imagens              | Confirmado estaticamente; correção em validação          | P2; alta; alto                    |
| 2     | MOB-PERF-003 | Validação relê draft completo duas vezes por página | Confirmado estaticamente; correção em validação          | P2; média; alto                   |
| 3     | MOB-PERF-002 | Numeração faz buscas repetidas                      | Confirmado estaticamente; correção em validação          | P2; baixa; baixo                  |
| 4     | MOB-PERF-004 | Limite de resposta não limita leitura sem cabeçalho | Confirmado em experimento isolado; correção em validação | P2; média; médio                  |
| 5     | MOB-PERF-005 | Exportação materializa objeto e string JSON         | Confirmado estaticamente; correção em validação          | P2; média; médio                  |

### MOB-PERF-001 — Montagem integral do leitor vertical

- **Onde/evidência:** `src/widgets/chapter-reader/ui/ReaderViewport.tsx:150–171`,
  `ScrollView` com `items.flat().map(renderPage)`; cada item contém `expo-image`.
  [Trecho congelado](performance-evidence/source-excerpts.md).
- **Impacto:** árvore montada cresce com todas as páginas, incluindo fora do viewport.
  Pressão de memória/layout é potencial; não foi comprovado que todas as imagens
  são simultaneamente decodificadas nem quantificada a rede.
- **Recomendação:** após baseline, virtualizar apenas o modo vertical com a lista
  nativa já disponível, preservando identidade e restauração lógica de página.
  Não impor `getItemLayout` com alturas estimadas como se fossem exatas.
- **Prioridade/risco:** P2 provisório, alta complexidade/risco; mudança pode afetar
  offsets, imagens altas, fit ORIGINAL, rotação, progresso, retry e acessibilidade.
- **Dependências:** medir B02; verificar ACs do leitor e gate SDD. Sem nova biblioteca
  necessária por princípio; escolha final depende do experimento de alturas.
- **Validação:** contar itens montados e comparar frames/memória por volume; testar
  retorno à mesma página, modos/direções, primeira/última página, gaps, dimensões
  heterogêneas e falha/retry. Aceitar somente preservando esses resultados.

### MOB-PERF-003 — Reidratação por resultado de validação

- **Onde/evidência:** `validateLocalMedia.ts:107–140` chama `updateMediaValidation`
  por item; `localMediaImportRepository.ts:594–626` chama `requireDraft` antes/depois.
  `getDraftFrom:329–370` busca todos os itens e os mapeia em objetos.
- **Impacto:** N resultados validando um draft fixo de N itens materializam cerca
  de 2N² linhas de itens, além dos headers, updates e buscas JS. É dedução do caminho
  de sucesso, não contagem capturada em SQLite. Persistir cada página é garantia
  funcional válida; a redundância está na releitura completa.
- **Recomendação:** avaliar consulta de versão/item e retorno mínimo no caminho
  de validação, com atualização do snapshot local e releitura final; manter commit
  por página, optimistic concurrency, detecção de remoção e retomada após falha.
- **Prioridade/risco:** P2, complexidade média, risco alto de stale data e perda de
  recuperação. Não agrupar todo o lote em uma transação apenas para reduzir calls.
- **Dependências:** B03; contrato do repository e callers; qualquer alteração futura
  de persistência deve consultar guias aplicáveis, sem migration presumida.
- **Validação:** contar queries e linhas retornadas, separar tempo SQL/decoder;
  comparar lote integral/retry seletivo e interromper após página intermediária.
  Aceite: resultados iguais e volume de linhas sem reidratação N vezes do lote.

### MOB-PERF-002 — Busca de índice dentro da renderização

- **Onde/evidência:** `ReaderViewport.tsx:131–148`, `pageNumber={pages.indexOf(page)+1}`.
- **Impacto:** a soma de buscas no modo vertical percorre até N(N+1)/2 posições.
  O modo paginado renderiza somente o item atual; não atribuir N² a esse modo.
  Tempo nativo e peso relativo frente às imagens permanecem desconhecidos.
- **Recomendação:** derivar uma única associação ID→número lógico por mudança de
  `pages`; não usar diretamente o índice visual em direção invertida/dupla.
- **Prioridade/risco:** P2, baixa complexidade e risco baixo; IDs e ordem lógica
  precisam continuar produzindo labels e progresso corretos.
- **Dependências:** baseline do leitor; independente de MOB-PERF-001.
- **Validação:** números e labels iguais em todos os modos/direções, incluindo
  último par ímpar; instrumentar operações/Profiler, sem teste frágil de milissegundos.

### MOB-PERF-004 — Limite aplicado após ler corpo completo

- **Onde/evidência:** `remoteGatewayTransport.ts:79–88`, `response.text()` precede
  verificação por `TextEncoder`; experimento e cinco resultados disponíveis acima.
- **Impacto:** os 64 KiB limitam aceitação, não a materialização de uma resposta
  sem tamanho declarado ou com cabeçalho incorreto. String e buffer de encoding
  podem coexistir. Não há evidência de gateway real enviando resposta excessiva.
- **Recomendação:** investigar leitura incremental limitada no fetch da versão RN
  instalada; se indisponível, documentar a limitação e avaliar adaptador compatível.
  Não presumir que streams web funcionam em todos os destinos nativos.
- **Prioridade/risco:** P2 condicionado à resposta excessiva, complexidade média;
  risco de alterar encoding, cancelamento, parsing e tratamento de erro.
- **Dependências:** teste de capacidade nativa B04. Nenhuma dependência nova decidida.
- **Validação:** respostas no limite/acima, sem header, header incorreto, UTF-8
  multibyte, timeout/abort e JSON inválido; medir pico de memória e interrupção
  efetiva da leitura em RN. O experimento atual prova somente a ordem de chamadas.

### MOB-PERF-005 — Exportação integral em memória

- **Onde/evidência:** `features/data-controls/api/dataControlsApi.ts:3–5` recebe
  `response.data`; `shared/files/jsonExport.ts:27` serializa com indentação antes
  de escrever. `shareAccountExport` conecta os dois caminhos.
- **Impacto:** o cliente mantém objeto e string completos em exportações grandes;
  serialização é síncrona. Tamanho real de histórico e bloqueio de UI não medidos.
- **Recomendação:** medir payload e memória antes de decidir download para arquivo
  ou geração incremental compatível com o contrato real. Remover indentação por
  si só não elimina a materialização; não criar novo endpoint nesta auditoria.
- **Prioridade/risco:** P2 circunstancial; complexidade/risco médios, incluindo
  envelope JSON, compartilhamento e limpeza de temporários.
- **Dependências:** B05; eventual suporte externo é investigação, não requisito confirmado.
- **Validação:** export parseável com conteúdo igual, cancelamento/falha/cleanup,
  conta desconectada e crescimento de dados; medir memória e responsividade.

## Hipóteses e investigação adicional

Não são defeitos confirmados. Prioridade abaixo ordena investigação, não correção.
Os locais e linhas são os observados na auditoria inicial; conferir o código atual
antes de investigar, especialmente onde C01–C05 modificaram o caminho.
Cada item permanece aberto, responsável a definir, sem estimativa de ganho.

| ID / ordem           | Onde e fato observado                                                                                                               | Hipótese/impacto a medir                                                                                           | Recomendação, riscos e validação                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MOB-PERF-006 / média | `pages/reader/ui/ReaderPage.tsx:31,217`: settings inteiro e `useSessionStore()` sem seletor                                         | Alterações irrelevantes podem propagar renders; custo não demonstrado                                              | Profiler mudando user/tema/settings não usados; selecionar apenas após evidência. Risco: perder atualização legítima de identidade/preferência. Independente da virtualização                |
| MOB-PERF-007 / alta  | `ReaderViewport.tsx:111–114` prefetch a cada página; `viewport.ts:25–33` limita raio a 10                                           | Janelas sobrepostas podem repetir trabalho, mas cache pode evitar rede                                             | Capturar chamadas versus downloads reais e memória nos três modos. Risco: piorar avanço/retry ao deduplicar incorretamente; manter política de preload. Depende B02                          |
| MOB-PERF-008 / alta  | `RemoteProcessingRecoveryGate.tsx:10–23` dispara no mount/active; `startRemoteProcessing.ts:197` reconcile sem coalescência própria | Reentradas rápidas podem sobrepor consultas e replay; idempotência remota não prova ausência de trabalho duplicado | Mock com resposta atrasada e vários active; medir concorrência e cancelamento. Risco: impedir recuperação legítima; preservar consentimento/idempotency. Depende B04                         |
| MOB-PERF-009 / média | `SettingsGate:54` espera fontes/hidratação; SessionGate monta abaixo e restaura sessão                                              | Dependências em sequência podem aumentar startup; não é por si erro                                                | Trace frio/quente com storage lento. Só sobrepor etapas realmente independentes. Risco de flash de tema/idioma e redirects prematuros                                                        |
| MOB-PERF-010 / média | `mediaInspection.ts:71` cria array de posições; `:113–115` faz leitura síncrona limitada                                            | Parsing PNG/alocações podem pesar na JS thread por lote                                                            | Medir parsing separado de decoder e SQLite. Limite atual de head 262.144 bytes e tail 4.096 reduz risco. Preservar detecção APNG, limites e release nativo; sem trocar decoder sem evidência |
| MOB-PERF-011 / baixa | `apiClient.ts:20–21` lê token; `tokenStorage.ts:15,35` usa SecureStore por request                                                  | I/O por requisição pode contribuir para latência                                                                   | Contar chamadas e duração em sessão/guest. Cache em memória só se justificado; risco de token obsoleto e troca de conta. Preservar refresh single-flight e clear                             |

Revisar ainda a duração de validação após saída da tela: `useValidateLocalMedia`
não fornece abort para `controller.validate`. Continuar trabalho pode ser intenção
válida de persistência; consultar spec antes de tratar como desperdício/vazamento.

## Proteções observadas na auditoria inicial e fontes

- Galeria de revisão já usa FlatList com janela e lote explícitos; não recomendar
  virtualização novamente. Drag interrompe e remove listener em cleanup.
- Validação faz leitura limitada/sequencial, limites de bytes/pixels, decoder com
  dimensão máxima e `release()`. Importação usa staging e cópia sequencial.
- QueryClient é estável; invalidação por idioma filtra `meta.localeDependent`.
  Queries de capítulo/progresso encaminham AbortSignal. Progresso coalesce snapshots.
- HTTP tem timeout e refresh single-flight; transporte remoto limpa timer/listener;
  upload exige origem válida e passa por consentimento/capabilities.

Fontes primárias consultadas em 2026-09-05: [ScrollView](https://reactnative.dev/docs/scrollview),
[performance RN](https://reactnative.dev/docs/performance), [memo](https://react.dev/reference/react/memo),
[cancelamento Query v5](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
e [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/).
A recomendação de lista e profiling é de plataforma; prioridades e gates são regras
locais. Páginas `latest` podem mudar: conferir as APIs nas versões instaladas antes
de implementar, especialmente streams e clipping. Não há recomendação de trocar
bibliotecas baseada em popularidade.

## Próximos passos e estado da execução

[Plano de remediação](../plans/performance-remediation.md) contém tarefas pequenas,
cenários e critérios. [MOB-DEC-007](../decisions/MOB-DEC-007-mobile-performance.md)
contém a referência normativa; a skill aplica esse processo.

A01 concluída para a árvore inicial (inventário/triagem); A02 parcial (experimentos
locais, sem baseline nativo); A03–A06 revisão estática concluída nos caminhos
descritos, medição aberta; A07/A08 entregues documentalmente; A09 registrada no
[fechamento inicial](performance-evidence/verification.md) e nas revisões das rodadas.

C01–C05 foram implementadas após a auditoria documental, com autorização humana.
A aceitação final de performance permanece aberta. Próximas entregas: preparar
ambiente B01, concluir medições B02–B06 e investigar I01–I06, preservando os critérios
funcionais e registrando resultados inconclusivos quando não houver evidência.
