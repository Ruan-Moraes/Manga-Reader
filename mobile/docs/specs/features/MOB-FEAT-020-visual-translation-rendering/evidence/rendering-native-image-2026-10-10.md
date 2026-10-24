# Imagem nativa candidata — 2026-10-10

Parcela de TASK-002/007/008, gate `open`, sem promoção da 020 ou da 021.
Fonte/testes/config gateway: 383 arquivos,
SHA-256 `8303a7a3625d4fa391d9571d0d9f6d29271100cce57183bed1e7bb2ea561f7b9`.
JAR `40f035309f927f718978c47ebbd2ef064924df50022905baf2873d48692fb906`.
O checksum técnico histórico não cobre Dockerfiles: suplemento
`Dockerfile.native` SHA-256 `36b07b4d1fc30c445858ca94519222c1aa49b0ef662f6f4d5355b1bad8a936f5`.
Dockerfile padrão e POM pai permanecem com seus hashes anteriores.

## Entrega e autoridade

Ruan autorizou implementação incremental até rendering e preparação local
Java23/glibc/libwebp, sem provider pago, credenciais, mídia privada, publicação,
cloud ou habilitação de uploads. O contexto novo só copia nove arquivos
permitidos com pins: JAR, Dockerfile, ignore, metadata e pacote nativo/licenças.
Não contém checkout, Docker/Maven config pessoal, ADC ou imagens/capturas.
O preparador não invoca Docker, instala, baixa ou publica nada; estados
`prepared-not-built` e `admitted-not-operational` mantêm seus limites explícitos.

[Comandos, limites, recuperação e contrato](../../../../../../api/apps/translation-gateway/docs/rendering-native-image.md).
Fonte própria é JS/Java e Dockerfile declarativo, sem Python/source C próprio.
Bibliotecas/modelos/SDKs, APIs, manifests, migrations e código mobile não mudaram.

## Artefatos efetivamente construídos

Build explícito com bases Noble fixadas já em cache, builder clássico local,
config Docker isolada, pull false, RUN network none, CPU 1 e memória 1 GiB.
Sem instalação de Buildx. Preflight Java verificou JAR/Boot/pacote/ELF/runtime
e carga com encoder/decoder 1.6.0, sem imagens ou Spring/provider. Base Java 23
histórica e builder deprecated continuam riscos, não admissão de produção.

| Alvo                 | ID local da imagem                                                        | Hash do contexto                                                   |
| -------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| ARM64/glibc          | `sha256:ce032de2630dccdeb4fbcb934756af72faba70f272cbf773759f82c2c16abb09` | `b22ea0516894239d59d4ed2f298004c178c617d1b803778f1334c1e071717f54` |
| x86_64/glibc emulado | `sha256:a7608636964587313dd8aed96bf5ca585e76402cda6e5212bae1423cf0871027` | `001fa666b909c21159bd4193f0a9e6e2dad4bb83e8a9ed44f92cf894aef011ea` |

São IDs do cache local, não digests publicados ou imagens assinadas. Pacotes
mantêm pins `bfe9572c…a3a58`/`0103ab2d…3dae5` da parcela glibc.
JAR possui 221.280.005 bytes; cópia/hash por streaming limitado. Snapshot é
create-only, não retoma/sobrescreve/remove parcial silenciosamente.

## Testes antes e depois

- Node e Java red antes de implementar preparador/admission main. Um teste
  Java inicialmente usava alias macOS de temp; fixture corrigida para path
  canônico, sem relaxar rejeição de symlink/pin/caminho. Erro de API de teste
  `getMappedPorts` corrigido para conferir bindings reais Docker.
- Cinco testes Node novos: pins, plataforma cruzada, coleção exata,
  readonly/symlinks, fontes não relacionadas, exclusividade/concorrência e
  defaults disabled. Archive sintético só comprova snapshot, nunca runtime.
- Dois controles Java: hash/alteração/symlink/ausência/nulo e erros sanitizados.
- `NativeRenderingWorkerImageLinuxTest`, suíte completa: quatro testes,
  zero failures/errors/skips. Não monta JAR ou libs do host e não substitui
  usuário da imagem; UID efetivo 1000 e default renderer disabled confirmados.

| Worker SDK na imagem | READY | Pico cgroup (bytes) | Tempo (ns)     | RPCs OCR/Translation |
| -------------------- | ----- | ------------------- | -------------- | -------------------- |
| ARM64/glibc          | 3     | 1.877.630.976       | 26.734.956.877 | 3/2                  |
| x86_64/glibc emulado | 3     | 2.139.877.376       | 67.096.597.749 | 3/2                  |

PNG sintética 10.000×8.000/80M pixels/7.322.972 bytes; saída total máxima,
região máxima pintada e vazio. Seis READY com originais/hashes/manifests,
reentrega/limpeza, PG17 V1–V9 e SDKs oficiais somente contra fakes loopback.
Os três hashes visuais coincidem entre alvos; manifests de jobs distintos não
precisam ter o mesmo hash. Texto sintético/fallback não aprova qualidade real.

Dois testes adicionais da mesma suíte mantêm o ENTRYPOINT de produção e não
montam JAR/libs ou publicam portas. Renderer selecionado explicitamente só
no container de teste, OCR desabilitado: health 200, `/v1/capabilities` 403,
task OCR 503, cap do pai 3 GiB observado no kernel. Não fazem OCR/tradução.

## Desvio de aquisição registrado

O primeiro teste de startup usou bind de alto nível Testcontainers, que
adquiriu automaticamente helper Alpine 3.17 (~3 MB). Não foi envio de mídia,
uso de credencial ou chamada paga, mas violou a intenção de não adquirir
dependências em teste comum. Foi informado ao usuário e corrigido para bind
Docker direto; duas reexecuções passaram sem nova preparação auxiliar nos logs.
O cache foi preservado, sem ocultar o desvio como execução inteiramente offline.

## Alcance e decisão

AC-004/005/006 recebem evidência complementar da entrega de artefato.
Cgroup 8 GiB, AS pai/filha 3 GiB, scratch 512 MiB, swap extra zero, CPU 1 e
PIDs 64 são diagnóstico/precondições, não admissão cloud de 1 GiB. Rootfs readonly,
cap-drop ALL/no-new-privileges e redes privadas. Uma rodada por alvo, sem
mediana/variabilidade, hardware x86_64 nativo, ONNX residente ou OOM combinado.

Imagem candidata entregue não significa segurança/publicação/validação de
ambiente aprovadas. Matrizes JPEG/WebP/scripts/falhas precisam ser reconferidas
no artefato, e qualidade/retenção/IAM/operação continuam pendentes. 020
`in-progress/open`, verdict `changes-requested`, TASK-002/006/007/008 abertas,
021 bloqueada; defaults e Terraform intactos. Performance mobile N/A: sem
mudança de React Native, métricas Node/Java não são benchmark Android.

Gates globais e checksum SDD são registrados na review/drift após execução,
sem reatribuir provas ou conclusões históricas ao JAR novo.

## Ampliação posterior da matriz — 2026-10-10, 12:07 UTC

Somente harness e documentação mudaram. Fonte/testes/config: 383 arquivos,
SHA-256 `3f3152ad4dc36de96c960465f0960991fc293ee8489f1d48ab4e2be0a1ec703a`.
JAR, Dockerfile.native e os dois IDs de imagem acima permanecem idênticos.
Não houve rebuild, aquisição, credencial, chamada paga ou mídia privada.

O teste foi escrito antes do suporte de cenário da fixture: compilação red
por método ausente. A primeira matriz falhou nos 34 casos durante bootstrap,
antes de OCR, por tipos do provider de teste ausentes no classpath refletido
pelo Spring. O harness agora fornece esses tipos em todos os cenários; o ramo
SDK só instancia seus fakes quando selecionado. Nenhum guard, assertion,
limite, fixture ou pacote de produção foi relaxado para resolver o problema.

Reexecução terminal: 34 testes, zero failures/errors/skips, 1.052,067 segundos.
São 17 cenários em cada imagem, UID 1000 e default renderer disabled conferidos:

- JPEG/WebP 10.000×8.000: vazio, texto pintado e 1.024 regiões com fallback.
- PNG 12.000×6.666, 6.666×12.000, 12.000×1 e 1×12.000: limites/dimensões,
  manifesto íntegro e fallback quando necessário.
- PNG 80M com texto que cabe, nos sete destinos: `overflow=false`, conteúdo
  completo e imagem alterada. Não confundir isso com aprovação linguística.
- Falhas de AS da filha, scratch cheio, timeout e cancelamento: ausência de
  artefato parcial, capacidade ocupada até cleanup e sucessora `READY`.

| Alvo                 | Casos | READY | FAILED esperado | CANCELLED esperado | Maior pico cgroup (bytes) |
| -------------------- | ----- | ----- | --------------- | ------------------ | ------------------------- |
| ARM64/glibc          | 17    | 25    | 3               | 1                  | 1.788.026.880             |
| x86_64/glibc emulado | 17    | 25    | 3               | 1                  | 2.100.690.944             |

Todos os hashes visuais correspondentes coincidiram entre alvos; hashes de
manifestos por job não são igualados. Zero OOM observado, sem afirmar proteção
contra OOM agregado: o controle de memória injeta AS limitado na filha, não
OOM do container. Timeout usa suspensão controlada da filha, não diagnóstico
de codec travado. Uma execução por cenário, sem mediana ou variabilidade.

Registro completo sanitizado preservado localmente em arquivo `matrix-20261010-120721.json`
sob o diretório ignorado da preparação da imagem; não é enviado nem versionado.
Contém comando, imagem/pins, metadados e métricas sintéticas, sem texto OCR,
resposta de provider ou credencial. Seleção/comandos na documentação do gateway.
SHA-256 do registro: `8333b9e62c96bbc0699983df247f8cd013883005abf607063f8e1f8834a1327c`.

Complementa AC-002/003/004/005/006, sem aprová-los integralmente. Os providers
desta matriz são implementações sintéticas, não clients oficiais residentes;
as quatro provas SDK/entrypoint anteriores permanecem fotografias separadas.
Não cobre toda combinação formato×idioma×limite, ONNX combinado, hardware
x86_64 nativo ou ambiente cloud. Orçamento 8 GiB diagnóstico versus 1 GiB
Terraform, segurança/publicação, qualidade e operação continuam pendentes.
TASK-002/006/007/008, verdict, 020/021 e defaults não são promovidos.

Gates desta ampliação: Maven global offline/Docker exit 0; relatórios novos
desde `2026-10-10T12:07:37.224Z`, 2.719 testes/841 classes, gateway 1.248/125,
zero failures/errors e 102 skips opt-in. Não são os 34 casos nativos acima,
executados separadamente. Relatórios consolidados antes da suíte leve.
Node 99 pass/um skip e type-check web exit 0. Checks mobile e SDD finais
registrados na review/drift, preservando as execuções históricas acima.

## Perfil combinado posterior — 2026-10-10

Fonte/testes/config: 385 arquivos,
SHA-256 `106ea74cb643929b5ca33b1b0fa524545fab0e5aaa8bbfae7752815a1af1efb6`.
JAR/IDs/Dockerfile.native continuam os mesmos. Somente testes e documentação
mudaram; sem aquisição, mudança de dependencia/runtime, mídia real ou cloud.

[Reprodução](../../../../../../api/apps/translation-gateway/docs/layout-runtime-resources.md).
Modelo e JNI do SDK já cacheado foram verificados por hash e montados readonly;
`onnxruntime.native.path` explícito preserva temporário `noexec`. JNI/modelo
são suporte externo da fixture, **não** arquivos entregues pela imagem candidata.
CPU 1, PIDs 64, cgroup 8 GiB, AS pai/filha 3 GiB, Spring/SQL/storage reais,
SDKs oficiais contra gRPC local e detector real no perfil worker shadow.

Testes escritos antes do suporte. A primeira execução terminou com erro de
remoção da pasta readonly do próprio harness. Correção restaura escrita do dono
somente depois da terminação do container, somente na pasta gerada, sem relaxar
as proteções do runtime. Reexecução: dois casos integrais e três controles puros,
zero failures/errors/skips. Controles comprovam pins, coleção exata/readonly,
rejeição de alvo desconhecido e ausência de sobrescrita. Não carregam JNI no host.

| Alvo                 | READY/layout SUCCEEDED | RPCs OCR/tradução | Pico cgroup (bytes) |
| -------------------- | ---------------------- | ----------------- | ------------------- |
| ARM64/glibc          | 4/4                    | 4/3               | 2.639.970.304       |
| x86_64/glibc emulado | 4/4                    | 4/3               | 2.877.677.568       |

Três PNG 80M sequenciais: saída total máxima, região máxima pintada e vazio;
mais controle de 320×220. Layout foi inferido e registrado com hash/vínculos
em todos os jobs; não foi apenas sessão carregada. Reentrega não repete RPCs.
Hashes visuais dos três máximos coincidem com o baseline sem layout e entre
plataformas; layout separado não altera pixels/manifests normativos.

Zero OOM observado sob diagnóstico. Não é prova de contenção de OOM agregado,
de todas as mídias/idiomas/falhas com ONNX, hardware x86_64 nativo, estabilidade
estatística ou qualidade do detector. Imagens e texto são sintéticos nesta prova;
modelo e inferência local são reais, OCR/tradução são respostas de fakes.

Registro sanitizado `combined-layout-20261010-1513.json` na preparação ignorada,
SHA-256 `0e8456b15b2d88e3a4c7a82482e01e7d189589607e9c6b2372c8bb6234e7fb0f`.
Não contém credencial ou conteúdo OCR. Não reatribuir a matriz anterior de 34
ao cenário combinado. Performance mobile N/A; 020/verdict/tasks/021 e defaults
conservados. Perfil local foi entregue, orçamento/distribuição/operação não.

Gates da parcela combinada: Maven global offline/Docker exit 0, relatórios
novos desde `2026-10-10T15:14:59.479Z`: 2.723 testes/842 classes, gateway
1.252/126, zero failures/errors e 103 skips opt-in. Os cinco testes selecionados
acima são prova separada. Node 99 pass/um skip e type-check web exit 0;
SDD/check mobile final registrados na review/drift. Fonte/JAR reconferidos,
sem reatribuir provas ou conclusões históricas ao perfil combinado.

## Perfil de recursos candidato — preparação local, 2026-10-10

Parcela de configuração para AC-006; aprovação humana limitada a arquivos locais,
sem criação de recursos ou deploy. Não renova as provas das imagens acima.
Fonte/testes/config: 387 arquivos, SHA-256
`04f3c1f906201f8b8dea0a66bc1a486a58a4fbc12fe71c4f91583f9046ba6c24`.
JAR SHA-256 `40f035309f927f718978c47ebbd2ef064924df50022905baf2873d48692fb906`
inalterado; checksum mobile permanece separado do código/config Java/Terraform.

[Configuração e recuperação](../../../../../../api/apps/translation-gateway/infra/terraform/README.md#perfil-candidato-nativo--somente-arquivos-locais),
[exemplo complementar](../../../../../../api/apps/translation-gateway/infra/terraform/native-worker-candidate.tfvars.example)
e [testes estruturais](../../../../../../api/apps/translation-gateway/scripts/worker-resource-profile.test.mjs).
Baseline mantém 1 CPU/1 GiB e concorrência padrão. Candidato propõe 2 CPUs/8 GiB,
concorrência 1, escala 0–1: a tabela oficial admite até 8 GiB com 2 vCPUs,
não com 1 vCPU. [Cloud Run](https://docs.cloud.google.com/run/docs/configuring/services/memory-limits).
O diagnóstico anterior de 1 CPU não valida esse par cloud.

Arquivo `.example` não é auto-carregado. Gateway/worker false e OCR/tradução/
layout/rendering/download disabled preservados. Imagem independente do worker
aceita somente override por digest; valor null preserva baseline, sem inventar
referência publicada a partir de um Docker ID local. Lifecycle preconditions
fatais no gateway incondicional e no worker bloqueiam execução normal do módulo
quando selecionado o candidato, inclusive com worker false. Isso não é política
IAM nem proteção contra edição ou `-target`; bypass não foi autorizado.

Testes antes da implementação: cinco failures esperadas por configuração ausente;
após implementação, cinco passes. São leitura estrutural de HCL, não avaliação
do Terraform ou plan remoto. `terraform fmt -check -recursive`, fmt via stdin
para os dois exemplos e `terraform validate -no-color` aprovados com plugins
já cacheados. Recusa inicial de IPC no sandbox resolvida com execução local
autorizada; nenhum init, download, plan/apply ou uso de credencial. Validate
confere schema/sintaxe, não compatibilidade operacional ou admissão dos exemplos.

Guards Java não foram reduzidos. JNI/modelo, tmpfs/noexec, cgroups, swap, PID/AS,
IAM/storage, assinatura/publicação, contenção de OOM, qualidade e custo ainda
exigem verificação/decisão próprias. Nenhuma mídia enviada, chamada provider,
recurso cloud ou deploy. TASK-002/006/007/008, verdict changes-requested,
020 in-progress/open e 021 approved/blocked preservados; performance mobile N/A.

Gates: Maven global offline/Docker exit 0; XMLs novos desde
`2026-10-10T15:42:20.612Z`, 2.723 testes/842 classes, gateway 1.252/126,
zero failures/errors, 103 skips opt-in. Relatórios contados antes da suíte leve;
matriz nativa e perfil combinado anteriores não foram reexecutados nesta parcela.
Type-check web exit 0. Fechamento Node/mobile/SDD registrado na review/drift.

## Diagnóstico Java independente — 2026-10-10

Parcela de suporte para AC-006, não runtime de produto ou aprovação cloud.
[Código](../../../../../../api/apps/translation-gateway/scripts/isolation/WorkerIsolationProbe.java),
[fixtures Java](../../../../../../api/apps/translation-gateway/scripts/isolation/WorkerIsolationProbeChecks.java),
[testes Node/CLI](../../../../../../api/apps/translation-gateway/scripts/worker-isolation-probe.test.mjs)
e [comandos/limitações](../../../../../../api/apps/translation-gateway/docs/worker-isolation-probe.md).
Fonte/testes/config: 390 arquivos,
SHA-256 `a820f8de4820041d4e1462fa65daaabbb0b16404fbe056e05a49a7d31858abdc`.
JAR 40f03530…fb906 intacto. Arquivos Java ficam em scripts, sem bean, endpoint,
dependência, migration ou inclusão na imagem/JAR Spring.

Primeiro red por fonte ausente; implementação inicial revelou null handling
incorreto na soma de limites, corrigido e reexecutado. Fixtures sintéticas cobrem
limites exatos/fora do teto, pressão/overflow, controle ausente/inválido/grande,
imutabilidade, mounts com espaços e fronteira de prefixo. CLI valida argumentos,
redaction e recusa de arquivo existente; não sobrescreve relatório anterior.
Exclusão Git da pasta local faltava na primeira conferência; teste red mostrou
a lacuna e a regra `/.local/worker-isolation/` foi acrescentada ao `.gitignore`.
Teste verde e `git check-ignore` confirmam os artefatos fora do Git. O checksum
técnico acima cobre scripts, não esse arquivo raiz suplementar.
Suplemento `.gitignore` SHA-256
`4e3c2fa2c3dd742792a1f8c3f1f2a3b1ce846a031dbb0a2cd38e146b15902f5c`.
Leitura allowlist/bounded, sem caminhos/conteúdo/raw exception no JSON; aprovação
operacional e teste de operações nativas permanecem false até com 18 PASS.

Provas locais isoladas, sem rede/pull, credenciais, imagens de mangá ou provider.
Classes compiladas montadas readonly; entrypoint java puro, UID 1000, rootfs
readonly, cap-drop ALL/no-new-privileges, cgroup privado, CPUs 2, PIDs 64,
memória/swap 8 GiB/8 GiB, tmpfs /work 512 MiB noexec/nosuid/nodev. JVM heap
64 MiB, SerialGC, ActiveProcessorCount 2. Não altera rlimits ou oom_score_adj.
Não executa worker/bootstrap/renderer nem confirma ausência de OOM no pipeline.

| Ambiente             | PASS | FAIL | UNKNOWN | Observação                                             |
| -------------------- | ---: | ---: | ------: | ------------------------------------------------------ |
| macOS host           |    0 |    5 |      13 | controles Linux ausentes, filesystem/ABI/PID distintos |
| ARM64 Linux local    |   16 |    2 |       0 | ABI não-cloud; endereço unlimited                      |
| x86_64 Linux emulado |   17 |    1 |       0 | endereço unlimited                                     |

Runtimes JDK já cacheados, IDs locais ARM64
`sha256:b35cf225d6e3ac822b58f142b8268e5d2db8bf23a9a167c56ee2e821a5ea6cb5`
e x86_64 `sha256:393ad826422f9dbee85d4601304d7c68c6c8240251a4d9633dc66a1017eac7fd`.
Não são os IDs das imagens Spring candidatas nem digest publicado. Relatórios
sanitizados ignorados pelo Git: host SHA-256
`87b06493a36878116c9f397f78df7c8bb1d36af9e6d84d842fa4436fe9c4b2f3`,
ARM64 `6dd6714044a33c2c0c1600553cd1c2047026db5ede6a91f915efe24c5e3d1449`,
x86_64 `65b9817d05ee8c83a6a88acc3372450d17b69fdcd353b164f562a0b975e32d03`.
Datas das observações UTC no próprio JSON: 16:11:43, 16:12:02 e 16:12:05.

Endereço unlimited é esperado: diagnóstico não executa o helper que limita o
worker. Não “corrigir” a leitura alterando o processo. Cloud Run precisa de prova
própria: candidato ainda não fixa segunda geração ou tmpfs; API consultada não
expõe pids-limit/flags emptyDir. Ausência de knobs documentados não prova falha
no alvo; `/proc`/`/sys` e política OOM do serviço não equivalem ao Docker.
Próximo trabalho requer preparar/testar valores e syscalls no alvo com aprovação
específica antes de recursos/custo. Nada publicado, nenhuma credencial usada.

Node completo: 105 pass/um skip, zero fail; type-check web exit 0. Global Maven
offline/Docker exit 0, XMLs novos desde `2026-10-10T16:14:21.270Z`, 2.723 testes/
842 classes, gateway 1.252/126, zero failures/errors e 103 skips opt-in. Esses
testes não incluem o probe standalone, coberto separadamente por Node/javac.
`pnpm check` integral exit 0, 116 suítes/892 testes; registros finais SDD/links
na review/drift. TASK-002/006/007/008,
changes-requested, 020 in-progress/open e 021 approved/blocked preservados.
Performance mobile N/A; checksum SDD não substitui checksum técnico do gateway.
