# ACK: exclusão antes de 202 — plano local

PostgreSQL continua dono da intenção durável. A tabela V5 existente tem
`job_id` como PK e FK para `processing_jobs(id) ON DELETE CASCADE`, com
`requested_at`, `next_attempt_at` e `completed_at` tipados e restrições de
ordem temporal. A dependência funcional é `job_id → timestamps`; seu único
determinante é chave candidata. Não há nova coluna, enum, contador ou cache.
O índice parcial `(next_attempt_at, job_id) WHERE completed_at IS NULL` serve
a reconciliação em lote; a PK serve claim e confirmação por job, sem índice
adicional. Não é necessária migration nem mudança de entidade.

A transação curta identifica o proprietário, registra intenção idempotente e
transiciona a consulta a RESULT_EXPIRED. Outra transação reivindica somente a
intenção correspondente se elegível e devolve as referências já autorizadas.
O storage é acessado sem transação. A confirmação exige a lease ainda vigente;
falhas preservam retry e retornam 503 temporário. Um ACK repetido retorna 202
somente após confirmação durável. Um concorrente que encontra lease ativa
recebe 503 em vez de declarar a exclusão concluída. TTL e scheduler continuam
usando a mesma fila e respeitam a lease. O ACK não depende de credenciais de
produção nos testes locais.

A mudança exige regressões de PostgreSQL real, falha parcial e retry,
concorrência, isolamento por owner, resposta HTTP, confirmação perdida e teste
do worker integrado, além dos gates do repositório. Este plano não substitui a
verificação desses critérios nem aprova publicação, segurança ou operação.

## Gerações versionadas — implementação local

O adapter GCS lista versões com prefixo do objeto e filtra o nome exato. Apaga
cada geração por `BlobId` com geração e repete a listagem: uma geração ainda
visível, falha na enumeração ou mais de 256 itens examinados impede confirmação
e mantém retry. Objetos vizinhos com mesmo prefixo não são removidos. O sweep
por prazo também lista versões e as remove identificadas por geração. O processo
exige permissão de listagem além da exclusão; esse requisito não foi validado
em IAM real. Testes usam SDK simulado e não invocam GCS.

A documentação do Google informa que exclusão sem geração pode deixar uma
versão não atual acessível, e que soft delete pode conservá-la para recuperação:
[Object Versioning](https://docs.cloud.google.com/storage/docs/object-versioning)
e [Objects: delete](https://docs.cloud.google.com/storage/docs/json_api/v1/objects/delete).
A ausência de versões listáveis não demonstra eliminação física de objetos sob
soft delete, nem garante configuração, permissões ou operação do bucket real.
O Terraform local declara `roles/storage.objectAdmin` para a identidade do
gateway no bucket temporário; isso é configuração declarativa e não demonstra
as permissões efetivas nem cria ou altera recursos.

O comando focal `./mvnw -o -pl apps/translation-gateway -am test
-Dtest=GoogleCloudStorageAdapterTest,GoogleCloudPrivateDownloadAdapterTest,AcknowledgeResultUseCaseTest,CleanupAcknowledgedResultsUseCaseTest,ResultRetentionPersistenceTest
-Dsurefire.failIfNoSpecifiedTests=false` passou com 68 casos, nenhum skip. O
XML de storage foi preservado em `.local/worker-isolation/repro-020-2026-10-26/`
`gcs-generation-2026-10-28/storage.xml`, SHA-256
`9c9561ec776df6afd99e1b3182553fd7bd4f937f2a962a550a812d58515d2212`.

## Prazo durante leitura — 2026-10-28

Uma regressão reproduziu a abertura do original depois do prazo quando a leitura
prévia dos manifestos avançou o relógio até o limite. O worker agora revalida
retenção imediatamente antes de abrir o original e após sua inspeção, antes de
reservar ou renderizar. Outra regressão cobre prazo atingido durante a leitura:
a página falha sem reservar ou produzir resultado, e o snapshot é limpo. Os
139 testes focados passaram; logs red/green e XML estão em
`.local/worker-isolation/repro-020-2026-10-26/retention-deadline-2026-10-28/`.
Uma nova regressão mostrou que um stream já aberto podia efetuar outra leitura
após o prazo. O worker agora confere o menor prazo entre uma hora e a expiração
embutida na chave, antes e depois de cada leitura. Os testes cobrem também o
prazo embutido mais curto: 42 testes focados passaram. Logs red/green e XML
estão em `.local/worker-isolation/repro-020-2026-10-26/retention-stream-2026-10-28/`;
o XML tem SHA-256
`c12f3903e2349efe06e37ff67ac5d3412e209d4c0a12181a3725d9cbf470fd7c`.
Uma operação de leitura bloqueada não é interrompida pelo guard. Essas
verificações também não garantem exclusão física pontual: o scheduler
configurado é de cinco minutos e soft delete depende do bucket real.

Uma regressão adicional demonstrou que uma expiração mais curta embutida na
chave já vencida ainda permitia abrir o storage antes da primeira leitura. O
worker passou a verificar esse prazo imediatamente antes da abertura. Foram
aprovados 145 testes focados, incluindo PostgreSQL; o XML está em
`.local/worker-isolation/repro-020-2026-10-26/expired-key-2026-10-28/worker.xml`,
SHA-256 `4cb729951dbf02ed7ab3dcb272b48e8b0733d5de3dd066cdb186aac641a21331`.
Isso não interrompe a abertura ou leitura já bloqueada no storage.

Uma regressão com leitura bloqueada e relógio controlado confirmou que o worker
permanece aguardando enquanto o storage não retorna. Após liberar a leitura
depois do deadline, o worker falhou sem claim ou render, removeu o snapshot
temporário e não produziu resultados. A regressão não demonstra interrupção
nem exclusão remota pontual; usou storage local instrumentado e persistência
simulada. Os 44
testes focados passaram; XML local em `blocked-read-2026-10-28/worker.xml`,
SHA-256 `f4cb00bf4cdee73586876811f3b51bb2c20fb59fa8092530f6298e05f10a7575`.
Uma segunda regressão bloqueou a abertura: após o retorno tardio, o stream foi
fechado, o snapshot removido e nenhum claim, render ou resultado ocorreu. Os
42 testes da classe passaram no gate global; o XML `worker-open-read.xml` na
mesma pasta tem SHA-256
`50f01db709b312a5532c5bfaac04b64e3b928e9d418b0ac233492d47ebdef093`.

Inspeção local do SDK fixado: `google-cloud-core-http` 2.77.0 expõe
`HttpTransportOptions.Builder.setConnectTimeout` e `setReadTimeout`; o adapter
atual usa `StorageOptions.getDefaultInstance()` e a interface `ObjectStoragePort`
não recebe deadline nem oferece cancelamento. Os timeouts gerais, por si só,
não comprovam encerramento até o prazo absoluto entre abertura, leituras e
tentativas. A correção desse limite requer um contrato de I/O com prazo e
cancelamento verificáveis, seguido de prova do transporte realmente empregado;
esta inspeção não chama o GCS nem modifica a configuração.

Na revisão local do cleanup, exclusões incompletas conservam a intenção durável
e são reagendadas; o sweep de originais/resultados é tentado mesmo quando fases
de persistência falham. Os testes existentes cobrem falha de banco e remoção
local, mas o scheduler configurado a cada cinco minutos e a política real do
bucket impedem inferir exclusão física pontual a partir desses testes.

Probe diagnóstico posterior, local e sem credenciais: o SDK de storage 2.75.0
leu uma resposta HTTP 206 de loopback que enviou um byte e ficou suspensa. A
chamada permaneceu incompleta por 250 ms; após `Thread.interrupt()`, terminou
em até 300 ms com `ClosedByInterruptException`, antes da liberação do servidor.
O probe usou timeout de conexão/leitura de 2 s e uma tentativa. Código e log
estão em `.local/worker-isolation/repro-020-2026-10-26/`
`storage-interrupt-2026-10-28/`, com SHA-256 do código
`45ca06b326d6e46ff283c3810b024f162f92abf3ac7ca6256e6ebc2eb34174b8`.
Isso orienta o desenho de cancelamento, mas uma execução e transporte sintético
não comprovam cancelamento de abertura, outras etapas, retries ou GCS real. O
port e o runtime permanecem sem deadline cancelável.

A repetição pelo `GoogleCloudStorageAdapter.open` real, com retries e timeouts
default do SDK e host loopback, também encerrou após a interrupção com
`ClosedByInterruptException`. A chamada havia permanecido bloqueada por 250 ms
e terminou em até 300 ms após o sinal. A fixture usa credenciais vazias e troca
somente o host: não verifica TLS, IAM nem GCS real. O código em
`storage-interrupt-2026-10-28/adapter-default/Mob020StorageInterruptProbe.java`
tem SHA-256 `7d342a3536ad0444faed24e4ec9ed6768227608f8add85c4ac8c6dac00333253`.
O supervisor de render retorna ao chamador no deadline, mas conserva capacidade
e posse enquanto a operação não termina; reaplicá-lo ao storage exige uma
transferência de posse do snapshot e tratamento da falha de exclusão antes de
liberar capacidade. O probe isolado não implementa essa integração.

## Sinal cooperativo de deadline — 2026-10-28

O worker agora inicia um timer virtual para o prazo menor entre uma hora e o
prazo embutido na chave antes de ler manifestos e original. No prazo, o timer
sinaliza interrupção à thread que possui o I/O. O fechamento do timer impede
sinal tardio em trabalho seguinte; se o timer disparou, a tentativa falha antes
de claim ou render. Testes cobrem leituras bloqueadas de manifesto e original,
ausência de interrupção após fechamento e gravação de falha com thread
interrompida em PostgreSQL local. Uma falha de teste inicial por classe ainda
ausente e os resultados focados estão em `read-watchdog-2026-10-28/`.

Dois testes adicionais instrumentam o serviço de inspeção e conferem o caminho
do snapshot: ele deixa de existir após interrupção e também após o retorno de
uma leitura que ignorou o sinal. No segundo caso, a limpeza não ocorre enquanto
a leitura ainda está bloqueada. O XML `snapshot-proof.xml` tem SHA-256
`1b77c5b20265a5c2ec9b8e4ee1f446a519014ef83e63c2af06e59d0fc142ecbc`.

O sinal é cooperativo: uma operação que ignore interrupção continua possuindo
o stream e o snapshot até retornar. Não é cancelamento forçado, nem garantia de
remoção física pontual ou validação de transporte e bucket externos. A
afirmação anterior de que o runtime não sinalizava interrupção descreve a versão
anterior a esta alteração.

## Falha de exclusão local — 2026-10-29

Um probe em diretório sintético sem permissão de escrita reproduziu o snapshot
remanescente após `deleteQuietly`; a permissão foi restaurada e a fixture foi
removida. O código do probe em `.local/worker-isolation/repro-020-2026-10-26/`
`local-delete-failure-2026-10-29/Mob020LocalDeleteProbe.java` tem SHA-256
`53bec46be572233447373b139c550df94a2dccec6ac26401fe3ea1eca9ed4fba`.

Os serviços no mesmo carregador de classes compartilham até 64 referências cuja
exclusão não foi confirmada e tenta removê-los antes de admitir outra inspeção.
Uma falha ainda pendente é sanitizada como `storage-unavailable`; o worker
tenta os demais arquivos locais mesmo quando um falha. Num teste com commit
simulado, a falha após a confirmação preservou os artefatos e fez a chamada do
worker retornar erro temporário. Ao restaurar a permissão, o retry local
remove o arquivo conhecido e permite nova inspeção.

O retry compara a identidade do arquivo observada com `fileKey`, sem seguir
links; uma substituição observada ou identidade indisponível mantém a instância
fechada. Comparação e exclusão não são atômicas. Se houver mais de 64 falhas
simultâneas, a referência excedente não é guardada e a instância permanece
fechada mesmo após a limpeza manual; é necessário reiniciar o processo após a
intervenção. A lista é somente em memória e não prova
recuperação após reinício nem remoção quando o filesystem continua indisponível.
O serviço também é usado por submissão e OCR, que passam a recusar novas
inspeções enquanto houver limpeza pendente.
Além das verificações/inspeções, um único timer virtual por estado compartilhado
tenta o backlog a cada 30 segundos enquanto houver referências. Um teste local
com intervalo reduzido confirmou exclusão após restauração da permissão, sem
nova requisição. Se o timer não puder iniciar, a próxima verificação ainda
tenta o backlog. Não há retry da referência não registrada após saturação.

Instâncias criadas pelos codecs compartilham o estado no mesmo carregador de
classes; uma JVM filha possui estado separado. O teste com dois serviços e o
teste com os construtores padrão passaram. Isso não transfere o backlog da
filha para o pai. Uma regressão posterior exercitou a proteção existente do
diretório privado da filha: a filha criou um snapshot em `java.io.tmpdir`, o
teste observou o arquivo e a fez sair com erro; após o término, o pai removeu
o diretório possuído sem alterar o original ou um arquivo sentinela externo.
O supervisor também tem teste separado de retenção de capacidade após falha de
cleanup. Os 21 testes focados passaram; o XML em
`.local/worker-isolation/repro-020-2026-10-26/child-orphan-2026-10-29/isolated.xml`
tem SHA-256 `0784e2ba5fc97f209c3dffb05ab1e94a95bf3b8c33fb6b088aa29abb15951822`.
Isso não demonstra remoção se o filesystem continuar recusando exclusões, nem
recuperação após perda simultânea do pai e da filha.

Um probe separado usou a base local `sha256:befb9e4a225e7b5c98493f759d138275480e92c695319cffc158acd66b5cdff9`,
container sem rede ou binds e `/work` tmpfs de 8 MiB. A cada inicialização, o
processo verificou um marcador e depois o criou; tanto na primeira execução
quanto após stop/start do mesmo container o marcador estava ausente. O container
foi removido. O log em `.local/worker-isolation/repro-020-2026-10-26/`
`tmpfs-restart-2026-10-29/mob020-tmpfs-restart.log` tem SHA-256
`29b019bce2ffdf1d1a8c3cf359150a83cd7d497e6ab4fda785a05b1d7e634b0d`.
Essa observação é do Docker local, sem o worker; não demonstra o ciclo de vida
de volumes cloud nem limpeza de arquivos fora desse tmpfs.

Os 222 testes focados anteriores ao limite e 54 testes focados do limite
passaram sem skips. Os testes de substituição e saturação usam arquivos
sintéticos; em filesystem sem POSIX ou que não imponha as permissões da fixture,
esses testes são explicitamente ignorados. Os logs e XMLs ficam na pasta local
acima. TASK-006 permanece aberta para os limites de I/O e retenção externa.
O conjunto posterior do estado compartilhado e do retry durante ociosidade teve
226 testes focados sem skips; `idle-cleanup.xml` tem SHA-256
`86932def335d1d9abf908ef9c99b9d2ef6e01623f3bdf3e8ddbbfda8d12be918`.
