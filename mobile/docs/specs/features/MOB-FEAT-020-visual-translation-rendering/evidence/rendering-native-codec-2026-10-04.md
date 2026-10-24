# libwebp FFM Java — evidência parcial, 2026-10-04

TASK-002/007/008, AC-001/004/005/006. 020 `in-progress/open`, verdict
`changes-requested`; 021 `approved/blocked`. Preparação/testes locais autorizados
por Ruan, sem mídia real, SDK Google, ADC/credenciais, provider pago ou cloud.
Não há C próprio, Python ou shell script próprio. Runtime mobile inalterado;
performance Android não aplicável nem inferida dessa prova Java/Linux.

## Plano e ABI

[Plano anterior aos testes/código](../../../../../../api/apps/translation-gateway/docs/rendering-native-codec.md).
Novo build oficial com debug em `.local/rendering-linux/abi-build.5Gtk93/`,
ignorado: source 1.6.0 e archive pinado da preparação anterior, 367 arquivos
upstream comparados byte a byte, zero modificações. GCC 14.2.0-r4,
musl-dev 1.2.5-r11, make 4.4.1-r2 e binutils 2.43.1-r3 somente no container.
Imagem Temurin pinada, uma CPU/1 GiB/64 PIDs/cap-drop ALL/no-new-privileges;
somente source e diretório de build montados, nenhuma mídia/repo/credencial.

Rede usada apenas para apk oficial Alpine, desconectada antes de configure,
make/install/readelf; inspect confirmou `{}`. Opções shared/formatos/threading
iguais ao build anterior, com `CFLAGS=-O2 -g`. Warning upstream de configure
linha 14870 (`-a` isolado) preservado; exit 0, sem edição para ocultá-lo.
Container encerrado/removido, toolchain não instalado no host. Manifesto local
registra comandos/hashes; apk reportou 84 pacotes, inventário integral deste
novo container não foi capturado, sem presumir equivalência ao anterior.

DWARF do source upstream AArch64 little-endian/LP64 confirmou:

| Struct      | Bytes | Campos usados e offsets                                                                                |
| ----------- | ----: | ------------------------------------------------------------------------------------------------------ |
| WebPConfig  |   116 | lossless=0, quality=4, method=8, exact=96                                                              |
| WebPPicture |   256 | use_argb=0, width=8, height=12, argb=72, stride=80, writer=96, error=136, progress=144, memory=224/232 |

Não houve programa C de offsetof. Layouts Java completos e padding explícito
são comparados em testes; versão 1.6.0 e init ABI 0x0210 conferidos no runtime.
Somente Linux ARM64 admitido; nenhuma suposição de ABI universal/Windows/macOS.

| Artefato de inspeção            | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| libwebp debug                   | `140a28c643adcee03820193ccaa6b9446bdd2a146f90445eae7b15584c9d73ba` |
| libsharpyuv debug               | `d79dcb070b19b19690b3a36c5660150d2db3bfb6220888f4ab7cb3d82435f6f0` |
| config_enc.o                    | `955935764b17c91588da2cdf9e81e9d86a52dd3eb243f638a08e66aa847bd536` |
| picture_enc.o                   | `a32bea3e8324098e3d6a05071488dad249477af0ff87de583ff5853c2a5d878d` |
| abi-dwarf.txt (somente structs) | `a75a15db50ab95d6754145d7ab3801a0929604cc1b8ca5cf471a17a336b5a28d` |

Headers encode/decode têm os hashes da preparação anterior. Libs de execução
do teste são as anteriores sem debug, verificadas nos dois arquivos antes de
load; ambos os conjuntos ficam ignorados, nenhum incluído no JAR de produção.
RUNPATH local e assinatura/licenças transitivas permanecem limitações explícitas.

## Código e comportamento testado

[NativeWebpCodec](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/NativeWebpCodec.java)
e [ABI](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/WebpNativeAbi.java)
são internos, sem bean ou ligação ao worker. Bibliotecas/Arena confinadas ao
owner, uma capacidade global sem fila. Encode usa argb emprestado, stride em
pixels, lossless/exact, q=100/m=4. Não chama Alloc/Import/Copy da página e não
produz PAM. Writer limitado grava chunks em arquivo próprio; callbacks capturam
falhas sem exceção bruta cruzando C. Init/free só liberam memória própria do
WebPPicture, não a superfície emprestada.

Decode valida snapshot limitado/hash/MIME/dimensões/container estático e usa
WebPDecodeBGRAInto no segmento externo. Comprimido é alocado separadamente,
limitado pelo teto de bytes, não outro raster. Aliases, endereço e pixels da
superfície são preservados; source não é escrito. Artefatos e snapshots próprios
são limpos, inclusive output-limit; lib adulterada/configuração inválida falha
sanitizada antes de load. Contratos, schema, defaults e CLI ativo inalterados.

## Testes red/green e execução real local

Primeiro red compilou testes antes das classes existirem. Callbacks também
tiveram red por acesso ausente; corrigida a fixture `Arena.allocateFrom` para
o overload Java 23 com JAVA_BYTE, sem alterar asserções. Nenhum teste eliminado.

Foco final: nove testes, zero failures/errors/skipped:

- WebpNativeAbiTest: dois, tamanhos/alinhamento/offsets oficiais.
- NativeWebpCodecTest: dois, timeout/hash/caminho/ausência/symlink inválidos,
  arquivos preservados, sem load de biblioteca nos testes comuns.
- NativeWebpWriterTest: quatro, limite cumulativo, storage fechado, timeout,
  interrupt preservado e ponteiro/contagens inválidos; callbacks retornam falha
  e erro posterior é sanitizado, sem causa/conteúdo.
- NativeWebpCodecLinuxTest: um, probe FFM real no Linux isolado e decode CLI
  independente. Não é OCR/tradução, qualidade linguística ou medição de 80M.

Probe real, versões/classes atuais: 1×1, 13×17 e 320×220 com canais/alpha
variáveis e RGB sob alpha zero. Round-trip pixel a pixel e ponteiro externo
iguais; source preservado. Limite de um byte, hash divergente, falta de objeto,
interrupção, timeout cooperativo, closed/foreign owner e limpeza conferidos.
Teste de busy ocupa explicitamente a capacidade no probe: comprova guard sem
fila, não duas inferências nativas simultâneas. Writer/progress têm testes
determinísticos de aborto; não se afirma preempção nativa imediata.

Harness usa JAR/probe/libs read-only, network none, uma CPU/1 GiB/64 PIDs,
heap 256 MiB e staging exclusivo; nenhum HOME/ADC/mídia privada. Decoder CLI
independente confirmou todos os pixels do WebP 320×220; arquivo não mudou.
Comando reproduzível e requisitos estão no plano/README do gateway. Regenerar
o pacote é passo explícito, não instalação automática ou download no teste.

Warning Java 23 de restricted reinterpret nos testes leves preservado;
probe fornece `--enable-native-access=ALL-UNNAMED`. Não oculta warning nem
habilita runtime/provider globalmente. Falha fatal da biblioteca continua a
exigir integração na JVM filha antes de qualquer admissão operacional.

## Hashes e gates

Snapshot técnico 303 arquivos, receita path relativo NUL bytes NUL de
src/scripts/openapi/pom/Terraform ordenados:
`7866c8a5de05d88f368434ed0810bd2352afcd5afca16173ac40846c905941cd`.
JAR atual empacotado offline, exit 0:
`edd5d757d2adbe115e031aec66f5eca3c1aaaab6fa564890e67d98c2bb6b82a5`.
Históricos anteriores preservados; checksum de governança mobile é separado.

Node 85 pass/um opt-in de fonte não selecionado, exit 0. Web tsc -b exit 0.
Maven global offline/Docker, opt-ins native/archive/Linux/resources/shared,
JAR atual: exit 0. 1.019 testes gateway/89 classes, zero failures/errors/skipped.
XMLs frescos desde `2026-10-04T20:51:46.871Z`, contados antes da suíte leve;
quatro harnesses históricos não reexecutados excluídos. PostgreSQL 17,
cadeia V1–V7, 49 migration/83 persistence/17 worker; nenhuma migration nova.

Profiling reexecutado é do CLI anterior: 80M/4 GiB passou com pico cgroup
1.939.107.840 bytes e 9,083 s; 1 GiB teve OOM sem resultado. Scratch/memória
falharam sem resultado e páginas seguintes passaram. Não são métricas do FFM,
não são melhoria ou orçamento aprovado. Nenhum container rendering permaneceu.
Suíte leve gateway offline/reactor, `-Dtest.excludedGroups=testcontainers`:
exit 0. `pnpm check` mobile completo exit 0: 116 suítes/892 testes, com
performance-tooling/SDD/links/typecheck/eslint/FSD/formato. Warnings `act(...)`
anteriores do Jest preservados, sem correção alheia. Sem reinstalação ou mudança
de lockfile. Formatação dirigida, whitespace dos arquivos novos e diff-check
aprovados; SDD/links reexecutados após estabilização. Rebase mecânico dos headers
não altera verdicts/históricos de outras features.

## Limites e próxima parcela

Não integrou NativeWebpCodec ao RenderPort/worker ou à filha supervisionada.
Esta prova elimina as cópias PAM/import no wrapper experimental, não comprova
ausência de buffers integrais internos do VP8L. AC-006 não é reduzido a cópias
Java. Profiling global continua exercitando o CLI anterior; seu finding de
1 GiB insuficiente não foi corrigido por essa prova funcional.

Writer/progress têm cancelamento cooperativo; decoder só antes/depois. Arena
e capacidade não são liberadas enquanto a downcall executa. Hard timeout,
contenção kernel, orçamento 80M, distribuição/ABI de outras plataformas,
licenças/assinatura, retenção integral e qualidade permanecem abertos.
Próxima parcela deve auditar buffers internos e medir a alternativa, além da
integração supervisionada; nenhum gate é aberto por expectativa de ganho.
