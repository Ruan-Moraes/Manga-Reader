# Codec libwebp FFM — plano de integração local, 2026-10-04

## Decisão corrente — 2026-10-05

Ruan escolheu manter libwebp com orçamento total medido. O
[plano de memória](rendering-memory-policy.md) e a spec revisada admitem buffers
internos limitados/contabilizados. Isso resolve a decisão arquitetural, não o
OOM a 1 GiB ou as pendências de integração/contenção/distribuição. A prova local
de 2 GiB não altera o orçamento cloud. Os trechos abaixo preservam o plano e
as conclusões históricas sob a redação anterior de AC-006.

Parcela AC-001/004/005/006 e TASK-002/007/008. Reutilizar a superfície ARGB
nativa para evitar PAM/ReadPNM/ImportRGBA e seus buffers integrais. Não alterar
RenderPort, schema, HTTP, defaults ou worker neste incremento: primeiro provar
codec/ABI/ownership e round-trip antes de integração supervisionada.

## ABI e preparação

Compilar source oficial 1.6.0 intacto com debug somente no container local já
autorizado. Conferir sizeof/offsets pelo DWARF de structs WebPConfig/WebPPicture,
sem programa C próprio. Manter hashes, opções e limites, sem rede após toolchain.
Modelar layouts Java LP64 explícitos e conferir todos os campos usados e tamanho
total. Plataforma não admitida falha fechada; não adivinhar ABI ou trocar lib.

Loader explícito verifica hashes da libwebp e libsharpyuv antes de load, versão
1.6.0 e inicializadores com ABI version 0x0210. Nenhum load/download por teste
comum ou modo disabled. Não incluir libs locais no JAR de produção.

## Encode/decode e ownership

- Encoder usa WebPPicture com ponteiro ARGB emprestado da Arena; nunca Alloc,
  Import ou Copy da página. Lossless/exact, qualidade 100, método 4, sem metadata.
- Writer Java recebe chunks limitados e grava somente arquivo próprio, sem
  buffer de saída ilimitado; callbacks não deixam exceptions atravessar C.
- Interrupção/deadline são verificadas por writer/progress hook. Não prometem
  preempção: capacidade e arenas só são liberadas após retorno nativo. Hard
  timeout continuará exigindo JVM filha e contenção operacional.
- Decoder WebP usa saída externa BGRA no mesmo buffer em little-endian, limitado
  por bytes/dimensões/hash. Não usar decoder com alocação própria/cópia integral.
- Falhas sanitizadas, limpeza somente de paths criados e source nunca sobrescrito.
  Dependências e raster permanecem vivos até todas as downcalls terminarem.

## Testes antes do código e limites

Layouts/offsets e configuração inválida em testes leves sem biblioteca. Opt-in
nativo prova exact/alpha/RGB invisível, dimensões não múltiplas de quatro,
decode externo/alias, input preservado, limite de saída, deadline/interrupção,
falhas e lib adulterada. Executar no Linux ARM64 sem rede/credenciais e fixtures
sintéticas, sem imagens reais. Comparar também decode do CLI independente.

Testes funcionais não provam pico de memória nem ausência de buffers internos
do algoritmo VP8L. Profiling máximo deve ser repetido após integração completa.
AC-006, orçamento 1 GiB, distribuição/contenção/retenção/qualidade continuam
abertos. SDD/review/drift e checksums separados; 020 in-progress, 021 blocked.

FFM Java 23: [Linker](https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/lang/foreign/Linker.html)
e [MemoryLayout](https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/lang/foreign/MemoryLayout.html).

## Execução e reprodução opt-in

### Próxima prova local: fluxo e recursos

Antes de ligar o codec ao worker, acrescentar probe exclusivo de testes com
decode PNG/JPEG na superfície nativa, composição existente, encode e decode
externo no mesmo buffer. Comparar hash dos pixels antes/depois do round-trip,
sem segundo raster completo. Medir cgroup, RSS, tempo e scratch reais em Linux
isolado, com fixture plana e multicolor de 80M pixels dentro de 12 MiB; incluir
falhas de memória/scratch e uma página seguinte independente. A fixture
multicolor deve conter mais de 256 cores, não apenas repetir a prova de paleta.

O source oficial `vp8l_enc.c`, `AllocateTransformBuffer`/`MakeInputImageCopy`,
aloca e copia uma imagem de trabalho W×H quando não usa paleta. Portanto evitar
PAM/Import no wrapper não demonstra AC-006 integral. Não liberar o ponteiro
emprestado durante a downcall, mudar qualidade, reduzir limites ou aumentar o
budget operacional para acomodar resultados. Esta medição é evidência, não
admissão automática do codec ou de memória cloud.

Prova implementada por `NativeRenderResourceTest` e `NativeRenderResourceProbe`
somente em src/test. Exige `-Drenderer.shared.resources.enabled=true`, os demais
pins/requisitos do comando abaixo e a nova classe na seleção `-Dtest`. Uma CPU,
64 PIDs, network none, root/entradas read-only. Heap 256 MiB e scratch 128 MiB
nos máximos; cgroup 4 GiB apenas para medir, 1 GiB para reproduzir insuficiência.
Nada disso muda a configuração cloud. Scratch 64 MiB falhou nas fontes da
multicolor; repetição com 128 MiB foi explícita, sem reduzir entrada. Hash de
todos os pixels antes/depois do decode no mesmo segmento; fixture pequena
pintada também comparada com compositor existente e decoder CLI independente.
Ver [evidência de recursos](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-native-resources-2026-10-04.md).

Rejeição de largura/altura/pixels por política explícita no encode agora retorna
`codec-invalid-media`, sem causa nem criação de arquivo; I/O genuíno continua
`codec-unavailable`. Regressão Linux precedeu a correção. Ver
[política e decisão pendente](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-native-policy-2026-10-04.md).
Esse fix não elimina buffers internos VP8L nem admite modo nativo no worker.
Pesquisa de outros codecs é informativa; não há troca de dependência ou novo
encoder aprovado. Requisito/caps/qualidade continuam intactos.

ABI conferida em source oficial sem modificações; codec Java local funcional
no teste Linux ARM64. `WebpNativeAbi` registra layouts completos; init e versão
da biblioteca são verificados. NativeWebpCodec continua interno/owner-confined,
sem ligação ao worker. Encoder nunca chama Alloc/Import/Copy da página.

Antes do teste, empacotar offline a versão atual a partir de `api/` com
`./mvnw -o -pl apps/translation-gateway -am package -DskipTests`. Depois executar
`NativeWebpCodecLinuxTest` pelo reactor, com opt-ins preparados explicitamente:

```text
./mvnw -o -pl apps/translation-gateway -am test -Dtest=WebpNativeAbiTest,NativeWebpCodecTest,NativeWebpWriterTest,NativeWebpCodecLinuxTest -Dsurefire.failIfNoSpecifiedTests=false -Drenderer.shared.enabled=true -Drenderer.shared.directory=<diretório absoluto das libs verificadas> -Drenderer.linux.docker.host=<socket Unix local> -Drenderer.linux.codec.directory=<diretório absoluto dos CLI verificados>
```

O harness usa imagem/cache já preparados, root read-only, network none,
uma CPU/1 GiB/64 PIDs, libs/JAR/probe read-only e diretório exclusivo de saída.
Exige os pins da preparação oficial anterior; não aceita lib desconhecida,
download, ADC ou substituição silenciosa. `--enable-native-access=ALL-UNNAMED`
é fornecido à JVM do probe; não inicia Spring nem uma porta HTTP.

Writer/progress hook detectam deadline/interrupção cooperativamente. Decoder
tem conferência antes/depois da downcall, não abort nativo. Não confundir isso
com hard timeout: integração supervisionada/cgroup e nova medição de 80M
continuam necessárias. Falha nativa fatal ainda exige confinamento na filha.

Evidência datada em
[codec FFM](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-native-codec-2026-10-04.md).
