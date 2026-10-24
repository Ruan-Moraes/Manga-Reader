# Review parcial — MOB-FEAT-018

- Spec revisada: `spec.md`
- Gate na entrada: `open` (`MOB-FEAT-017` em `verification-pending`)
- Implementação/revisão: working-tree sha256:0197e775ac2875fd2619dc4a8a1a68162b97aa1591d460593588c2932c2d51b2
- Verdict: `verification-pending` — implementação técnica auditada; TASK-004/005 abertas para qualidade e operação

## Estado consolidado — 2026-09-27

A [evidência corrente](evidence/ocr-consolidation.md) revalida 15 rodadas reais
do catálogo nos sete idiomas e quatro rodadas reais de controles tipográficos.
Capturas/manifestos íntegros, replay do mapper correspondente e 448 arquivos
anteriores preservados. O piloto inicial de 12 imagens/seis idiomas continua
registrado como histórico, não como inventário corrente. Nenhuma das rodadas
substitui as 18 referências independentes; TASK-004/005 continuam abertas.

Layout 1.1 é uma extensão experimental separada do OCR: três quadros e dois
balões por página neste conjunto, com uma duplicata coreana corrigida/auditada.
Não altera manifesto OCR, estados públicos ou critérios desta spec. Onomatopeias
ficaram fora do foco por decisão do custodiante; achados anteriores preservados.

Os relatos datados abaixo de “nenhuma chamada real” descrevem etapas anteriores.
Esta atualização não apaga seus resultados nem declara revisão multilíngue
independente, deploy, tradução ou ativação de uploads. Defaults continuam fechados.
Somente documentação foi consolidada; nenhuma nova chamada ou credencial usada.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                           | Resultado                                    |
| -------- | ------------ | ------------------------------------------------------------------------------ | -------------------------------------------- |
| AC-001   | sim          | sete hints parametrizados e capturas nos sete idiomas                          | técnico pass; qualidade humana pendente      |
| AC-002   | sim          | mapper/manifesto, hashes e replay de 19 capturas                               | técnico pass; consumo pela 019 futuro        |
| AC-003   | sim          | fixtures horizontal/vertical, página histórica e controles reais               | mapeamento pass; qualidade vertical pendente |
| AC-004   | sim          | mapper vazio e fluxo worker/PostgreSQL em teste                                | offline pass; página vazia real pendente     |
| AC-005   | sim          | limites, timeout sem retry, cancelamento, concorrência, rollback e ACK perdido | testes pass; validação operacional pendente  |
| AC-006   | sim          | metadados sem texto, cleanup, logs sanitizados e IAM declarativo privado       | técnico pass; retenção/logs cloud pendentes  |

## Decisão corrente e gates

Não encontrada lacuna funcional nos ACs auditados. A frase antiga de desempate
direcional foi reconciliada por aprovação humana explícita, não por alteração
silenciosa do critério. O mapper continua preservando a ordem estrutural do Vision.
Região inválida isolada é descartada conforme regra da spec; resposta sem qualquer
associação válida ou excedente falha inteira. Não confundir essa regra com garantia
de que o provider reconheça todos os caracteres.

`./mvnw -o -B test` passou nos sete módulos (175 testes gateway); 86 testes Node,
type-check web e `pnpm check` completo passaram (109 suítes/674 testes mobile).
SDD, links, formatação direcionada e whitespace conferidos após estabilização.
Avisos `act` preexistentes não foram corrigidos fora deste escopo.

O [drift audit](drift-audit.md) registra correções documentais e limites. O checksum
SDD desta review não cobre Java; o hash independente do gateway e reprodução
estão na evidência. A árvore candidata 018 `verification-pending` + 019 `open`
falhou em `validate-specs.mjs`: 019 `approved` aberta exige tasks. Como o marco
proíbe criá-las, aplicado o fallback aprovado: 018 `in-progress`, 019 `blocked`.
Naquele marco, o próximo trabalho exigia autorizar tasks da 019 e a transição
conjunta, não corrigir OCR ou enfraquecer o validador. O `pnpm check` integral da
árvore conservadora passou novamente (109 suítes/674 testes); isso não torna
válida a abertura recusada. SDD/links e checksums reconferidos após o registro.
Não há tasks/código de tradução, nova chamada, deploy ou aprovação operacional.

## Resolução do bloqueio documental — 2026-09-27

O parágrafo anterior registra a tentativa histórica sem tasks. Ruan aprovou
posteriormente o plano de transição com sua criação. Reconferidos os 154 arquivos
técnicos e os 448 artefatos contra os hashes da consolidação, sem divergência.
O estado corrente é 018 `verification-pending` (gate `open`) e 019 `approved/open`,
com sete tasks planejadas, todas abertas. O finding de processo está resolvido;
os validadores não foram alterados. Não há implementação de tradução nem
evidência linguística/operacional nova. TASK-004/005 e a matriz dos seis critérios
permanecem com as mesmas pendências externas.

Verificação deste marco documental, executada em 2026-09-27:

| Comando/verificação                             | Resultado                                                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Hashes da consolidação, somente leitura         | 154 arquivos técnicos e 448 artefatos preservados; checksum gateway inalterado                            |
| `cd api && ./mvnw -o -B test`, Docker local     | sete módulos `SUCCESS`, zero falhas/erros; 175 testes gateway; 2 min 22 s                                 |
| `cd web/toonlira && ./node_modules/.bin/tsc -b` | exit 0                                                                                                    |
| `cd mobile && pnpm check`                       | cadeia completa aprovada; 109 suítes/674 testes Jest, 23 testes perf, 24 SDD e 6 FSD                      |
| SDD e links                                     | transição aceita, 1407 arquivos classificados; 19 links locais gateway/plano também conferidos            |
| Prettier direcionado e `git diff --check`       | aprovados, sem formatação global                                                                          |
| Invariantes da transição                        | sete tasks 019 abertas, seis linhas AC, TASK-004/005 da 018 abertas e nenhuma review de implementação 019 |

Avisos `act` preexistentes permanecem sem correção fora do escopo. Nenhuma
dependência reinstalada, credencial usada, chamada paga ou alteração de runtime.
Checksums SDD correntes foram renovados após estabilização; o rebase das demais
reviews é mecânico e não renova suas evidências físicas ou verdicts históricos.

## Findings e próximo incremento — histórico de 2026-09-26

O modo default continua falhando fechado antes de reservar a etapa. A revisão
de 2026-09-26 acrescentou o client Vision v1 e testes `VisionResponseMapperTest`,
`VisionOcrAdapterTest`, `OcrConfigurationTest` e cenários completos no
`GatewaySchemaMigrationTest`. O servidor gRPC falso escuta apenas em loopback,
usa credenciais desabilitadas e não acessa o Google Cloud.

Foi corrigido o cancelamento sob redelivery: `CANCEL_PENDING` com etapa OCR
`RUNNING` não apaga o original nem encerra a etapa prematuramente. A verificação
adicional usa a PK já existente; sem migration ou índice novo. Testes também
cobrem rollback real e confirmação de commit perdida sem excluir manifesto válido.

Fixtures reais, revisão de qualidade e ativação operacional continuam abertas.
Nenhuma mídia real foi processada e os testes sintéticos não são apresentados
como evidência de precisão de reconhecimento.

## Gates offline — 2026-09-26

- Maven global `./mvnw test`: todos os sete módulos aprovados, incluindo 98 testes do gateway, sem falhas ou erros. PostgreSQL 17 Testcontainers validou V1–V2, concorrência e transações; nenhuma V3 foi criada.
- Testes leves do gateway: 82 aprovados antes da última regressão de cancelamento, também coberta pela execução global final.
- Terraform `fmt -check -recursive` e `validate`: aprovados, sem plan/apply/deploy.
- SDD: 23 testes dos validadores aprovados e links documentais válidos. Checksums globais renovados após estabilizar a documentação, sem renovar evidência funcional/física ou alterar os verdicts históricos das demais features.
- Web `tsc -b`: permanece bloqueado por `ReaderTopbar.tsx:33`, variável `status` não utilizada (TS6133), fora deste incremento.
- `pnpm check` mobile: não executou sua cadeia, pois o gerenciador tentou resolver/reinstalar dependências e falhou por acesso ao registry e ausência de TTY. Os comandos SDD foram executados diretamente com Node, sem reinstalação nem remoção de módulos.
- Formatação e whitespace: Prettier revalidado após formatar somente os documentos da 018; `git diff --check` aprovado. A antiga pendência de formatação do registry não se reproduziu na árvore atual.

Os testes de transporte usam exclusivamente um servidor gRPC local com credenciais
desabilitadas. A identidade ADC, IAM e qualidade do OCR ainda exigem validação
operacional autorizada; não estão cobertos como evidência real por estes gates.

## Preparação da avaliação e gate web — 2026-09-26

TASK-007 entrega o [protocolo OCR](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/protocol.md),
o [catálogo de 18 posições](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/catalog.md)
e os [modelos privados](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/templates.md).
AC-003 continua pendente de avaliação humana: não há imagens coletadas,
autorizações, transcrições revisadas ou resultados reais. Os modelos cobrem
autorização, custódia, CER Unicode/NFC, geometria, ordem e falhas sem métricas
inventadas. Nenhum script de execução paga ou calculador foi criado.

No web, a remoção visual prévia da linha de metadados foi preservada; a prop
`status` e seu repasse foram removidos dentro do slice `pages/chapter`, conforme
FSD, sem alterar layout ou domínio. `ReaderTopbar.test.tsx` exerce renderização
sem status, contador, callbacks acessíveis e seleção de capítulo. Antes do fix,
`tsc -b` reproduziu TS6133 e TS2741 no novo teste; depois passou. Os 32 testes do
leitor passaram. Maven global reexecutado: sete módulos aprovados, 98 testes do
gateway sem falhas/erros. Estes resultados substituem a pendência web do registro
histórico acima, não as pendências reais da 018.

### Fechamento deste incremento

- `vitest run --pool=forks`: 1.207 testes aprovados e 4 falhas em 2 arquivos, `Footer.test.tsx` e `HelpCenter.test.tsx` (marca/copyright e perguntas FAQ). Esses arquivos não foram alterados; a suíte web global não está verde.
- `lint:fsd`: primeira execução encontrou `EMFILE` nos watchers; repetição com `CHOKIDAR_USEPOLLING=1 pnpm --filter toonlira lint:fsd` aprovada, sem alteração da configuração versionada.
- `pnpm check` mobile foi tentado novamente e bloqueou antes dos scripts por `ERR_PNPM_META_FETCH_FAIL` e `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`. Nenhuma reinstalação ou remoção de módulos foi forçada.
- SDD executado diretamente: 23 testes dos validadores aprovados, `validate-specs.mjs` e `check-doc-links.mjs` aprovados após renovação dos checksums. A renovação registra a árvore documental atual, sem revalidar funcionalidades ou evidência física das outras features.
- Prettier dos documentos alterados e `git diff --check`: aprovados; sem formatação automática global.

O pacote documental está preparado e o erro de compilação do leitor foi resolvido.
As falhas externas da suíte web e o comando agregado mobile permanecem relatados
separadamente. Nenhuma imagem foi obtida, nenhum custo Vision foi disparado e
nenhum default de ativação, contrato de API ou estado da feature foi alterado.

## Coleta e revisão independente — 2026-09-26

O [registro de coleta](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/collection-review.md)
detalha entrega parcial de TASK-004, com pesquisa pública e protocolo/modelos 1.1.
Ruan é custodiante; destino e acessos ainda não confirmados e colaboradores ainda
não indicados. Não foram baixadas imagens, registradas autorizações ou recebidas
referências humanas. O catálogo mantém 18 posições planejadas; AC-003 continua
pendente de evidência real. TASK-007 não foi reaberta e TASK-005 segue pendente.

Revisão documental não substitui a confirmação por duas pessoas distintas nem
autoriza chamadas pagas. Nenhum contrato, default ou status da feature mudou.
As pendências históricas web/pnpm acima foram tratadas no
[registro separado dos gates](../../../active/gates-2026-09-26/review.md);
isso não transforma a preparação das amostras em avaliação OCR concluída.

Nesta parcela, `pnpm check` completo passou (109 suítes/674 testes Jest), assim
como os checks de catálogo, SDD, links, formatação direcionada e whitespace.
Os checksums correntes foram renovados após estabilizar tasks, sem alterar
conclusões históricas. A informação posterior de que Ruan é o único avaliador
disponível foi registrada no protocolo como triagem assistida em português;
não constitui revisão independente dos idiomas de origem.

## Piloto reutilizável após esclarecimento do usuário — 2026-09-26

Ruan autorizou guardar imagens licenciadas no projeto/computador para repetir
testes sem nova captura. O [pacote local](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/local-samples.md)
oferece 12 JPEGs de Pepper&Carrot (duas cenas em seis idiomas), com SHA-256,
licença/atribuição, verificação offline, restauração explícita e galeria com a
versão editorial pt-BR. Os binários ficam ignorados pelo Git e não são mídia
de produção. A retenção reutilizável não altera o cleanup remoto.

Esse piloto não exige reunir revisores para começar a depuração. A comparação
em português não aprova OCR de outros idiomas; as 18 posições independentes,
chinês tradicional, escrita vertical, página vazia e qualidade real continuam
pendentes. Não houve Vision, tradução remota, alteração de status/gate ou runtime
mobile. O histórico anterior foi preservado, sem declarar revisão humana recebida.

## Executor manual reproduzível — 2026-09-26

TASK-008 foi entregue como suporte de avaliação de TASK-004: CLI Node separada
da aquisição, harness exclusivo de testes, PostgreSQL 17 temporário, controller
real via MockMvc com filtros e relatório HTML offline. Nenhum endpoint, schema,
manifesto ou default de produção mudou. A escolha PostgreSQL preserva BCNF,
FKs/constraints e V1–V2, sem novo índice, contador ou migration.

Duas rodadas de `pt-ep01-p01`, com IDs `pt-p01-offline-20260926-a` e
`pt-p01-offline-20260926-b`, produziram somente saída **simulada**: etapa
`SUCCEEDED`, job `TRANSLATING`, uma RPC ao gRPC falso por rodada, hash confirmado
e limpeza sem pendências. A comparação foi regenerada por leitura local e o
reuso do ID foi recusado. As 12 imagens permanecem íntegras, sem novos downloads.

Timeout, indisponibilidade, upload/commit, confirmação perdida, concorrência e
cancelamento têm cobertura determinística. O modo real exige projeto, bucket
privado nos EUA, ADC e confirmação por chamada; não houve acesso real a Vision/GCS.
O navegador bloqueou a abertura automática de `file:`: inspeção visual do HTML
ficou pendente; estrutura, escape de texto e links locais foram testados por código.

Isso não aprova qualidade OCR nem revisão humana dos idiomas. TASK-004/005 e o
status `in-progress` são preservados. Comandos e recuperação de falhas estão no
[guia manual](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/manual-test.md).

Verificação desta parcela: testes Node de aquisição/executor (20), suíte leve
do gateway, `./mvnw test` global com sete módulos aprovados, type-check web,
`pnpm check` mobile completo (109 suítes/674 testes), SDD, links, Prettier
direcionado e `git diff --check`. A execução inicial Testcontainers foi bloqueada
pelo sandbox no socket Docker; a execução com acesso local passou. Os checksums
correntes foram renovados após estabilizar TASK-008, preservando os verdicts e
conclusões anteriores. A aprovação dos gates não fecha a avaliação OCR real.

A suíte completa final do módulo passou com 111 testes, incluindo 13 testes do
novo harness e a verificação de falha de cleanup sem ampliar a remoção. O Maven
global havia passado antes desse último teste adicional, com 110 testes do gateway.

## Preparação local de credencial, quota e captura — 2026-09-26

Continuação do executor de TASK-008, sem concluir TASK-004/005 ou mudar `in-progress`.
O modo real agora exige arquivo ADC impersonado explícito fora do Git, sem chave
privada, identidade alvo no mesmo projeto e confirmação por rodada. Storage e
Vision recebem o projeto de quota explicitamente; não há fallback para ADC pessoal.
Fixtures de credencial fictícias validam a configuração sem refresh ou rede.

O interceptor exclusivo de testes conserva a resposta protobuf antes do mapper,
limitada a 4 MiB e criada sem sobrescrita com modo `0600`. Metadados registram
hash, datas, origem simulada/real e código gRPC sanitizado, sem tokens ou conteúdo.
Captura indisponível impede sucesso da avaliação; timeout não produz resposta
inventada nem segunda chamada. O relatório revalida hashes e distingue ausência
de saída confirmada de resultado observado. Não há mudança em produção ou V1–V2.

Rodada `pt-p01-offline-raw-20260926-a`: **somente simulação**, uma RPC ao servidor
falso, `OCR=SUCCEEDED`, job `TRANSLATING`, captura de 121 bytes, hashes de manifesto
e resposta conferidos, imagem original íntegra e cleanup sem pendências. Relatório
regenerado por leitura local. Não comprova qualidade OCR ou autenticação Java real.

Testes focados Java aprovados com PostgreSQL 17/gRPC locais; a primeira execução
sem permissão de bind local falhou no sandbox, e a execução autorizada passou.
Maven global offline (`./mvnw -o -q test`) aprovado, sem failures/errors; 24 testes
Node, type-check web, SDD/links e `git diff --check` aprovados nesta parcela.
Instruções de captura e recuperação no [guia manual](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/manual-test.md).
Nenhuma credencial real foi carregada, nenhum upload ou chamada Google foi feito
nesta preparação. A revisão de acessos herdados e a primeira chamada real continuam
dependentes de autorização específica. Esta review é excluída do checksum SDD;
não se renovam checksums de implementações mobile inalteradas.

Verificação final complementar: suíte leve do gateway e `pnpm check` mobile
completo aprovados, incluindo 109 suítes/674 testes. Avisos React sobre `act`
apareceram em testes existentes, sem falhas; não foram corrigidos fora do escopo.
Comparação da rodada nova com a simulação anterior também regenerada sem provider.

## Diagnóstico estrutural offline — 2026-09-27

Parcela diagnóstica de TASK-004, conforme [guia](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/offline-diagnostic.md)
e [evidência datada](../../../../../api/apps/translation-gateway/docs/ocr-evaluation/offline-diagnostic-validation-2026-09-27.md).
Capturas existentes são inventariadas até palavras/símbolos, sem nova chamada,
com replay exato e artefatos privados separados. A geometria permite investigar
mistura interna de colunas; recuperação textual e qualidade vertical não estão
aprovadas. Reorganização não foi implementada e exige etapa própria.

TASK-004/005 permanecem abertas; status `in-progress` preservado. Nenhum runtime
mobile foi alterado. Esta adição à review é excluída do checksum SDD, portanto
não renova checksums de implementações inalteradas nem conclusões históricas.
