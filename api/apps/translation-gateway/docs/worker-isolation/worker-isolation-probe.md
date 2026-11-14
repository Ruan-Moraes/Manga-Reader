# Diagnóstico independente de isolamento

Ferramenta Java/JDK 23, sem dependências adicionais, separada do JAR Spring:
[`WorkerIsolationProbe.java`](../scripts/isolation/WorkerIsolationProbe.java).
Não inicia worker, banco, OCR/tradução/layout/rendering, ADC ou rede. Não carrega
FFM/ONNX/libwebp, não altera limites, mounts ou preferência OOM e não envia arquivos.
Somente o relatório opcional explicitamente solicitado é gravado, em arquivo novo.

## Executar localmente

Na pasta do módulo, preparar um diretório novo ignorado pelo Git:

```bash
mkdir -p ../../../.local/worker-isolation
probe_dir=$(mktemp -d "../../../.local/worker-isolation/probe.XXXXXX")
probe_dir=$(cd "$probe_dir" && pwd)
javac -d "$probe_dir" scripts/isolation/WorkerIsolationProbe.java
java -cp "$probe_dir" WorkerIsolationProbe --scratch "$probe_dir" --output "$probe_dir/host.json"
```

Somente `--scratch` (obrigatório) e `--output` (opcional) são aceitos, com caminhos
absolutos. O scratch é consultado, não criado ou modificado. Não usar o diretório
de mídia: basta o diretório temporário que se pretende diagnosticar. O relatório
não contém caminhos, ambiente, hostname, credenciais, conteúdo de arquivos ou
exceções brutas. Arquivo existente impede gravação; não há overwrite, limpeza ou
retomada automática. O JSON também sai em stdout; erros de execução usam somente
`isolation-probe-unavailable` e exit 2. Exit 0 significa relatório gerado, não
compatibilidade aprovada.

## Interpretar

- `PASS`: a observação coincide com a condição fixa do diagnóstico.
- `FAIL`: há valor observado incompatível com essa condição.
- `UNKNOWN`: leitura ausente, inacessível, grande demais ou inválida; nunca vira pass.
- `observed=-1`: limite sem teto; em endereço, `-2` indica soft/hard divergentes.

O relatório `1.0` contém data UTC, versão major Java e 18 verificações: Linux,
ABI x86_64 do Cloud Run, PID 1, namespace cgroup v2, memória mínima 8 GiB, swap
zero, PIDs 1–64, OOM group zero, score do supervisor não positivo, tmpfs até
512 MiB e flags noexec/nosuid/nodev, endereço 3 GiB, VmSize abaixo desse teto e
dois cálculos defensivos de orçamento/headroom. Leituras de controles são
limitadas a 4 KiB, status a 16 KiB e mountinfo a 64 KiB. A tabela não é snapshot
atômico nem reserva contra outra carga; mede a própria JVM do probe, não o worker.
As flags de mount são observações operacionais adicionais, não novos requisitos
inseridos no renderer. O contrato autoritativo continua nos guards Java existentes.

`operationalApproval=false` e `nativeOperationsTested=false` são permanentes.
Mesmo `observations-match` não comprova syscall de prlimit/prctl, escrita de
oom_score_adj, codec/fontes/modelo, boot Spring, integridade do pipeline, OOM
agregado, retenção ou qualidade. Nenhum controle é afrouxado pela ferramenta.

No macOS, FAIL/UNKNOWN de controles Linux são esperados. Em container Java sem
bootstrap do renderer, o limite de endereço pode continuar unlimited: isso é
uma observação esperada, não regressão do worker. ARM64 falha somente no critério
de ABI cloud quando os demais controles coincidem; é diagnóstico local, não
substituto da imagem x86_64. Emulação x86_64 não é hardware nativo ou benchmark.

## Container local sem aquisição

Para a prova Linux, usar **somente uma imagem JDK 23 já cacheada**, pinada por
ID/digest, com `--pull never`, `--network none`, rootfs read-only, usuário não root,
cap-drop ALL, no-new-privileges, namespace cgroup privado, PIDs 64, memória/swap
8 GiB/8 GiB, CPUs 2, bind readonly do diretório compilado em `/probe` e tmpfs
`/work` de 512 MiB com noexec/nosuid/nodev. Entrypoint é `java`, com heap 64 MiB,
SerialGC, ActiveProcessorCount=2, tmpdir `/work`, classpath `/probe` e
`WorkerIsolationProbe --scratch /work`. Nada monta credenciais ou imagens de mangá.
Guardar stdout como relatório exclusivo; não apresentar esse container como
execução Cloud Run. Não colocar arquivos `.class` ou relatórios no Git.

Testes reproduzíveis, sem Docker/download:

```bash
node --test scripts/worker-isolation-probe.test.mjs
```

O teste compila a ferramenta e fixtures Java em diretório temporário exclusivo,
exercita limites, UNKNOWN, parsing de mounts, redaction, imutabilidade, CLI e
recusa de overwrite. As fixtures são sintéticas e exclusivas dos testes.

## Decisão sobre Cloud Run

Inspeção documental em 2026-10-10: segunda geração oferece Linux/namespaces/cgroups,
mas o serviço não garante os valores exatos exigidos pelos nossos guards.
[Ambientes](https://docs.cloud.google.com/run/docs/configuring/execution-environments).
O Terraform candidato ainda não fixa segunda geração nem monta tmpfs limitado.
Volumes em memória oferecem limite, mas a API consultada não expõe flags de
mount para emptyDir ou limite de PIDs no Container; ausência de configuração
documentada não prova que os valores observados serão incompatíveis.
[Volumes](https://docs.cloud.google.com/run/docs/reference/rest/v2/Volume),
[Container](https://docs.cloud.google.com/run/docs/reference/rest/v2/Container).

O contrato cloud restringe escritas em proc/sys e encerra a instância quando
ela ultrapassa a memória; portanto não presumir que escolher vítima OOM em
Docker preserve o pai nesse serviço.
[Contrato](https://docs.cloud.google.com/run/docs/container-contract).
Próxima decisão exige diagnóstico no alvo e prova separada das operações
nativas. Execução cloud, publicação de imagem, IAM ou custos precisam de
aprovação específica. Este documento não fornece autorização ou comando de deploy.

A sequência proposta, os custos de referência e as aprovações necessárias estão
no [plano da prova cloud](worker-isolation-cloud-plan.md), ainda não executado.

## Imagem local exclusiva do diagnóstico

[Preparador Node](../scripts/worker-isolation-image.mjs),
[testes](../scripts/worker-isolation-image.test.mjs) e
[Dockerfile específico](../Dockerfile.isolation-probe). Não usa o Dockerfile/JAR
Spring. O preparador não chama Docker, SDK, rede ou credenciais: somente valida
hash, reserva diretório novo e compila o probe com `javac -proc:none --release 23`.
Ambiente do compilador limitado a PATH/JAVA_HOME, sem processors ou plugins.

Na pasta do módulo, com `probe_dir` absoluto/exclusivo preparado como acima:

```bash
node scripts/worker-isolation-image.mjs --destination "$probe_dir/prepared" --source-sha256 "$(shasum -a 256 scripts/isolation/WorkerIsolationProbe.java | cut -d ' ' -f 1)"
node --test scripts/worker-isolation-image.test.mjs
```

Ele exige as oito classes esperadas, header CAFEBABE/major 67 e hashes. O contexto
Docker é somente `prepared/image`: classes readonly, Dockerfile, `.dockerignore`
com allowlist e metadados sem caminhos privados. Fonte de compilação fica fora
do contexto; nenhum arquivo de teste, mídia, modelo, SDK ou credencial entra.
Destino existente, hash inválido ou alvo inesperado falham sem sobrescrita.
Falha depois da reserva deixa `isolation-image-incomplete`: preservar para
inspeção e usar diretório novo, sem recriação/limpeza automática.

Runtime Temurin 25 LTS x86_64 fixado no Dockerfile; compilação continua `--release 23`
e o Java do projeto/worker não muda. Confirmar primeiro
que está cacheada; se `image inspect` falhar, parar — build sem `--pull` ainda
pode buscar base ausente. Nenhum download está autorizado por estes comandos.

```bash
docker image inspect eclipse-temurin@sha256:78498f30dd330b06755c1b134039dcbf8324bedb385136819dd519b842a3816a
DOCKER_BUILDKIT=0 docker build --pull=false --network=none --platform=linux/amd64 --tag toonlira-local/worker-isolation:local "$probe_dir/prepared/image"
```

Builder legado explícito usa o cache existente, sem instalar Buildx. É depreciado;
compatibilidade futura não justifica instalar componente automaticamente.
Dockerfile não tem RUN/ADD/EXPOSE/servidor: entrypoint Java direto, UID 1000,
heap 64 MiB, SerialGC, CPUs efetivas 2 e scratch `/work`. Licenças do Java são
herdadas da base. Execução local deve aplicar as flags de isolamento já descritas,
sem bind do host; imagem contém as próprias classes.

`image-inputs.json` é fotografia `prepared-not-built`, não recibo de publicação.
Guardar separadamente ID/tamanho/configuração e relatório do teste. Digest/ID
Docker local, mesmo exibido em RepoDigests, não comprova push no Artifact Registry.
Tamanho local descompactado não equivale a bytes transferidos/faturados.
O metadado distingue `javaRelease=23` de `runtimeMajor=25`. A base foi adquirida
somente após aprovação explícita; este comando não autoriza novas aquisições.
A imagem histórica Java 23 permanece preservada. A nova base mantida também
continua `securityApproved=false`: suporte não substitui análise de
vulnerabilidades, aprovação de custo ou publicação. Não ativar gateway/worker.
