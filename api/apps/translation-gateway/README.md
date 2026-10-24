# Translation Gateway — `api/apps/translation-gateway`

Serviço Spring Boot separado da Core para a fronteira privada entre o aplicativo
mobile e o futuro pipeline de OCR, tradução e renderização. A primeira entrega
implementa somente contrato, identidade anônima, consentimento verificável,
idempotência, submissão de uma página, consulta e cancelamento.

O marco server-side de `MOB-FEAT-017` implementa identidade anônima, sessão
opaca, capabilities, submissão idempotente, consulta, cancelamento, quota,
outbox e cleanup. A fundação de `MOB-FEAT-018` acrescenta o perfil `worker`,
reserva única de OCR, revalidação da mídia e manifesto privado versionado.
O adapter Cloud Vision está implementado, validado offline e exercitado em
rodadas reais controladas nos sete idiomas. A consolidação técnica não encontrou
lacuna funcional; a 018 está em `verification-pending` por revisão independente
e operação abertas. A 019 está `verification-pending`: os
[contratos e validadores Java](docs/translation-contracts.md), adapter e
orquestração de tradução foram auditados offline, com manifesto, transações,
retenção/ACK e contratos locais. Os cenários PostgreSQL foram validados com Docker. A
[evidência do worker](../../../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-worker-offline-2026-10-02.md)
registra a revalidação; integração operacional,
qualidade real e consumo mobile continuam pendentes. A 020 está `in-progress/open`,
com [tasks de renderização](../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/tasks.md)
derivadas após a auditoria. Os [contratos do renderer](docs/rendering-contracts.md)
e manifesto final estrito estão codificados/testados. A preparação do
[codec WebP local](docs/rendering-codec.md) já possui round-trip nativo,
limites e falhas testados. As [fontes Noto](docs/rendering-fonts.md),
[caixa limpa geométrica](docs/rendering-paint.md) e
[composição raster com fallback](docs/rendering-text.md) estão codificadas
e testadas localmente nos sete destinos. O [adapter de arquivos](docs/rendering-files.md)
revalida JPEG/PNG/WebP e produz WebP/manifesto em storage temporário local,
com chamador opt-in no [worker](docs/rendering-worker.md). A [fronteira de persistência](docs/rendering-persistence.md)
tem reserva única, commit conjunto de imagem/manifesto, cancelamento e ACK/cleanup
testados no PostgreSQL. O worker local produz WebP/manifesto privados e READY
com inputs sintéticos nos testes integrais; nenhum provider real foi chamado
para essa prova. OCR conserva o original após sucesso, e o renderer o remove
após commit/terminal, mantendo o failsafe de uma hora. Expiração consultável e
entrega privada nas consultas estão codificadas/testadas offline. Distribuição
do codec e profiling continuam pendentes. A [fila de ciclo de vida](docs/lifecycle-retention.md)
reconcilia terminais e preserva retry de limpeza separado do ACK. Os workers
tentam remover os objetos elegíveis do próprio job ao finalizar, sem alterar
o resultado em falha de delete/SQL. Cancelamento terminal e esgotamento de
dispatch tentam a limpeza somente após commit; rollback não exclui objetos.
Na submissão, falha de confirmação da reserva consulta a posse exata do original
sob lock da instalação e snapshot independente antes de removê-lo. Estado
desconhecido não apaga upload potencialmente aceito nem repete reserva/quota.
Confirmação perdida nos workers resolve a falha condicional sob o lock do job
antes de reler vínculos e remover uploads não referenciados. Snapshot anterior
a um commit pendente não prova rollback; resolução desconhecida preserva objetos.
O [snapshot de retenção do original](docs/original-retention.md) conserva o prazo
publicado na primeira reserva, entre 1 e 3.600 segundos. Claim/commit revalidam
o deadline sob lock; replay não o renova. O locator privado permite purge pelo
storage mesmo com SQL indisponível, sem afetar o TTL independente de READY.
V8 é aditiva e foi aplicada somente no PostgreSQL temporário dos testes;
backfill de políticas históricas não padrão e exclusão cloud permanecem gates.
O [prazo imutável do resultado](docs/result-retention-snapshot.md), com V9 aditiva,
registra a política publicada e o deadline comum aos dois uploads. Consulta,
assinatura, commit e purge usam o limite aceito; configuração posterior não o
amplia. Locators permitem remover órfãos vencidos sem depender do SQL.
Schemas compartilhados, soft delete/backups e operação continuam não validados.
O [purge isolado por objeto](docs/cleanup-isolation.md) tenta limpar os demais
objetos elegíveis mesmo quando um locator, metadado ou delete falha. A rodada
incompleta continua retornando erro sanitizado; não reconhece sucesso parcial.
O [cleanup das referências de um job](docs/cleanup-owned-objects-2026-10-12.md)
também tenta os demais arquivos após uma falha; ACK/ciclo de vida permanecem
pendentes até todas as remoções terem sucesso, com retry e leases duráveis.
O [scan offline do pacote corrigido](docs/rendering-security-refresh-2026-10-12.md)
confere a identidade das imagens reconstruídas, mantendo explícitas as
vulnerabilidades residuais e as pendências de segurança/admissão operacional.
A limpeza por ACK suspende transação externa, preservando confirmação própria
mesmo se o chamador reverter depois. Confirmação/falha de dispatch exige posse
da tentativa PENDING; conclusão atrasada não muda outra lease nem dispara
limpeza. Cancelamento e dispatch terminal bloqueiam job antes da outbox;
recuperação acima do limite não cria nova task. A varredura privada por idade continua mesmo
quando uma fase SQL do cleanup falha; indisponibilidade de bootstrap/scheduler
ou storage ainda exige validação operacional. Não há resultado
operacional disponibilizado ao aplicativo. Ver a
[consolidação da tradução](../../../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-consolidation-2026-10-03.md) e a
[auditoria corrente](../../../mobile/docs/specs/features/MOB-FEAT-018-multilingual-ocr-regions/evidence/ocr-consolidation.md).
OCR e gateway permanecem desabilitados por padrão: nenhum provider é chamado
nesse estado e nenhum upload público deve ser
habilitado antes de políticas públicas revisadas e publicadas nas URLs
reservadas, disclosure versionado, integração real do worker e infraestrutura cloud válidos.

### Pares operacionais e contrato local — 2026-10-03

Os sete idiomas representam 42 pares possíveis, não 42 pares habilitados por
default. `gateway.translation.enabled-pairs` recebe uma lista explícita de
`origem:destino` (por exemplo, `ja:pt-BR,zh-Hant:zh-Hans`); aliases, duplicatas
e pares inválidos são rejeitados. Capabilities e worker usam o mesmo parser.
Capabilities publica os pares configurados na ordem canônica; em modo
`disabled`, publica uma lista vazia. A lista entra no ETag: reordenar a configuração
não o altera, remover um par o altera. Um gateway habilitado sem par operacional
falha fechado. Submissão fora da lista falha antes de ler mídia, upload ou quota.
O disclosure incompleto continua retornando `503`, mesmo com gateway desabilitado.

O mobile dispõe de um parser local estrito do manifesto traduzido `1.0`,
vinculado ao job, idiomas, hash do OCR, modelo e IDs/ordem originais. Ele preserva
texto opaco e aplica os limites UTF-16 de saída, sem download, escrita remota,
ACK ou renderer. Ver a
[evidência desta parcela](../../../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-capabilities-contracts-2026-10-03.md).
Nenhuma configuração operacional foi habilitada para esses testes.

O gateway também dispõe de leitura estrita do manifesto traduzido: bytes
limitados, SHA-256, UTF-8, versão/modelo, job/par, hash OCR e IDs/ordem são
validados antes de produzir o resultado de domínio. JSON ambíguo ou coercível
é recusado sem alterar o mapper compartilhado. Essa fronteira prepara o
renderer futuro; não implementa renderização ou aquisição mobile. Ver a
[evidência da leitura](../../../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-manifest-reader-2026-10-03.md).

O ACK server-side aceita somente o proprietário de um job `READY`, registra
um pedido durável e encerra a disponibilidade remota em uma transação.
Repetição retorna `202` sem reabrir o pedido; estado não pronto retorna `409`,
job ausente ou de outra instalação retorna `404`. O cleanup usa leases e
remove somente os objetos conhecidos do job, fora de transação, com recuperação
de falha parcial. Isso não cria um produtor de `READY`, download ou ACK mobile;
esses contratos dependem do renderer e da 021. Ver
[plano de integridade e limpeza](docs/result-acknowledgement.md) e
[evidência datada](../../../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-result-ack-2026-10-03.md).

## Contrato

O worker oferece [layout automático experimental](docs/layout-experimental.md),
desabilitado por padrão (`gateway.layout.mode=disabled`). Em `shadow`, quadros e
balões produzem artefato separado, sem modificar OCR `1.0` ou estados públicos.
Layout `1.1` registra supressão auditável de caixas quase idênticas antes da
associação; relatórios históricos `1.0` continuam legíveis. Sem nova migration.
O comando local `layout` reproduz captura existente sem credenciais ou nova chamada
Vision. Modelo/runtime exigem instalação explícita; nenhum modelo é baixado nas tasks.

Para executar uma imagem licenciada pelo worker em ambiente isolado e guardar
um relatório comparável, consulte o [teste manual reproduzível](docs/ocr-evaluation/manual-test.md).
O modo offline é simulado; Vision real exige opt-in por rodada e infraestrutura
pré-existente. O executor não integra o artefato de produção nem habilita uploads.
Resultados reais do piloto, aprovações exploratórias e lacunas estão na
[consolidação inicial datada](docs/ocr-evaluation/pilot-review-2026-09-27.md), sem concluir
a `MOB-FEAT-018` ou substituir o benchmark independente.
Para inspecionar palavras, símbolos e caixas de uma captura já salva, use o
[diagnóstico estrutural offline](docs/ocr-evaluation/offline-diagnostic.md).
Ele não chama o provider, reorganiza texto nem modifica o manifesto original.
O [agrupamento experimental por colunas](docs/ocr-evaluation/experimental-columns.md)
é um comando local separado: exige seleção/direção explícitas, preserva ambiguidades
e nunca substitui o manifesto ou corrige caracteres.
Os [controles tipográficos sintéticos](docs/ocr-evaluation/synthetic-calibration.md)
preparam referências conhecidas horizontal/vertical apenas localmente, sem OCR.
O utilitário usa Node.js e Java2D do JDK, sem Python ou dependências adicionais.
O [executor de calibração](docs/ocr-evaluation/calibration-worker.md) passa esses
controles pelo harness do worker e compara a captura, sem cadastrá-los como mangás.
Eles não substituem amostras reais ou revisão linguística independente.
Uma receita experimental fixa permite comparar espaçamento entre colunas,
preservando os glifos e o default original; ver
[protocolo e evidência](docs/ocr-evaluation/spacing-experiment-2026-09-27.md).
O modo real exige credencial impersonada isolada fora do Git, identidade alvo e
projeto de quota explícitos. Resposta protobuf bruta e manifesto ficam somente na
rodada local privada, com hashes; a validação offline não comprova OCR real.

O OpenAPI v1 está em
[`openapi/translation-gateway-v1.yaml`](openapi/translation-gateway-v1.yaml). A
consulta por idempotency key é parte obrigatória do recovery quando o receipt de
um `POST /v1/page-jobs` se perde após timeout.

## Persistência

PostgreSQL é o banco canônico do serviço. Flyway V1 cria:

- instalações anônimas com credencial armazenada somente como hash;
- sessões curtas com apenas o SHA-256 do bearer, expiração e revogação;
- jobs idempotentes por instalação;
- estados por etapa;
- outbox de dispatch para não depender de atomicidade entre PostgreSQL e Cloud
  Tasks.

Imagem e texto nunca são gravados no PostgreSQL. Objetos futuros permanecem em
storage privado efêmero.

Flyway V2 adiciona à etapa OCR apenas a chave opaca e o SHA-256 do manifesto,
com constraint que exige ambos quando a etapa é concluída. O conteúdo textual
fica exclusivamente no bucket privado. Etapas `RUNNING` sem avanço por mais de
15 minutos falham pelo cleanup, sem repetir uma chamada potencialmente cobrada.

V3 adiciona `processing_job_layouts`, metadados opcionais por job com FK composta
para etapa OCR e cascade. Referência de layout e conclusão OCR/job compartilham a
transação. Geometria permanece no objeto privado; falha experimental não invalida OCR.

V4 acrescenta à etapa `TRANSLATING` um CHECK que exige chave/hash do manifesto
quando ela estiver `SUCCEEDED`. Não cria tabela de regiões nem armazena texto no
PostgreSQL. O worker grava o manifesto traduzido no bucket privado, create-only,
e vincula chave/hash ao avanço para `RENDERING` na mesma transação. Objetos
órfãos são removidos por best effort e pelo cleanup de uma hora; etapa
`RUNNING` abandonada por 15 minutos falha sem nova chamada potencialmente
cobrada.

V5 adiciona um pedido de ACK por job, com FK cascade, timestamps e índice
parcial de pedidos pendentes. Não replica instalação, chaves de objetos ou
conteúdo. Registro do ACK e expiração do resultado são atômicos; claim,
conclusão e reagendamento conferem a lease antes de atualizar metadados.
ACK ou TTL absoluto controla a remoção remota. A projeção de cleanup já inclui
imagem final e manifestos; exclusões usam transações próprias de claim/confirmação
e storage fora de transação, inclusive quando o chamador possuir uma TX externa.

## Execução local

Uma [fronteira isolada em JVM filha](docs/rendering-isolation.md) também está
preparada e testada explicitamente: IPC privado, heap limitado, prazo supervisionado
e equivalência com a composição atual. A [admissão do JAR Boot](docs/rendering-archive.md)
executa explicitamente a main filha, sem iniciar Spring, inclusive com fontes
empacotadas. Ainda não é bean nem modo operacional; distribuição Linux/codec,
contenção atômica de processos, memória nativa/disco e integração supervisionada permanecem
pendentes. Não confundir esses testes com ativação ou profiling de produção.

O [supervisor da chamada](docs/rendering-call-deadline.md) limita a espera do
chamador também quando launcher/I/O não responde a interrupção. Timeout ou
cancelamento abandona a saída; execução, sinalização e limpeza continuam sob
posse exclusiva, sem admitir outra chamada antes da confirmação. Uma limpeza
não confirmada pode exigir restart. Não é contenção kernel nem altera o bean
`local` atualmente configurável no worker.

Há também uma [prova Linux ARM64 local](docs/rendering-linux.md), opt-in e sem
rede, com o mesmo JAR, Java 23 Alpine e codecs oficiais 1.6.0 fixados. O harness
usa somente fixtures sintéticas e imagem já adquirida explicitamente; não faz
pull/install nem adiciona Docker ao worker. Compatibilidade não conclui assinatura,
licenças transitivas, empacotamento ou contenção de produção.

O [profiling Linux de memória/scratch](docs/rendering-linux-resources.md) é um
opt-in próprio do harness. Página sintética de 80 milhões de pixels passou
com teto experimental de 4 GiB, mas falhou por OOM com 1 GiB. Esse resultado
não altera o orçamento cloud nem aprova AC-006: cópias nativas do CLI e
contenção operacional continuam abertas. A [preparação de build oficial](docs/rendering-native-build.md)
é local e separada, sem C próprio ou substituição automática do codec.

O [raster nativo compartilhado](docs/rendering-native-raster.md) prepara uma
superfície ARGB comum ao decode JPEG/PNG, compositor e futuro codec FFM Java.
Alias/lifetime e pixels equivalentes foram testados, mas esse seam ainda não é
chamado pelo worker nem elimina as cópias do CLI. Não baixa ou carrega biblioteca.

O [codec FFM local](docs/rendering-native-codec.md) já exercita encode ARGB
emprestado e decode BGRA externo, com lossless/exact e writer limitado. Somente
Linux ARM64 LP64 admitido e teste opt-in, sem novo bean ou substituição do CLI.
ABI/buffers/round-trip não aprovam orçamento máximo, contenção ou distribuição.
O probe de recursos FFM acrescenta decode/composição/encode e verifica todos os
pixels por hash no mesmo buffer, com páginas sintéticas máximas e falhas isoladas.
O source VP8L ainda mantém cópia integral de transformação e a medição
multicolor excedeu 1 GiB. Ver [evidência e limites](../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-native-resources-2026-10-04.md).
Esse probe não substitui o codec do worker nem altera orçamento/defaults.

Em 2026-10-05, Ruan escolheu manter libwebp com orçamento total medido.
O [plano de memória](docs/rendering-memory-policy.md) permite buffers internos
contabilizados, preservando lossless/exact e limites de entrada. O
[adapter FFM supervisionado](docs/rendering-supervised-native.md) está preparado
como construção explícita e testado no JAR Boot Linux. A parcela posterior de
[distribuição local](docs/rendering-native-distribution.md) acrescenta pacote
readonly relocável/pinado e seleção `supervised-native` exclusiva do worker,
sem fallback ou FFM no pai. Não aumenta RAM cloud nem admite produção.
Admissão de recursos do worker completo, contenção e distribuição operacional
continuam obrigatórias; a 020 permanece in-progress e a 021 bloqueada.

O opt-in nativo agora exige a [filha com limites Linux](docs/rendering-native-limits.md)
antes de fontes/decode, sem FFM no pai. CPU/endereço/arquivo/descritores são
limites self-only, não RAM do worker ou quota de staging. Heap da filha guardada
admite 64..128 MiB no bean nativo, default 128 MiB. A reserva anterior de
256 MiB deixava pouco endereço virtual para o encoder do JPEG máximo;
a correção preserva AS de 3 GiB e lossless/exact, sem elevar RAM cloud.
`clean-box-1.1` usa compressão método 0; 1.0 preserva método 4. É esforço de
compressão versionado, não redução de pixels/qualidade; o manifesto continua 1.0.
Máximos guardados passaram no harness histórico de
2 GiB, mas excederam 1 GiB; operação e defaults continuam fechados.

Proteção posterior self-only aplica/relê dumpable=0 antes de fontes/mídia,
sem alterar o coletor do host. O [harness Spring Linux](docs/rendering-worker-linux.md)
foi executado com SQL/storage/renderer reais e providers falsos. O
[registro local](../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-worker-linux-2026-10-07.md)
distingue sucesso funcional da insuficiência do orçamento candidato: máximo
com texto excedeu 2 GiB; diagnóstico explícito a 4 GiB concluiu o fluxo.
Não admite 1 GiB cloud, operação ou qualidade. Docker recuperou sem restart;
fotografias anteriores de indisponibilidade foram preservadas.

A [prova de OOM/recuperação](docs/rendering-worker-oom.md) estende somente o
harness: kernel OOM real, job pesado FAILED sem saída, pai vivo e página
seguinte READY no mesmo contexto, com reentrega/limpeza/integridade conferidas.
OOMKilled sozinho não identifica a vítima; há uma tentativa sem relatório
registrada como inconclusiva. Repetições locais não aprovam outras políticas
de kill, recursos cloud ou qualidade e não constituem correção de runtime.

O gate global seguinte reproduziu morte do pai em uma repetição; portanto
a recuperação não está admitida como confiável. A preferência OOM self-only
acrescentada à filha e a recusa de ambiente desconhecido são proteção parcial:
score +1000 foi confirmado, mas não eliminou as falhas do protocolo. Ver
[finding e tentativa](../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-worker-oom-2026-10-07.md).
Não anunciar isolamento completo nem habilitar o modo/cloud por esses testes.

O experimento posterior `address-bounded`, exclusivo do harness, demonstrou
falha preventiva da página máxima e recuperação da seguinte sem OOM de kernel.
Não altera o teto runtime, não substitui a prova de OOM real e não aprova
processamento máximo ou orçamento. O pacote ARM64 local também não é prova
de compatibilidade com o alvo Cloud Run x86_64. Detalhes e limites permanecem
no [protocolo](docs/rendering-worker-oom.md).

Na parcela posterior, pacote/ELF/runtime têm alvos explícitos ARM64 e x86_64/musl,
com rejeição de mistura, desconhecidos e divergência antes de carregar o codec.
O packager local aceita `--platform linux-x86_64-musl`, sem aquisição implícita
ou troca de qualidade. O codec e o worker Spring/SQL/storage passaram com inputs
sintéticos e providers falsos no x86_64 **emulado** local; ver
[evidência](../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-amd64-2026-10-07.md).
Isso reduz a lacuna funcional de arquitetura, não aprova Cloud Run, orçamento,
distribuição operacional ou resolve OOM compartilhado. Defaults cloud intactos.

A [preparação local Java 23/glibc](docs/rendering-glibc-preparation.md) fixou
bases Noble e compilou o libwebp upstream nos dois alvos, com bootstrap e
inferência ONNX sintética e probe FFM de codec. Não altera a distribuição
musl admitida, o runtime de produção ou seus gates; integração e orçamento
do worker completo nessa base continuam pendentes.

A [integração local glibc posterior](docs/rendering-glibc-integration.md)
acrescenta alvos explícitos, admissão pelo interpretador ELF do Java e
política fixa `MALLOC_ARENA_MAX=2` no pai/helper/filha nativos. Musl permanece
identificado; mistura é recusada antes de carga. Isso não integra o pacote à
imagem operacional nem admite orçamento/cloud ou ONNX combinado.

A [imagem nativa opt-in](docs/rendering-native-image.md) entrega uma candidata
glibc com JAR/pacote readonly pinados, preflight Java no build e usuário
não-root. Contexto exclusivo só inclui arquivos permitidos. Imagens locais
foram testadas sem JAR/libs do host; publicação, segurança da base histórica,
orçamento cloud e ativação continuam pendentes e não são automatizados.

O [experimento de teto virtual do pai](docs/rendering-parent-address.md) usa um
helper Java exclusivo dos testes para limitar o próprio worker no container,
sem FFM no pai ou privilégios extras. Máximos foram preservados; não é política
de produção, orçamento agregado garantido ou recuperação de OOM. Não altera
o JAR/defaults ou admite um teto cloud pelo diagnóstico local.

O [bootstrap atual do pai](../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-parent-bootstrap-2026-10-08.md)
prepara o próprio worker PID 1 por helper Java de produção curto, após
pré-checagem de recursos. Sem native access no pai/elevação de limite herdado;
confirmação binária e readback kernel, término antes de liberar arquivos.
Worker frio sem helper de teste foi executado nos dois alvos, providers falsos.
Não aprova orçamento/operação cloud ou fecha os findings de falha integral.

O renderer nasce desabilitado (`GATEWAY_RENDERING_MODE=disabled`).
O [harness de scripts/dimensões](../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-scripts-dimensions-2026-10-08.md)
separa texto nos limites com fallback de texto que cabe e é pintado, usando
fixtures UTF-16 distintas nos sete destinos e extremos de dimensão. Providers
continuam falsos, codec real; essa evidência não é revisão linguística ou
aprovação operacional. A [matriz posterior de formatos máximos](../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-maximum-formats-2026-10-08.md)
passou com WebP nos dois alvos, mas revelou falha funcional no JPEG válido de
80 milhões de pixels. A [correção posterior de headroom/política](../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-jpeg-headroom-2026-10-08.md)
concluiu JPEG/WebP máximos nos dois alvos sem alterar imagem/caps. Não admite
orçamento cloud ou a feature integral. Os resultados das regressões ampliadas
ficam na review vinculada à evidência; SDKs/layout residentes, qualidade e
operação continuam pendentes.
O adapter supervisionado mantém sua própria cópia comprimida limitada/hash
da entrada até a filha e a limpeza terminarem, inclusive se o worker liberar
seu arquivo inspecionado após timeout. Capacidade não volta enquanto a
operação privada estiver ativa. Ver [prazo e posse](docs/rendering-call-deadline.md).
Uma [prova posterior de falha controlada](../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-admitted-memory-fault-2026-10-08.md)
usa a mesma fábrica de produção/admissão e um launcher exclusivo dos testes:
somente o cap AS da primeira filha é apertado, sem mudar dados/qualidade.
Job pesado FAILED, seguinte READY, reentrega/limpeza/original e processos
reais encerrados conferidos. Não prova OOM agregado ou habilita operação.

A [prova de espaço temporário esgotado](../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-admitted-disk-fault-2026-10-08.md)
preenche somente o staging tmpfs limitado do job, em launcher exclusivo de
testes, após admissão real. Falha não entrega artefatos; cleanup libera espaço
e a página seguinte chega a READY. Não escreve pressão no disco do computador
ou bucket; não substitui validação de timeout/cancelamento e orçamento total.

O modo
`supervised-native` agora exige o [pré-requisito de memória](docs/rendering-memory-admission.md)
no bootstrap e antes de cada filha: caps finitos pai/filha, cgroup/scratch e
margem conhecida. JVM sem teto do pai ou ambiente insuficiente é recusado;
nenhum limite/cloud é alterado pela checagem. Diagnóstico local não é aprovação
operacional; os caminhos/relatórios anteriores são fotografias preservadas.
O modo
`local` é exclusivo do perfil worker e exige preparação explícita, sem download
automático: `GATEWAY_RENDERING_TEMP_DIR` absoluto/existente/privado,
`GATEWAY_RENDERING_ENCODER_PATH` e `GATEWAY_RENDERING_DECODER_PATH` absolutos,
seus respectivos `GATEWAY_RENDERING_ENCODER_SHA256` e
`GATEWAY_RENDERING_DECODER_SHA256`, e libwebp 1.6.0 admitido. O timeout nativo
`GATEWAY_RENDERING_NATIVE_TIMEOUT` tem default PT60S e teto de 60 segundos;
não é deadline global de decode/pintura. Fontes empacotadas são verificadas
somente ao preparar o modo local. Não apontar o diretório temporário para
imagens reutilizáveis ou artefatos históricos. Configuração inválida impede
inicialização; não há fallback, instalação de tools ou acesso ADC pelo renderer.

Essa configuração não habilita gateway/worker cloud, Vision, tradução ou
uploads; cada fronteira mantém seus gates próprios. A distribuição dos tools
e suas dependências para produção ainda não foi entregue.

O gateway/worker exige **Java 25 LTS**, com Spring Boot **4.1.1** em parent
próprio. O reactor continua agregando o módulo; Core, testing-support e jobs
permanecem em Java 23/Boot 3.4.3. Compilador e Surefire selecionam toolchain 25;
não há bypass experimental do Byte Buddy. Para execução do gateway, iniciar
Maven com `JAVA_HOME`/`PATH` apontando ao JDK 25. Para o reactor misto, iniciar
Maven com JDK 23 e fornecer `-t <toolchains.xml>` contendo um JDK 25 local.
O arquivo é configuração pessoal fora do Git; usar o modelo e os requisitos em
[migração Java 25](docs/java25-migration.md). Downloads/instalação são explícitos,
nunca feitos por uma task. Os digests das imagens também estão nesse registro.

A [triagem de segurança](docs/security-triage-2026-10-10.md) identifica os patches
candidatos. A [migração Boot 4 autorizada](docs/boot4-execution-2026-10-10.md)
registra os resultados atuais e os gates restantes; não constitui admissão de
produção nem autoriza publicação ou ativação.

A [atualização limitada da base Ubuntu](docs/native-base-update-2026-10-11.md)
prepara novas candidatas locais com proveniência explícita. O utilitário de
instalação é separado do empacotamento e exige opt-in; não é chamado por task
ou teste comum. A [triagem residual](docs/native-residual-security-2026-10-11.md)
distingue bibliotecas OS/JRE e limitações dos diagnósticos; qualquer novo runtime
exige aprovação de instalação e validação própria, sem troca automática do default.

O [candidato Ubuntu Java 25](docs/ubuntu-java25-preparation-2026-10-11.md) foi
preparado somente em imagens locais separadas. As dependências autorizadas de
fontes e o bootstrap foram validados no [registro próprio](docs/ubuntu-java25-fonts-2026-10-11.md).
O candidato ainda não é admitido operacionalmente; Temurin permanece o runtime
default. A instalação adicional não é feita durante tasks ou testes.

A [distribuição experimental com um JRE](docs/single-jre-runtime-2026-10-11.md)
retira a cópia duplicada em novas imagens locais, preservando pacotes e fontes.
Isso reduz o artefato, não aprova segurança, memória ou troca do runtime default.

O [empacotamento opt-in reproduzível](docs/single-jre-packaging-2026-10-11.md)
confere os recibos/archives selados e prepara contextos experimentais separados
com `scripts/render-single-jre-image.mjs`, sem Docker, rede ou instalação implícita.
O empacotador padrão continua com seu contrato Temurin; admissão operacional,
metadados de filesystem e segurança residual permanecem pendentes.

A [auditoria física do rootfs](docs/rootfs-archive-audit-2026-10-11.md) detectou
nomes Unicode alterados nos archives experimentais anteriores. O opt-in agora
rejeita esses recibos e exige comparação dos headers/conteúdos; o novo filtro
JavaScript preserva os bytes retidos. A [verificação Linux e reconstrução local](docs/native-metadata-runtime-2026-10-11.md)
registra as novas imagens corrigidas e as lacunas de atributos ainda não
verificadas. Elas continuam experimentais, sem admissão operacional; provas
funcionais das imagens antigas não são transferidas às novas.

A [galeria sintética de revisão visual](docs/rendering-visual-review-2026-10-12.md)
usa um harness exclusivo de testes e as imagens locais verificadas. O gerador
`scripts/render-visual-review.mjs` somente revalida artefatos e escreve um HTML
privado/offline; regenerar o relatório não executa renderer ou provider.
Inputs são de demonstração, não avaliação real de tradução ou aprovação humana.

```bash
cd api
./mvnw -pl apps/translation-gateway spring-boot:run
```

Configuração mínima:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/manga_translation_gateway
SPRING_DATASOURCE_USERNAME=manga
SPRING_DATASOURCE_PASSWORD=...
```

O serviço usa a porta `8084` por padrão. A configuração local nasce com kill
switch desligado e disclosure incompleto, portanto `GET /v1/capabilities`
retorna `503` e nenhuma operação de escrita é liberada. Para um teste local
explícito, configure valores legais de fixture, `GATEWAY_ENABLED=true` e
`GATEWAY_DISPATCH_MODE=local-ack`; esse modo nunca chama worker ou provider.

A imagem é construída usando `api/` como contexto; o `.dockerignore` exclui
artefatos, logs e arquivos de ambiente:

```bash
docker build -f apps/translation-gateway/Dockerfile -t translation-gateway .
```

Variáveis obrigatórias para habilitação real:

```text
GATEWAY_DISCLOSURE_VERSION
GATEWAY_OPERATOR_NAME
GATEWAY_OPERATOR_CONTACT
GATEWAY_PRIVACY_POLICY_URL
GATEWAY_TERMS_URL
GATEWAY_PROVIDER_TRAINING_POLICY
GATEWAY_STORAGE_MODE=gcs
GATEWAY_STORAGE_BUCKET
GATEWAY_DISPATCH_MODE=cloud-tasks
GATEWAY_GCP_PROJECT_ID
GATEWAY_WORKER_URL
GATEWAY_TASKS_SERVICE_ACCOUNT
```

### Configuração legal pública

[`infra/terraform/terraform.tfvars.example`](infra/terraform/terraform.tfvars.example)
registra os valores públicos já definidos, sem habilitar o serviço:

- operador: `Ruan Moraes`, pessoa física responsável pelo projeto;
- contato: `ruanmoraessantosbarbosa@gmail.com`;
- termos: `https://toonlira-rm.firebaseapp.com/legal/terms`;
- privacidade: `https://toonlira-rm.firebaseapp.com/legal/privacy`;
- contato complementar: `https://toonlira-rm.firebaseapp.com/legal/contact`.

As URLs estão publicadas com HTTPS e acesso direto, mas o disclosure operacional
`2026-09-07.v1` não cobre a tradução pelo endpoint global. O exemplo Terraform
deixa a versão vazia e o gateway retorna `503` até a revisão/publicação de nova
versão. A política de treinamento registrada segue a documentação oficial do
Google Cloud: conteúdo enviado ao Cloud Vision ou Cloud Translation não é usado
para treinar ou melhorar seus modelos. O runtime continua fail-closed. Antes de
habilitá-lo:

O contrato de capabilities agora separa `gatewayRegion=southamerica-east1`,
`ocrRegion=us` e `translationLocation=global`; o parser mobile recusa o campo
legado `processingRegions`. A versão legal anterior é recusada pelo gateway.
O [rascunho de localização](docs/location-disclosure-draft.md) serve apenas à
revisão futura; não altera as páginas legais publicadas.

1. garantir que Termos, Privacidade e Contato respondam `200` sem autenticação,
   inclusive em acesso direto às rotas;
2. obter a aprovação final do operador para a versão publicada dos documentos;
3. revalidar a política do provider se o produto ou contrato mudar;
4. disponibilizar o worker e só então avaliar `GATEWAY_ENABLED=true` em mudança
   operacional separada.

Referências do provider:

- [Cloud Vision — Data Usage FAQ](https://cloud.google.com/vision/docs/data-usage);
- [Cloud Translation — API overview](https://cloud.google.com/translate/docs/api-overview);
- [Vertex AI — zero data retention e training restriction](https://cloud.google.com/vertex-ai/generative-ai/docs/vertex-ai-zero-data-retention).

Operador, contato e URLs são informações públicas do disclosure e não pertencem
ao Secret Manager. Credenciais e segredos continuam fora de arquivos `.tfvars`.

Credenciais longas usam Argon2id. Bearers de 15 minutos são aleatórios e apenas
seu hash SHA-256 é persistido. Authorization, mídia, filename, path, URL
assinada e referências de job não entram nos logs da aplicação.

## Fluxo de submissão

O gateway valida a configuração, os metadados e a assinatura real de
JPEG/PNG/WebP enquanto copia o corpo para arquivo temporário limitado. A mídia é
enviada ao storage com chave aleatória; depois, uma transação PostgreSQL serializa
quota por instalação/dia, adquire lock global diário e grava `job + outbox`.
Replay com a mesma chave e fingerprint retorna o job existente; payload diferente
com a mesma chave retorna conflito. Objetos perdedores são removidos imediatamente
e o cleanup elimina órfãos após uma hora.

## Worker OCR (fundação)

O mesmo artefato inicia com `SPRING_PROFILES_ACTIVE=worker`. Nesse perfil,
somente `POST /internal/tasks/ocr` recebe `{ "jobRef": "UUID" }`; as rotas
`/v1` não são expostas. No Cloud Run, o serviço é privado e somente a service
account do Cloud Tasks recebe `run.invoker`. O handler revalida o original,
reserva a etapa em transação, valida o manifesto e avança o job somente após
upload create-only e registro atômico da chave/hash. Redelivery não chama OCR
novamente. Com `GATEWAY_OCR_MODE=disabled` (default), o runtime retorna
`ocr-unavailable` antes de qualquer reserva e não cria o client Vision nem busca
credenciais. Modo inválido falha no binding; modo vazio permanece desabilitado.

### Adapter Vision — código pronto, validação real pendente

O modo `vision` é exclusivo do perfil `worker` e exige `GATEWAY_GCP_PROJECT_ID`,
`GATEWAY_STORAGE_MODE=gcs` e bucket configurado. O client v1 oficial (Vision
3.58.0, alinhado com Storage/Tasks pelo Google libraries BOM 26.58.0) usa ADC,
endpoint fixo `us-vision.googleapis.com:443` e parent
`projects/{projectId}/locations/us`. Não existe fallback global ou chave de
service account versionada. Habilitar esse modo em um ambiente real é uma ação
operacional posterior, não parte da validação offline.

Após revalidar o original e reservar OCR, o worker envia somente a referência
GCS privada. Uma única chamada `DOCUMENT_TEXT_DETECTION` tem deadline de 60s,
sem retries GAX ou gRPC. O transporte limita a resposta a 4 MiB. Hints explícitos
preservam `ja/en/es/ko/zh-Hans/zh-Hant`; `pt-BR` usa `pt`, sem mudar o idioma
registrado no manifesto. Um hint orienta o provider, não garante o idioma reconhecido.

O worker OCR conserva o original após sucesso para tradução/renderização.
Após render válido ou estado terminal, os workers tentam removê-lo pelo
ciclo de vida durável; cancelamento e dispatch terminal fazem a tentativa
após commit. O teto absoluto de uma hora continua sendo failsafe, não prazo
renovável. A validação operacional integral permanece pendente e uploads
reais não estão habilitados.

### Tradução contextual — código offline em validação

`GATEWAY_TRANSLATION_MODE=disabled` é o default e não inicializa o client nem
usa ADC. O modo `google` existe somente no perfil `worker` e exige projeto,
storage GCS privado e pares explícitos em
`GATEWAY_TRANSLATION_ENABLED_PAIRS` (exemplo: `en:pt-BR,ja:pt-BR`). Não ligar
esse modo a uma task real sem aprovação de custo, publicação legal e revisão
operacional. Não há chamada Google nos testes comuns.

O adapter usa Cloud Translation Advanced v3 `general/translation-llm` com
parent/modelo `locations/global` e uma requisição HTML por página. Um envelope
de IDs opacos mantém o contexto; respostas sem associação integral, acima dos
limites ou de outro modelo falham fechadas. O client limita a 60 segundos e
desabilita retries automáticos. O worker lê e verifica o hash do manifesto OCR,
reserva `TRANSLATING` uma vez, evita chamada para página vazia, grava manifesto
privado próprio e somente então avança para `RENDERING`. Reentrega não repete
chamada cobrada. Tradução real, compatibilidade de marcação HTML do provider e
qualidade linguística ainda não foram verificadas.

Falha anterior à reserva não pode alterar uma etapa reservada por outra
entrega. O worker distingue essa falha da falha da execução ativa, com lock
transacional por job, sem manter transação durante storage/provider. Cancelamento
é confirmado na fronteira segura; reentrega não encerra uma chamada ativa.
Após confirmação perdida, chave/hash persistidos comprovam o manifesto válido,
mesmo se o job já tiver mudado de estado. Ver a
[evidência de reentrega](../../../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-delivery-safety-2026-10-03.md).

Cada parágrafo vira uma região, na sequência do provider, com UUID derivado do
job e da posição estrutural. Símbolos e quebras declaradas formam o texto, sem
espaços CJK inventados. Regiões vazias, duplicadas ou com quadriláteros inválidos
são descartadas individualmente; inconsistência de página/dimensões, excesso
de limites ou texto sem qualquer região válida falha a etapa inteira. Página
sem texto é válida. Os limites são 1.024 parágrafos, 4.096 caracteres por região,
262.144 caracteres totais e manifesto de 1 MiB, sem truncamento.

Os testes usam servidor gRPC em loopback com credenciais desabilitadas e fixtures
sintéticas, incluindo PostgreSQL real. Isso não comprova qualidade de OCR,
IAM implantado ou leitura real de GCS. Não executar teste pago sem aprovação.

### Preparação da avaliação de qualidade

Para testar com imagens já disponíveis, use o [pacote local reutilizável](docs/ocr-evaluation/local-samples.md):
verificação offline, restauração explícita e galeria lado a lado com a versão
editorial em português quando disponível. PNGs de livros ilustrados em chinês
tradicional têm licença e derivação próprias, sem comparação pt-BR presumida.
A capa histórica Tokyo Puck tem fonte CC0 específica, restauração apenas local
e aviso de conteúdo multilíngue/orientação mista nos relatórios. Sua simulação
não comprova reconhecimento vertical.
Não executa OCR nem tradução e não substitui o benchmark.

O [protocolo OCR](docs/ocr-evaluation/protocol.md) define autorização, referência
humana, CER e avaliação de regiões/ordem. O [catálogo planejado](docs/ocr-evaluation/catalog.md)
e os [modelos privados](docs/ocr-evaluation/templates.md) ainda não contêm imagens
ou resultados. Amostras autorizadas e revisão multilíngue permanecem pendentes;
preparar esses documentos não habilita Vision nem uploads.

A coleta formal segue o protocolo 1.2: custódia por Ruan e anotador/revisor
distintos por amostra. Material restrito mantém retenção de até 30 dias; o pacote
licenciado de desenvolvimento fica disponível para reutilização local, conforme
a orientação posterior do usuário. Quadrinhos têm prioridade; outros impressos ilustrados
são identificados separadamente. O [registro da coleta](docs/ocr-evaluation/collection-review.md)
distingue pesquisa pública, amostras admitidas e revisão efetivamente recebida.

## Expiração e remoção de resultados

Consultas de job por referência ou idempotência aplicam a expiração de READY
somente para a instalação autenticada e respondem com `Cache-Control: no-store`.
O prazo de resultado configurado no disclosure (máximo uma hora) começa na
conclusão de RENDERING; não amplia o failsafe separado do original desde upload.
Configuração de prazo inválida fecha a disponibilidade, sem estender retenção.

ACK ou TTL grava RESULT_EXPIRED e enfileira a remoção na mesma transação.
O cleanup consome essa fila fora de transação e tenta remover todos os objetos
do job, incluindo WebP e manifesto. Falha de delete permanece recuperável, sem
expor detalhes de storage. A limpeza genérica local limita-se ao prefixo
`private/` e não segue symlinks; não apaga a imagem reutilizável da avaliação.
O registro durável de remoção por TTL não é confirmação de download pelo app.

As consultas autenticadas expõem metadados e URLs privadas somente para READY
e quando o modo de assinatura estiver explicitamente preparado. Aquisição/ACK
do aplicativo pertencem à 021, que continua bloqueada. Ver o
[plano de expiração](docs/result-expiration.md).

### Preparação da assinatura privada

A porta e o adapter GCS estão integrados às duas consultas GET por referência
ou idempotência. READY exige `result` completo: versão do manifesto final,
dimensões e deadline, imagem WebP e manifesto JSON, cada um com URL, MIME,
bytes, SHA-256 e expiração efetiva. Não inclui texto, geometria ou chave privada
no envelope. GET usa no-store e serverTime do instante da resposta. Mutação ou
replay pode omitir os downloads; aquisição futura usa GET. Ver
[plano da consulta](docs/result-query-delivery.md) e
[plano da assinatura](docs/private-result-downloads.md).

A assinatura acontece fora de transação, entre dois snapshots owner-scoped
com TTL. ACK/expiração durante a operação suprime as URLs; alteração de
referência, falha ou metadata inválida não publica resultado parcial. Default
disabled retorna 503/storage-unavailable para READY, sem client/ADC/fallback.
Os testes usam storage/signer falsos e PostgreSQL local; isso não comprova IAM
ou download real. O parser mobile aceita o contrato estrito e não baixa,
persiste URLs, envia ACK ou promove READY local.

`GATEWAY_RESULT_DOWNLOAD_MODE=disabled` é o default. Somente preparação explícita
`gcs` permite client/ADC, exige storage `gcs`, bucket e projeto válidos, além de
`GATEWAY_RESULT_DOWNLOAD_PROJECT_ID` e
`GATEWAY_RESULT_DOWNLOAD_SIGNER_SERVICE_ACCOUNT` do mesmo projeto. Não criar
chave privada. A identidade usada para impersonação deverá poder gerar token e
assinar pela conta indicada; essa conta precisa ler os objetos privados do
bucket. Configurar IAM/API/ambiente exige etapa operacional separada, não é
executado por estes testes nem por Terraform neste incremento.

O adapter confere MIME, tamanho, geração e hash esperado nos metadados antes
de assinar GET V4 por até cinco minutos, sem ultrapassar o deadline do resultado.
Não baixa o conteúdo e não comprova sozinho seu hash: o cliente futuro deverá
verificar os bytes. URLs nunca são logs nem dados persistidos. ACK agenda
remoção durável, não revoga instantaneamente uma URL já emitida.

## Infraestrutura

Terraform declarativo fica em [`infra/terraform`](infra/terraform/README.md).
Ele declara Cloud Run gateway e worker condicional, Cloud Run Jobs de dispatch/cleanup, Cloud SQL sem IP
público, bucket privado, Cloud Tasks, IAM e Secret Manager, mas permanece com
`gateway_enabled=false` e `worker_enabled=false`. Não executar `terraform apply` sem as aprovações
externas registradas na spec.

O [perfil candidato nativo de 8 GiB](infra/terraform/README.md#perfil-candidato-nativo--somente-arquivos-locais)
é uma proposta local bloqueada para implantação, com 2 vCPUs e concorrência 1;
baseline/defaults e recursos ativos não mudaram. Não é aprovação de compatibilidade
Cloud Run, custo, segurança ou habilitação do renderer.

O [diagnóstico Java independente](docs/worker-isolation-probe.md) observa
controles de isolamento sem worker, bibliotecas nativas, providers ou credenciais.
Gera relatório local novo, distingue PASS/FAIL/UNKNOWN e nunca concede aprovação
operacional. Docker local e emulação não comprovam compatibilidade Cloud Run.
Sua imagem exclusiva usa Temurin 25 LTS por digest e continua separada do worker.
O worker agora também usa Java 25, mas isso não transforma a prova independente
em admissão operacional; triagem e aprovação de publicação permanecem abertas.
O [plano da prova cloud](docs/worker-isolation-cloud-plan.md) separa pré-flight,
imagem, recursos e execução única; cada execução exige autoridade compatível
com seu escopo e não concede aprovação geral de publicação/ativação.

O [roteiro operacional da 020](docs/rendering-cloud-validation.md) organiza
inventário, diagnóstico mínimo, admissão nativa e integração privada. Inclui
aceite, custos, recuperação, preparação e registros datados das provas reais;
não é autorização de ativação. Começa sem SQL, mídia ou providers. A
[evidência do eco da origem e orçamento](docs/worker-isolation-source-echo-budget-2026-10-14.md)
distingue imagem READY de conteúdo/geração não comprovados e documenta a
retirada dos recursos temporários; os gates de isolamento permanecem abertos.

A [verificação systemd local da prova mínima](docs/worker-isolation-systemd-verification-2026-10-15.md)
confere unidades revisadas sem executar o worker. O verificador é uma imagem
local separada, preparada mediante aprovação; não instala durante tasks ou
testes comuns. Sintaxe Ubuntu não comprova boot, montagem ou segurança no COS.

O [binding e pré-flight da montagem](docs/worker-isolation-mount-binding-2026-10-15.md)
separa contratos locais de coleta das consultas reais somente leitura. A prova
cloud continua condicionada à revisão do host, cotação e lifecycle de retirada;
isso não habilita o gateway nem admite o worker operacionalmente.

A [coleta HTTP e recuperação da retirada mínima](docs/worker-isolation-mount-transport-2026-10-15.md)
implementam adapters e journal privado, exercitados com API falsa. Não são
execução cloud: integração com staging, revisão do host e admissão financeira
integral continuam necessárias antes de criar a rodada mínima.

A [retirada integrada de Compute e staging](docs/worker-isolation-mount-lifecycle-2026-10-15.md)
acrescenta barreira de criações terminais e limpeza por gerações para escopo
completo conhecido, validada com API falsa. Criação parcial/ambígua, revisão
do host e cotação completas ainda impedem admitir uma nova rodada cloud.

O [registro progressivo e recuperação parcial](docs/worker-isolation-progressive-recovery-2026-10-15.md)
acrescenta fechamento para novos inserts e recuperação por UUID, testados
localmente. Consultas reais somente leitura conferem o formato das listas;
mutadores cloud continuam sem admissão operacional.

A [recuperação após interrupção e staging parcial](docs/worker-isolation-crash-recovery-2026-10-15.md)
substitui o mutex abandonável por publicação local atômica com lock do sistema
operacional e conecta a retirada parcial ao staging, com testes locais de crash
e API falsa. Não cria recursos: requests aprovados, mutadores Compute HTTP,
revisão COS e cotação completa ainda antecedem a rodada cloud.

A [revisão dos requests da rodada mínima](docs/worker-isolation-request-review-2026-10-15.md)
vincula os oito bodies canônicos aos planos e explicita a retirada necessária da
rota padrão automática antes da VM. Requests e plano de rota são propostas locais
não executáveis; journal/mutadores, revisão COS e admissão financeira continuam
necessários, sem relaxar o isolamento ou criar recursos.

A [retirada da rota própria com journal durável](docs/worker-isolation-route-journal-2026-10-15.md)
acrescenta GET/DELETE restritos, envio único e recuperação sem replay, testados
contra API falsa. Ainda exige ligação ao driver de criação/retirada completo,
revisão COS e admissão financeira antes de qualquer VM real.

O [driver com barreira da rota](docs/worker-isolation-guarded-driver-2026-10-15.md)
verifica recibo e rede antes do claim da VM e antes do encaminhamento do insert.
Validado com journals duráveis e criação falsa; sem admissão operacional, fica
fechado. A ligação do ciclo completo à admissão real continua pendente.

O [transporte HTTP de criação vinculado ao journal](docs/worker-isolation-create-http-2026-10-15.md)
acrescenta os oito POSTs canônicos, verificações frescas e envio único, validados
somente contra API falsa. Sem credencial real, criação cloud ou nova reserva;
admissão de custo e revisão COS continuam obrigatórios.

A [retirada integrada da rodada](docs/worker-isolation-teardown-2026-10-15.md)
agora inclui rota, Compute e origem, com envio único e reconciliação antes de
aceitar ausência. Validada apenas com API falsa; não executa cleanup cloud nem
conclui a ligação do ciclo completo à admissão operacional.

O [ensaio integrado do ciclo mínimo](docs/worker-isolation-cycle-2026-10-16.md)
liga criação, observação, rota, captura vinculada ao journal e cleanup, incluindo
cancelamento e reexecução sem replay. Seu relatório é exclusivamente simulado;
a ligação HTTP posterior está registrada abaixo. Admissão operacional permanece
pendente.

A [ligação dos leitores HTTP](docs/worker-isolation-http-readers-2026-10-17.md)
agora conecta contexto de rota e captura ao ciclo, com guards agregados antes da
VM e dos deletes e policy conferida antes do boot. Testada somente com servidor
falso; respostas reais dos recursos, segurança COS e admissão de custo continuam
abertos. O [pré-flight posterior](docs/worker-isolation-read-preflight-2026-10-17.md)
renovou projeto/SO/APIs e o subconjunto IAM de observação, sem criar recursos ou
aprovar a operação.

O [suplemento de custo e segurança](docs/worker-isolation-cost-supplement-2026-10-17.md)
renova preços regionais e discrimina operações/importação, preservando o envelope
como provisório e a revisão COS aberta. Não autoriza VM nem execução do worker.

A [reconciliação do schema observado](docs/worker-isolation-schema-reconciliation-2026-10-17.md)
registra consultas reais somente leitura, o pré-flight inconclusivo e a revisão
local v2 dos leitores para escopos vazios/coleção omitida. IAM da imagem e acesso
Storage no recurso correto continuam pendentes; nenhum grant ou recurso criado.

O [plano de ligação do staging](docs/worker-isolation-staging-handoff-plan-2026-10-17.md)
preserva a abertura da lacuna e sua primeira parcela, o journal durável local.
O [produtor e handoff posteriores](docs/worker-isolation-staging-transport-2026-10-17.md)
estão codificados e testados localmente, incluindo upload/readback e integração
com o ciclo v2 por HTTP falso. Não comprovam gerações GCS reais, boot COS ou
admissão operacional; não há comando real liberado nem novo recurso cloud.

A [recuperação parcial do staging](docs/worker-isolation-staging-recovery-2026-10-17.md)
está codificada e testada em tooling local separado. Exige produtor
vinculado e realmente encerrado, journal durável e admissão própria; não presume
término após crash nem repete DELETE ambíguo. Os testes não excluem recursos reais.

A [revisão de admissão](docs/worker-isolation-admission-review-2026-10-17.md)
confere o término automático já implementado e registra a leitura IAM 403 da
imagem COS. Não transforma metadata disponível em autorização de boot nem
altera IAM para resolver o diagnóstico.

A [reprodução de criação recusada](docs/worker-isolation-rejected-create-2026-10-17.md)
identifica uma lacuna na retirada do ciclo local v2 e entrega a fundação de
journal separado para registrar recusas sem inventar operações. A
[integração v3](docs/worker-isolation-rejection-integration-2026-10-17.md)
acrescenta retirada delimitada e handoff compatível no harness local; não libera
nova criação cloud nem resolve automaticamente operações ambíguas.

A [saída de limpeza para fonte verificada](docs/worker-isolation-verified-source-cleanup-2026-10-17.md)
usa claim exclusivo e transporte sem criação Compute. É um componente do
supervisor local, não um executor cloud aprovado ou recuperação automática de
fonte já entregue/crash.

O [supervisor local](docs/worker-isolation-supervisor-2026-10-17.md) conecta esses
componentes por checkpoint durável, com posse confirmada e admissão raiz
expirável. O entrypoint operacional e a validação cloud ainda não estão liberados.

A [preparação do operador](docs/worker-isolation-operator-preparation-2026-10-17.md)
adiciona `prepare/report` locais e registra duas leituras reais: faturamento
habilitado, conta aberta, moeda BRL. A cotação anterior USD continua provisória;
`execute` permanece bloqueado, sem nova reserva ou recurso cloud.

A [leitura da tabela da conta](docs/worker-isolation-account-pricing-2026-10-17.md)
registra SKUs BRL/USD e a taxa do próprio Google, com reprodução local do cenário.
A moeda foi esclarecida, mas tributos/premissas e admissão integral continuam
pendentes; isso não libera o entrypoint ou o renderer.

A [composição nativa dos journals](docs/worker-isolation-native-journals-2026-10-18.md)
reúne persistência Java real em workspace exclusivo para o operador. É uma
parcela local da preparação server-side, sem transporte/credenciais ou liberação
de `execute`; validação cloud e admissão do worker completo continuam pendentes.

A [composição concreta do operador](docs/worker-isolation-composition-2026-10-18.md)
liga esses journals ao supervisor e às fases de criação/retirada, exercitadas
com transporte e credenciais falsos. Identidade/transporte nativos foram depois
codificados e testados offline; tickets de admissão, integração ao CLI real e
validação cloud continuam pendentes.

A [ligação de identidade/HTTP nativos](docs/worker-isolation-native-io-2026-10-18.md)
acrescenta loader lazy e transporte delimitado, ambos exercitados com dependências
falsas e journals reais. Não usou credenciais reais nem libera `execute`:
ticket operacional, ligação ao CLI e validação cloud continuam pendentes.

A [decisão corrente de admissão](docs/worker-isolation-admission-status-2026-10-18.md)
separa implementação local de prova cloud e estimativa de cobrança efetiva.
Criação continua fechada; não há corte financeiro garantido pelo ledger local.

A [autorização posterior de USD 100 totais](docs/worker-isolation-budget100-2026-10-18.md)
substitui o teto financeiro anterior, preservando o histórico. O novo ledger
local e o preflight autenticado somente leitura foram executados; não são
admissão do worker, prova de isolamento ou autorização irrestrita de recursos.

A [primeira tentativa nativa e recuperação](docs/worker-isolation-native-attempt-2026-10-18.md)
exercitou staging e VPC reais, sem criar VM. A ausência ativa dos recursos foi
confirmada em recuperação separada. Uma lacuna de espera das operações Compute
foi reproduzida; nenhuma nova rodada será confundida com retry da mutação anterior.

A [correção posterior da espera Compute](docs/worker-isolation-operation-polling-2026-10-18.md)
acompanha operações pendentes por GET limitado, sem repetir a mutação. A validação
local não substitui nova prova cloud nem admite o worker completo.

A [segunda rodada nativa](docs/worker-isolation-second-native-attempt-2026-10-18.md)
ultrapassou essa falha e criou imagem/disco de dados, mas parou antes da VM.
Seus recursos ativos foram retirados; o lock foi preservado até corrigir
campos vazios omitidos e a intenção de criação não enviada. A normalização e o
[protocolo de envio v4](docs/worker-isolation-unsent-journal-2026-10-18.md) já
foram integrados e testados offline. A ligação ao operador de execução e sua
admissão nativa ainda estão pendentes. A 020 segue aberta.

O [preparo local do operador v4](docs/worker-isolation-v4-preparation-2026-10-18.md)
revalida as evidências e exige fontes financeiras válidas para toda a janela
de limpeza. Os preços e o vínculo de faturamento foram renovados por leitura;
o comando `prepare` não concede execução nem cria recursos ou reservas.
A [ligação do executor v4](docs/worker-isolation-v4-executor-2026-10-18.md)
foi consolidada offline, com histórico da falha intermitente preservado.
Somente a prova restrita de montagem pode ser admitida; worker completo e
resultado operacional continuam pendentes.

A [terceira prova nativa](docs/worker-isolation-third-native-attempt-2026-10-19.md)
chegou ao disco de boot, mas parou antes de enviar a criação da VM. O próprio
supervisor retirou os recursos ativos e preservou a intenção não enviada.
O bloqueio pré-VM exige investigação offline; não aprova montagem ou renderer.

O [diagnóstico pré-VM](docs/worker-isolation-prevm-preflight-2026-10-19.md)
reproduz o orçamento aninhado com latência sintética e registra um candidato
que separa preparação de envio, sem remover guards ou aumentar timeouts.
A consolidação e a próxima admissão nativa permanecem separadas.

A [quarta prova nativa e recuperação](docs/worker-isolation-fourth-native-attempt-2026-10-19.md)
ultrapassou a preparação pré-VM, mas o POST da VM recebeu HTTP 400 e não foi
repetido. A retirada explícita confirmou ausência ativa dos recursos,
preservando intenção, dispatch e lock originais. A auditoria confirmou a
incompatibilidade de E2 padrão com `TERMINATE`; um perfil compatível ainda
precisa de validação. Montagem, worker completo e renderer não foram aprovados.

O [contrato Spot offline](docs/worker-isolation-spot-contract-2026-10-19.md)
introduz um perfil explícito para a próxima prova restrita, com request e
metadata validados separadamente. Não contém executor nativo nem reutiliza
cotações vencidas; a implementação offline não aprova a operação do worker.
O [protocolo de rejeição HTTP 400](docs/worker-isolation-http400-protocol-2026-10-19.md)
acrescenta observação exata e retirada conservadora em um novo journal local,
preservando os registros e locks da tentativa real anterior.

A [preparação da admissão Spot](docs/worker-isolation-spot-admission-preparation-2026-10-20.md)
separa a cotação das SKUs corretas da observação real de quotas, sem criar
recursos. O regime de quota preemptible com limite zero exige esclarecimento;
nenhum fallback para quota padrão ou novo executor nativo foi aprovado.
A [integração offline da admissão ao CAS5](docs/worker-isolation-spot-admission-offline-2026-10-20.md)
vincula perfil, bundle, preços, billing e quota, preservando cleanup. O teste
integrado corrigiu uma divergência de ordem no hash; não foi executado com
credenciais reais nem liberou a criação enquanto a quota permanece inconclusiva.
A [investigação N1 custom](docs/worker-isolation-n1-investigation-2026-10-20.md)
conferiu metadados e preços de uma alternativa STANDARD explícita, mantendo
1 GiB para a prova restrita. Não cria recursos nem aprova o worker completo.
O [contrato/admissão N1 offline](docs/worker-isolation-n1-contract-2026-10-20.md)
integra perfil, metadados efetivos, CAS5 e transporte. A execução cloud continua
sem admissão até preparar o operador específico e renovar as leituras.
O [preflight N1 real](docs/worker-isolation-n1-preflight-2026-10-20.md)
foi implementado e recusou a imagem COS pinada, agora depreciada. A substituta
foi apenas consultada; não houve troca de imagem ou criação de recurso.
A [revisão explícita COS73916](docs/worker-isolation-cos-revision-2026-10-21.md)
prepara novos contratos/pins e registra cinco consultas reais correspondentes,
sem adotar journals anteriores ou admitir uma execução operacional.
O [operador COS73916](docs/worker-isolation-n1-operator-2026-10-21.md)
foi integrado e testado offline, incluindo 33 alvos anteriores e os vínculos
financeiros. A preparação permanece fechada sem cotação/billing atuais pinados;
nenhuma VM ou reserva nova foi feita nessa parcela.

A [primeira execução N1 posterior](docs/worker-isolation-n1-first-execution-2026-10-21.md)
renovou as leituras e criou somente staging privado. A composição parou antes
de qualquer POST Compute; objeto e bucket foram retirados com verificação de
ausência. A causa da recusa segue em diagnóstico offline, sem repetir criação
ou aprovar o worker completo.

A [correção local do ticket de dispatch](docs/worker-isolation-dispatch-freshness-2026-10-21.md)
reposiciona os guards sem ampliar o prazo de um segundo e preserva as janelas
separadas de preparo/POST. A composição candidata foi revalidada offline;
O [operador novo com dispatch corrigido](docs/worker-isolation-fixed-operator-2026-10-22.md)
integra essa revisão com pins próprios e reconferência da retirada anterior.
A preparação financeira e a prova cloud continuam separadas, sem aprovação
antecipada de montagem ou do worker completo.

A [reconferência financeira e de pré-requisitos](docs/worker-isolation-financial-readiness-2026-10-22.md)
confirmou os alvos ausentes, mas a cotação do Console foi recusada por divergência
de data. A sondagem da API oficial de preços abriu uma alternativa de leitura;
seu contrato completo ainda precisa de implementação, sem relaxar o gate atual.

O [contrato de cotação pela API](docs/worker-isolation-api-pricing-2026-10-22.md)
foi implementado posteriormente e passou na coleta real das sete SKUs em duas
moedas. Sua integração ao operador ainda precisa de revisão e teste integral;
nenhuma reserva ou criação de recursos decorreu dessa captura.

A [integração do operador API e sexta prova restrita](docs/worker-isolation-api-operator-native-2026-10-22.md)
passou nos gates locais/globais, mas a prova cloud parou em metadados antes de
POST Compute. O staging foi retirado; a investigação local identificou contenção
em leituras concorrentes do ledger. Não houve aprovação da montagem/worker.

A [verificação serial de reserva](docs/worker-isolation-serial-reservation-2026-10-22.md)
corrige essa contenção e exercita o leitor financeiro real com HTTP falso.
O novo operador exige reconferir também o sexto escopo retirado; evidência
offline não substitui a prova nativa nem os gates do worker completo.

Na prova posterior, os recursos anteriores à VM foram criados e retirados,
mas a verificação de rotas interrompeu o envio da VM. A ausência ativa foi
confirmada, sem recuperação manual pendente; montagem e worker seguem abertos.

A [barreira de rotas preparada offline](docs/worker-isolation-route-barrier-offline-2026-10-23.md)
preserva as conferências e os prazos, sobrepondo apenas GETs independentes.
Não houve nova prova cloud ou admissão do worker completo nesse incremento.

O [operador com a barreira integrada](docs/worker-isolation-route-operator-native-2026-10-23.md)
foi preparado posteriormente com reconferência da última retirada, gates
offline e dados financeiros atuais. A prova restrita é separada da aprovação
operacional do worker completo.

Essa tentativa parou antes de reservar/criar recursos: a imagem COS fixada foi
marcada `DEPRECATED` pelo publisher. A substituta está apenas identificada por
metadados nessa fotografia; o operador recusado não será reutilizado.

A [revisão explícita COS7608](docs/worker-isolation-cos7608-offline-2026-10-23.md)
prepara pin, preflight, requests, bindings e grafo separado com testes offline.
Não instala a imagem nem substitui a integração do operador e a prova nativa.

A [integração COS7608 e sua recuperação](docs/worker-isolation-cos7608-operator-2026-10-23.md)
foram executadas posteriormente. A rodada não comprovou montagem; seus recursos
temporários foram retirados, preservando grant, locks e recibos. A recusa entre
grant e transporte exige diagnóstico offline antes de outra VM; não habilita
o worker completo.

O [diagnóstico local do envio da VM](docs/worker-isolation-vm-send-diagnosis-2026-10-23.md)
reproduz a verificação adicional entre grant e transporte. Um candidato
paraleliza leituras independentes sem relaxar os gates; ainda não está
selecionado para execução cloud.

O [grafo separado de escopo VM pareado](docs/worker-isolation-vm-scope-graph-2026-10-23.md)
foi testado com o coordenador integral e transportes sintéticos. Sua seleção
local não altera o operador encerrado nem aprova uma nova execução cloud.

O [diagnóstico passivo da fronteira VM](docs/worker-isolation-vm-boundary-trace-2026-10-23.md)
separa escopo final, admissão nativa e invocação do transporte, sem registrar
conteúdo sensível ou conceder autoridade para envio/limpeza. Sua
[integração posterior no operador](docs/worker-isolation-vm-trace-operator-2026-10-23.md)
comprovou um envio da criação VM, recusado por capacidade da zona; todos os
recursos ativos da rodada foram retirados. Uma alternativa na mesma região
passou somente pela consulta de metadados. Montagem, boot e isolamento do worker
completo continuam pendentes; nenhum gate de produção foi aberto.

O [grafo candidato na zona B](docs/worker-isolation-zoneb-graph-2026-10-23.md)
foi posteriormente validado com coordenador integral e transporte simulado,
mantendo a zona consistente em plano, journals e cleanup. Não está selecionado
em operador cloud naquela fotografia. A
[integração posterior do operador B](docs/worker-isolation-zoneb-operator-2026-10-23.md)
incluiu a nona retirada e chegou à execução real; uma leitura CRM recebeu 429
antes de criar a VM. Recursos ativos foram retirados, sem boot/montagem aprovados.
A comparação posterior de quota project foi somente leitura e não habilita uploads.

O [candidato com projeto de cota explícito](docs/worker-isolation-crm-quota-native-2026-10-23.md)
deriva o header apenas para leituras admitidas do Resource Manager e acrescenta
checagem de cancelamento após admissão. Sua preparação local foi seguida pela
integração no operador descrito abaixo; a fotografia anterior fica preservada.

A [guarda da décima retirada](docs/worker-isolation-tenth-retirement-2026-10-23.md)
acrescenta os alvos do último contexto encerrado e integra sua exigência ao
coordenador offline. Essa composição foi depois selecionada pelo novo operador;
o resultado real e seus limites ficam no registro seguinte.

O [operador com cota explícita](docs/worker-isolation-quota-operator-2026-10-24.md)
seleciona esses componentes em uma entrada nativa separada, com recibos próprios,
captura financeira e guarda da primeira rodada. O pedido de VM foi recusado por
capacidade e os recursos da rodada foram retirados. O candidato N2 passou por
consultas de metadados e depois pela
[preparação offline do perfil e das proteções](docs/worker-isolation-n2-preparation-2026-10-24.md).
A [integração offline posterior do coordenador N2](docs/worker-isolation-n2-coordinator-2026-10-24.md)
acrescenta leitores/quotas próprios e sua composição com os guards. A entrada do
próximo operador, sua cotação real, montagem e admissão do worker completo seguem
abertas.

## Testes

A [investigação urgente de renderização híbrida](docs/hybrid-rendering-options-2026-10-18.md)
compara instruções/overlay, patches seletivos e página limpa. A implementação
continua no servidor; nenhuma opção híbrida está implementada ou admitida.
Prioridade e aceite ficam em [DT-76](../../../docs/tech-debt.md#dt-76-renderização-híbrida-de-tradução--urgentep1).

```bash
./mvnw test
./mvnw test -Dtest.excludedGroups=testcontainers
```

A validação do schema usa PostgreSQL 17 em Testcontainers; H2 não é aceito para
esta migration.
