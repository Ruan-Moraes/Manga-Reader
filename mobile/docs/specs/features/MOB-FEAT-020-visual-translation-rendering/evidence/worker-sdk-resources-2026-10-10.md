# SDKs residentes no worker Linux — 2026-10-09/10 UTC

Parcela de TASK-007/008 e AC-004/005/006. Somente harness Java/testes/governança:
nenhuma produção, migration V1–V9, dependência, codec, qualidade, limite ou
infra mudou. 020 `in-progress/open`, verdict `changes-requested`; 021
`approved/blocked`. Performance mobile N/A: não houve alteração de runtime.

## Protocolo e implementação

[Plano anterior à implementação do cenário](../../../../../../api/apps/translation-gateway/docs/worker-sdk-resources.md).
`LoopbackWorkerProviders` fornece adapters/clients oficiais Vision/Translation,
com NoCredentialsProvider e servidores gRPC limitados ao loopback. São respostas
artificiais, não OCR ou tradução real. Clients permanecem residentes durante
o render, fechados pelo contexto. Não inicializa ADC ou ONNX, lê GCS, chama
Google, baixa dados/dependências ou envia imagens privadas.

O `runtime-sdk` do NativeRenderingWorkerProbe usa Spring/MockMvc com filtros,
PostgreSQL 17 na rede Docker interna, storage local e renderer supervisionado
real. Somente classes de teste necessárias são montadas readonly junto do JAR;
não se monta workspace, home ou credencial. Prefixo original compatível com o
adapter; IDs do Vision seguem a posição estrutural, não IDs injetados na saída.
Compara texto/hash/ordem/estados, original reutilizável, cleanup e reentrega.

Mesmos Java 23 Linux/codec fixados já preparados: nenhum pull/install.
Cgroup diagnóstico 8 GiB, swap zero, CPU/PIDs finitos, tmpfs 512 MiB, pai/filha
AS 3 GiB, heap pai 512 MiB e filha 128 MiB; kernel conferido. Sem porta pública;
HTTP listener count zero, `/v1/capabilities` 403, nove migrations aplicadas.

## Teste primeiro e correções exclusivas do harness

Primeiro red: um teste/um failure/zero errors, cenário ainda não implementado.
Não é finding de produção. Após implementação, bootstrap falhou por classe de
teste ausente. Cadeia sanitizada de tipos identificou NoClassDefFoundError;
inspeção do overload FakeVisionServer mostrou a referência EvaluationVisionCapture.
Montar essa dependência e suas classes internas resolveu o bootstrap, sem
ativar captura, credencial, tolerar a falha ou mudar o JAR de produção.

Três testes puros de LoopbackWorkerProviders passaram: IDs/ordem e expansão
máxima, vazio sem RPC de tradução, e máximo OCR rejeitado pelo limite aprovado
do provider antes da RPC. Limite comercial de 30.000 pontos de código incluindo
HTML permanece: a fixture de 1.024 IDs não cabe no request único. Não declarar
esse limite como máximo OCR ou ampliar o provider artificialmente.

## Resultado medido

Cada alvo executou no mesmo contexto uma PNG multicolor 10.000×8.000,
80M pixels/7.322.972 bytes: 64 regiões com entrada 256/saída 8.192 unidades,
uma região com entrada 4.096/saída 8.192 e página vazia. Primeira saída total
524.288 unidades UTF-16, íntegra no manifesto; suas 64 regiões usam fallback.
Outra região pintada e vazio são controles distintos, não aprovação visual.

| Alvo           | READY | RPCs OCR/Translation após reentrega | Pico cgroup (bytes) | Duração do probe (ns) |
| -------------- | ----: | ----------------------------------- | ------------------: | --------------------: |
| ARM64          |     3 | 3/2                                 |       1.753.382.912 |        43.403.911.867 |
| x86_64 emulado |     3 | 3/2                                 |       2.086.715.392 |        69.092.471.972 |

Zero oom_kill observado; processos exit 0 e outcome succeeded. Três etapas
SUCCEEDED por job. Hashes finais de imagem coincidem entre alvos por cenário;
manifestos dependem dos jobs distintos e não devem ter hash/IDs igualados.
Tempo do probe não é duração total do Maven/Testcontainers: inclui apenas seu
intervalo medido, não startup da infraestrutura. Uma consulta Docker posterior
demorou; foi aguardada, depois health check limitado confirmou daemon responsivo.
Não houve restart ou alteração do host para obter aprovação.

Primeiro ARM precede apenas a nova classe unitária; fotografia reconstruída
sem ela: 372 arquivos/bbf5cdaf…2db0. Fonte/testes/config auditados finais:
373 arquivos, SHA-256 `62ef09e4ccaffca71ace56be3d9cfaef52d78fbdbae20d30f474117f63815c4e`.
JAR de produção inalterado:
`954b42c29bf71ec316e29d59c87e133d6b2b7541fbf69564a5eb77a234a091cd`.
Não reatribuir matrizes anteriores ou checksum mobile ao código Java.

## Reprodução e limites

Reactor `api`, comando/pins do
[protocolo de distribuição](../../../../../../api/apps/translation-gateway/docs/rendering-native-distribution.md),
selecionando os métodos `officialLoopbackSdksCompleteMaximumMediaAndOutputInTheBoundedWorker`
e `officialLoopbackSdksCompleteMaximumMediaAndOutputInTheBoundedAmd64Worker`,
mais `LoopbackWorkerProvidersTest`. Opt-ins/diretórios já preparados permanecem
obrigatórios. Nenhuma instalação automática ou fallback de tecnologia.

Esta medição inclui os servidores sintéticos no pai; não representa baseline
de produção. PNG/pt-BR não provam todos os formatos/scripts/falhas com SDKs.
ONNX, GCS/Tasks, OOM agregado, qualidade humana e operação ainda pendentes.
Cloud 1 GiB permanece inalterado/não admitido; preparo Java/glibc aguarda
autorização específica. Não fechar tasks, promover 020 ou abrir 021.
Gates globais terminais serão registrados na review, separadamente das provas opt-in.
