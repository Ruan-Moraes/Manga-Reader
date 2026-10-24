# Imagem nativa opt-in — 2026-10-10

Distribuição candidata local da MOB-FEAT-020, não deploy ou admissão operacional.
`Dockerfile.native` entrega JAR, fontes/licenças já presentes nele e pacote
libwebp readonly. Os defaults de ativação e Terraform não mudaram. O Dockerfile
padrão e os alvos do preparador agora usam Java 25 fixado, conforme a
[migração local](java25-migration.md). Não há build automático em task ou teste
comum, publicação ou chamada paga. Os registros históricos Java 23/Noble ficam
preservados e não são aprovação de segurança de produção.

## Preparar contexto exclusivo

Pelo reactor `api/`, reconstruir o archive explicitamente:

```text
./mvnw -o -pl apps/translation-gateway -am package -DskipTests
```

No módulo gateway, com paths absolutos canônicos e destino inexistente:

```text
node scripts/render-native-image.mjs
  --jar <gateway.jar> --jar-sha256 <hash-externo-do-jar>
  --distribution <pacote-readonly> --manifest-sha256 <pin-externo>
  --platform linux-x86_64-glibc --destination <contexto-novo>
```

O bloco representa um comando. ARM64 usa `linux-aarch64-glibc`. Os alvos
fixam os digests Java 25 da [migração local](java25-migration.md), nunca
inferem arquitetura do host. Não há opção para download, credencial, push ou
URL. O script não chama Docker ou Google; `prepared-not-built` não é admissão.

O snapshot contém somente nove arquivos: JAR, Dockerfile, `.dockerignore`,
metadata sanitizada e os cinco arquivos do pacote. Verifica pins, plataforma,
licenças, coleção exata, paths sem symlink e pacote readonly antes da reserva.
JAR de até 512 MiB é verificado e copiado por streaming limitado, com hash
também na cópia. Bibliotecas mantêm limite de 32 MiB por arquivo. Mudança de
bytes, excesso ou falha deixa contexto incompleto para recuperação explícita;
nunca sobrescreve, retoma ou remove destino parcial automaticamente.

`contextSha256` deriva de paths e hashes ordenados dos nove arquivos, separados
por NUL. Não substitui pin externo do JAR/pacote nem assinatura de distribuição.
`image-inputs.json` não contém paths privados. O contexto não inclui checkout,
imagens, capturas OCR, configuração Docker pessoal, Maven settings ou ADC.

Para uma base Ubuntu derivada localmente, acrescentar `--base-proof <result.json-readonly>`
e `--base-proof-sha256 <pin-externo>` ao comando. A prova deve corresponder ao
parent fixado, arquitetura e exatamente aos dois upgrades aprovados da
[preparação de segurança](native-base-update-2026-10-11.md). Não há override livre
de runtime/tag. A metadata registra o ID local imutável, parent, hash da prova
e `baseSecurityApproved=false`; não reclassifica a base oficial antiga como
corrigida. Sem prova explícita, os alvos oficiais anteriores permanecem default.
O preparador de contexto continua não executando Docker/downloads/instalação.

## Build explícito em cache

Conferir primeiro `docker image inspect <base-fixada>`; base ausente bloqueia
a execução. No ambiente verificado foi usado builder clássico disponível,
config Docker isolada, `DOCKER_BUILDKIT=0`, `--pull=false`, `--network=none`,
limite de build de 1 GiB sem swap adicional e CPU 1. Sem instalação Buildx.

```text
docker build --pull=false --network=none --platform linux/amd64
  --build-arg RUNTIME_IMAGE=<base-fixada-no-contexto>
  --build-arg CODEC_MANIFEST_SHA256=<pin-do-manifesto>
  --build-arg GATEWAY_JAR_SHA256=<pin-do-jar>
  --iidfile <arquivo-novo-de-id> <contexto-preparado>
```

Esse é um comando, não instrução de push/deploy. O builder clássico é
deprecated; sua disponibilidade deve ser confirmada. Não migrar ou instalar
BuildKit/Buildx implicitamente. `--network=none` limita os comandos RUN, não
todo acesso possível de um builder à registry. A prova usou bases já
conferidas no cache e não mostrou pull no build. Outros builders exigem
validação própria antes de afirmar build offline.

Dentro do build, `NativeCodecImageAdmissionMain` verifica hash limitado do
JAR, estrutura Boot/classpath admitida, pacote/ELF/runtime e carga com versões
encoder/decoder 1.6.0. É um processo de preflight, com FFM, sem Spring,
imagens ou providers. Falha é sanitizada e impede imagem final; sucesso
`admitted-not-operational` não aprova memória, qualidade ou ambiente cloud.

## Runtime e segurança

- Imagem final: usuário `1000:1000`; JAR e arquivos do codec 0444,
  diretórios `/app` e `/relocated/lib` 0555.
- Perfil worker; gateway/OCR/tradução/layout/rendering desabilitados no ENV.
- Pacote e pin em `/relocated/lib`; arenas glibc fixadas em 2.
- Entrypoint direto Java/JAR, sem script próprio, native access no pai ou
  atualizações de certificados no startup. Fontes permanecem no JAR pinado.
- Ativação local explícita do renderer ainda exige os guards atuais:
  PID 1/cgroup privado, 8 GiB diagnósticos, swap extra zero, PIDs ≤64,
  tmpfs `/work` ≤512 MiB e AS pai/filha 3 GiB. Rootfs/mounts readonly,
  cap-drop ALL/no-new-privileges foram usados nos testes.

A configuração SQL e storage continua externa ao artefato; nenhum segredo
entra no contexto ou imagem. Não publicar porta, habilitar OCR ou uploads para
testar o bootstrap. A invocação operacional continua exigindo IAM privado e
gates próprios; nenhum recurso cloud foi criado ou modificado.

## Validação do artefato

`NativeRenderingWorkerImageLinuxTest` é opt-in com
`renderer.native.image.enabled=true`, IDs locais imutáveis em
`renderer.native.image.arm64.id`/`renderer.native.image.amd64.id` e pins
`renderer.glibc.arm64.sha256`/`renderer.glibc.amd64.sha256`. Socket e decoder
independente seguem os [testes glibc](rendering-glibc-integration.md).

O worker SDK não monta JAR/libs do host nem substitui o usuário da imagem.
Monta somente fixtures/probes/suporte de teste, usa PG17 privado e SDKs
loopback com NoCredentials. A prova do entrypoint mantém ENTRYPOINT real,
sem portas publicadas, renderer opt-in e OCR desabilitado: health 200,
`/v1` 403, task 503, cap do pai confirmado. Esse teste não invoca OCR real.

O método opt-in `packagedArtifactsCoverFormatsScriptsDimensionsAndRecovery`
expande a verificação para os dois alvos: JPEG/WebP máximos, PNG larga/alta e
linha/coluna de um pixel, pintura dos sete destinos e falhas de memória,
scratch, timeout e cancelamento com recuperação da página seguinte. Os
providers dessas variantes são implementações sintéticas de teste; não são
medição dos SDKs residentes nem avaliação linguística. A variante `runtime-sdk`
continua sendo uma prova separada com clients oficiais contra servidores locais.

Para selecionar a matriz, usar no reactor, com as mesmas propriedades explícitas
de IDs/pins/socket/decoder já conferidos e presentes no cache:

```text
./mvnw -o -pl apps/translation-gateway -am test
  -Dtest=NativeRenderingWorkerImageLinuxTest#packagedArtifactsCoverFormatsScriptsDimensionsAndRecovery
  -Dsurefire.failIfNoSpecifiedTests=false
  -Drenderer.native.image.enabled=true
  <propriedades-explicitas-de-ambos-os-alvos-e-fixture>
```

O bloco representa um comando; o marcador não é argumento executável. Não
reconstruir a imagem, baixar dependências ou trocar pins automaticamente. O
harness fornece os tipos refletidos pelo Spring mesmo com o ramo SDK desligado;
disponibilizar classes de teste não inicializa servidores, ADC ou providers.

Desvio registrado: o primeiro bind de alto nível do Testcontainers descobriu
um helper Alpine e baixou cerca de 3 MB. O harness foi corrigido para bind
Docker direto, evitando essa preparação implícita. Cache foi preservado;
nada foi enviado a providers. O ocorrido não é ocultado como execução offline.

Resultados, hashes e gates estão na
[evidência](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-native-image-2026-10-10.md).
020 permanece `in-progress/open`; 021 bloqueada. A matriz ampliada foi executada
nas mesmas imagens; não cobre todas as combinações formato×idioma×limite.
O [perfil combinado local](layout-runtime-resources.md) usa JNI/modelo readonly
externos à imagem. Orçamento cloud 1 GiB, combinações restantes, OOM agregado, revisão
dos sete destinos e validação operacional continuam abertos. Não reatribuir
provas musl anteriores a esta imagem.
