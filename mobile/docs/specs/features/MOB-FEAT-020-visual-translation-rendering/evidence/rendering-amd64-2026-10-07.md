# Renderer x86_64 local — 2026-10-07

Parcela de TASK-002/005/007/008, AC-001/004/005/006. 020 in-progress/open,
verdict changes-requested, 021 approved/blocked. libwebp 1.6.0 lossless/exact,
caps, texto, contratos, migrations e RAM/defaults cloud preservados.
Nenhum provider/ADC, imagem real/privada, deploy, upload público ou Python/C próprio.

## Problema e alteração

O [contrato Cloud Run](https://docs.cloud.google.com/run/docs/container-contract)
exige Linux x86_64. A distribuição anterior e seus controles admitiam somente
ARM64; seu sucesso local não provava compatibilidade do alvo.

[NativeCodecPlatform](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/NativeCodecPlatform.java)
centraliza dois alvos explícitos: linux-aarch64-musl/EM_AARCH64=183 e
linux-x86_64-musl/EM_X86_64=62, com libc correspondente. Java 23, Linux e
little endian continuam obrigatórios; arquitetura/manifesto desconhecidos falham
sanitizadamente. Não é um enum persistido ou novo contrato de task.

O parser ELF vincula ambos os arquivos à arquitetura declarada. A inspeção
offline do pacote não carrega bibliotecas; o bean usa admissão vinculada ao
runtime antes de iniciar a filha. Manifesto errado, bibliotecas misturadas ou
dependência de libc divergente não são aceitos. Não acrescenta fallback,
download em task, FFM no pai ou mudança da política de imagem.

O packager Node aceita `--platform linux-x86_64-musl` explicitamente. O comando
anterior sem opção conserva exatamente linux-aarch64-musl, sem deduzir o alvo
pelo computador. Formato toonlira-native-codec-1 e pins/licenças permanecem.

## Preparação autorizada e pins

Reutilizada a autorização humana para imagem oficial Java 23 e compilador/
headers somente em container local. Source oficial intacto pelo CMake, sem
scripts próprios em shell/Python ou código C novo. Downloads públicos em cache;
configuração Docker vazia, sem credenciais pessoais, Google ou recursos cloud.
Rede do container desconectada após apk, antes de configurar/build/install.

| Item                         | SHA-256/versão                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| Imagem oficial AMD64         | eclipse-temurin@sha256:55d6ecee9ac7a76bc31d76eb51755f3c98ae8a088dda3590155061266841190a |
| Archive libwebp 1.6.0        | e4ab7009bf0629fd11982d4c2aa83964cf244cffba7347ecd39019a9e38c4564                        |
| libwebp.so.7.2.0             | 6cc94280e223d1486709726cc13ea45c2b71354e7ff032b7be97876fdfbdd741                        |
| libsharpyuv.so.0.1.2         | 0774e310d549b22795771edbea65f8f20b19f48796f950448de35419072ac059                        |
| Manifesto do pacote readonly | 9cca2ffb1ac4938682fb640a1f8ddc7bf913c451ba73177b60ecfa13ccbe3c8c                        |
| Ambiente observado           | Java 23.0.2+7, GCC 14.2.0-r4, CMake 3.31.1-r0, headers musl 1.2.5-r11                   |

Mesmo conjunto de flags da [distribuição anterior](../../../../../../api/apps/translation-gateway/docs/rendering-native-distribution.md):
Release/O2, shared, SIMD/thread off, ferramentas/extras off, RUNPATH `$ORIGIN`.
readelf posterior ao install confirmou ELF64/LE/x86_64, SONAME/RUNPATH e
dependências exatas. Hash do archive/licenças verificados; assinatura GPG e
reprodutibilidade bit-a-bit não demonstradas. Pacote em pasta ignorada/readonly,
não publicado nem empacotamento operacional aprovado.

Houve intervalo de observação sem resposta durante install/inspect. Os mesmos
handles foram acompanhados, sem restart ou novo build. Install terminou exit 0;
a primeira leitura ELF havia precedido a instalação e falhou por arquivo
ausente. Após confirmação terminal, nova inspeção passou. Não atribuir uma
causa ao atraso ou converter esses tempos em SLA. Container de toolchain
possuído foi parado, com cache/source/artefatos preservados.

## Provas determinísticas e nativas

Testes precederam implementação: Node rejeitou a nova opção; Java não compilou
por tipos/métodos ausentes. Correção green de metadados não foi apresentada
como execução. Fixtures sintéticas de ELF conferem arquitetura/libc, mixed
libraries e runtime errado, desconhecidos e falhas sem causa sensível.

[NativeCodecAmd64LinuxTest](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeCodecAmd64LinuxTest.java)
executou o JAR e libraries x86_64 em OrbStack no Mac ARM64, sob emulação:

- codec FFM real: round-trip, alpha e RGB invisível, buffer emprestado,
  ownership/lifetime, limites, timeout/cancelamento e cleanup;
- decoder CLI ARM64 independente comparou todos os pixels da saída;
- bean Spring mínimo selecionou supervisor, sem FFM no pai, e filha guardada;
- kernel confirmou score próprio +1000, dumpable=0 e tetos self-only de
  endereço/CPU/arquivo/descritores. São proteção parcial, não garantia de OOM.

O alvo efetivo foi exigido por assert de arquivo/metric produzido dentro dos
probes, não inferido do nome da imagem. Execução sem rede, pull never, nonroot,
cap-drop/no-new-privileges, JAR/libs/inputs readonly e diretórios possuídos.

## Worker completo observado

[NativeRenderingWorkerAmd64LinuxTest](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderingWorkerAmd64LinuxTest.java)
usa Spring/SQL/Flyway V1–V7, MockMvc/filtros, storage e renderer reais;
OCR/tradução falsos exclusivos dos testes. Rede interna somente ao PostgreSQL
17 separado, sem portas publicadas/clients Google; listener HTTP zero, `/v1` 403. Container diagnóstico 4 GiB, swap zero, uma CPU, 64 PIDs, scratch 512 MiB;
filha AS 3 GiB/heap 256 MiB e prazos anteriores, sem ampliá-los para passar.

| Cenário                                              | memory.peak total (bytes) | VmHWM pai (KiB) | Jobs READY | Kernel OOM kills |
| ---------------------------------------------------- | ------------------------- | --------------- | ---------- | ---------------- |
| Pequena 320×220, zero/uma região                     | 1.010.700.288             | 428.264         | 2          | 0                |
| Máxima 10.000×8.000, três formatos de limite textual | 2.777.538.560             | 437.412         | 3          | 0                |

Máxima sintética multicolor: 7.322.972 bytes, hash
15e8bc69f58a1905ecd2805ce56267ee652e6dd6a69674663662ae8d5b25469c.
Sequência no mesmo contexto: 1.024 regiões (256/512 UTF-16), 64 regiões
(4.096/8.192) e zero regiões. Totais máximos 262.144/524.288 preservados.
Exigidos três estágios SUCCEEDED, manifesto/hash/vínculos/IDs/ordem/texto,
reentrega sem segunda chamada, original reutilizável íntegro e staging limpo.

Hashes WebP máximos coincidiram com a prova ARM64 anterior: respectivamente
260a8b2b25a78c7c3f585dbc58ae71d47bbe34f41b51dd625e749d57a206cb77,
20f8a7520fc336c860788a3e65d763e2050cd5a1e9360caaa5b14ce678412534 e
07d6f608433046d70748047730c61374557ea86fc0fe8eac37bd0342a31d1d3e.
Manifestos de jobs distintos têm hashes distintos; não presumir igualdade
de referências/artefatos só porque a imagem final coincide.

## Reprodução e fotografia técnica

Preparar explicitamente o pacote pelo comando documentado, com `--platform`;
testes não fazem aquisição. Rodar pelo reactor, offline, com Docker/cache locais:

```text
./mvnw -o -pl apps/translation-gateway -am test
  -Dtest=NativeCodecAmd64LinuxTest,NativeRenderingWorkerAmd64LinuxTest
  -Dsurefire.failIfNoSpecifiedTests=false -Drenderer.amd64.enabled=true
  -Drenderer.amd64.distribution.directory=<pacote-local-absoluto>
  -Drenderer.amd64.distribution.sha256=9cca2ffb1ac4938682fb640a1f8ddc7bf913c451ba73177b60ecfa13ccbe3c8c
  -Drenderer.linux.docker.host=<socket-local>
  -Drenderer.linux.codec.directory=<decoder-ARM64-independente-preparado>
```

Todas as linhas formam um comando; mesmas regras de Docker/DOCKER_HOST da
prova anterior. Worker positivo fixa diagnóstico 4 GiB; OOM ARM64 original e
experimento preventivo permanecem intactos. Gates finais na [review](../review.md).

340 fontes/testes/scripts/configurações, receita ordenada path+NUL+bytes+NUL:
3b7d4cb36280abb1e7b7cc3e395c9f6bbe30b69fff48be4955d24fef402d19b1.
Boot JAR rebuilt offline:
dba01c8b4d03b250ce1d20914dc6717208921bef739ae4e7b86a7eda7f4c5145.
Checksum mobile é governança separada; fotografias históricas preservadas.

## Limites e próximo trabalho

Compatibilidade funcional x86_64 local observada, não deploy Cloud Run,
performance em hardware AMD64 nativo, orçamento garantido ou revisão visual.
Pico em emulação não serve de dimensionamento cloud. Não fecha AC-006:
[OOM compartilhado](rendering-worker-oom-2026-10-07.md) continua não confiável.
Qualidade/operação, timeout/cancelamento completos, recursos totais/retention e
distribuição operacional continuam abertos. Não enfraquecer o teste que matou
o pai, reduzir caps/qualidade ou aumentar RAM cloud para aprovar.
Performance mobile N/A: somente governança, nenhum runtime do app alterado.
