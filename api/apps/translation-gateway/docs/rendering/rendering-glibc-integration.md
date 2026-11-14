# Integração local glibc do renderer — 2026-10-10

As medições e os digests desta parcela descrevem Java 23 e ficam preservados.
O runtime atual foi migrado separadamente para
[Java 25](java25-migration.md), com novas imagens/pins e toolchain; ao repetir
os comandos abaixo, acrescentar `-t <toolchains.xml>` e consultar os alvos
atuais. Esta fotografia não deve ser usada para aprovar a versão nova.

Parcela de TASK-002/007/008 da MOB-FEAT-020, após a
[preparação local autorizada](rendering-glibc-preparation.md). É suporte explícito
de plataforma, não ativação operacional. Gateway, worker cloud, OCR, tradução,
layout e rendering continuam desabilitados por padrão; Terraform e Dockerfile
operacional não mudaram. Não houve provider pago, credencial ou mídia privada.

## Contrato de distribuição e runtime

O formato `toonlira-native-codec-1`, versão libwebp 1.6.0, mantém os cinco
arquivos readonly, pins externos, licenças e RUNPATH `$ORIGIN`. A plataforma
deve ser declarada, nunca inferida de um arquivo renomeado:

| `platform`            | Interpretador do Java executado | Dependências exatas de sharpyuv                   |
| --------------------- | ------------------------------- | ------------------------------------------------- |
| `linux-aarch64-musl`  | `/lib/ld-musl-aarch64.so.1`     | `libc.musl-aarch64.so.1`                          |
| `linux-x86_64-musl`   | `/lib/ld-musl-x86_64.so.1`      | `libc.musl-x86_64.so.1`                           |
| `linux-aarch64-glibc` | `/lib/ld-linux-aarch64.so.1`    | `libc.so.6`, `libm.so.6`, `ld-linux-aarch64.so.1` |
| `linux-x86_64-glibc`  | `/lib64/ld-linux-x86-64.so.2`   | `libc.so.6`, `libm.so.6`                          |

Webp exige o mesmo conjunto mais `libsharpyuv.so.0`. A dependência adicional
do loader ARM64 foi observada no build fixado; não é aceita genericamente
para qualquer arquitetura. Mistura, dependência ausente/extra, aliases,
metadata/hash/permissão incorretos falham antes da carga nativa.

`NativeRuntimeElf` lê somente header/program headers e o `PT_INTERP` limitado
de `/proc/self/exe`. Exige ELF64 little endian, máquina correspondente,
Java 25/Linux no contrato atual (23 nesta fotografia) e interpretador único conhecido; ausência/incoerência fecha o
modo. Não usa FFM, `ldd`, subprocesso, existência de arquivos libc ou variável
do host para adivinhar a libc. O symlink é fixo e controlado pelo kernel,
nunca recebido da task ou configuração de job.

O packager aceita `--platform linux-aarch64-glibc` ou
`--platform linux-x86_64-glibc`. O default histórico continua ARM64/musl;
para glibc a seleção explícita é obrigatória. `packaged-not-admitted`
continua significando somente criação do pacote, não execução ou admissão.

## Reservas virtuais e política do allocator

O primeiro worker glibc falhou no bootstrap nos dois alvos antes de qualquer
OCR/tradução. Codec e guard self-only passaram. Em um diagnóstico posterior,
x86_64 já reservava 3.237.998.592 bytes virtuais no ponto de falha, acima do
cap do pai de 3 GiB. A política explícita de arenas reduziu essa reserva,
mas o helper, com ambiente limpo, ainda não preparava o pai.

Para o modo nativo glibc, o processo pai deve iniciar com
`MALLOC_ARENA_MAX=2`. A preparação recusa valor ausente/diferente. Helper e
filha limitados recebem somente essa constante definida pelo launcher, sem
herdar tunables, LD paths, JAVA/JDK options ou credenciais. Musl conserva
ambiente vazio. Não há mudança em heap, caps AS/CPU/disco/PIDs, política
lossless/exact, dimensões ou textos.

Essa configuração limita o número de arenas conforme a
[documentação GNU](https://sourceware.org/glibc/manual/latest/html_node/Memory-Allocation-Tunables.html),
**não** a RAM total, nem garante ganho de desempenho/ausência de contenção.
Não confundir reserva virtual com RSS ou `memory.peak`. Medições e resultado
do worker combinado são evidências separadas do diagnóstico causal.

## Testes e repetição

Entradas, versões, digests Noble, archive, modelos e bibliotecas são os mesmos
da preparação. JAR de produção deve ser reconstruído pelo reactor antes dos
testes de archive. Nenhuma dependência nova, download ou instalação em teste.

```text
./mvnw -o -pl apps/translation-gateway -am package -DskipTests
./mvnw -o -pl apps/translation-gateway -am test
  -Dtest=NativeCodecGlibcLinuxTest,NativeRenderingWorkerGlibcLinuxTest
  -Dsurefire.failIfNoSpecifiedTests=false
  -Drenderer.glibc.enabled=true
  -Drenderer.glibc.arm64.directory=<pacote-readonly-arm64>
  -Drenderer.glibc.arm64.sha256=<pin-do-manifesto>
  -Drenderer.glibc.amd64.directory=<pacote-readonly-x86_64>
  -Drenderer.glibc.amd64.sha256=<pin-do-manifesto>
  -Drenderer.linux.docker.host=<socket-local>
  -Drenderer.linux.codec.directory=<cli-arm64-independente-verificado>
```

O segundo bloco representa um comando com todas as opções. São testes
opt-in, não scripts de produção. Runtime usa digests/pull never, rootfs e
inputs readonly, usuário sem privilégios, nenhum endpoint Google ou ADC.
Workers acessam apenas PostgreSQL temporário em rede Docker interna e
servidores gRPC loopback falsos. O decoder independente permanece ARM64/musl.

O harness slim antigo de configuração também foi atualizado para satisfazer
a admissão atual: tmpfs limitado, teto diagnóstico 8 GiB e reservas JVM
controladas; ele antes usava staging no disco e 1 GiB. Dois testes existentes
reproduziram a falha antes do ajuste. Saídas são exportadas separadamente;
nenhum guard foi removido ou contornado para liberar esses testes.

Testes puros validam intérprete/ELF/máquina/offsets, libc e dependências,
política fixa do allocator, aliases, pins, imutabilidade e falhas sanitizadas.
O teste de codec real cobre alpha/RGB invisível, buffers emprestados,
dimensões/bytes/hash, interrupt, timeout, capacidade e cleanup; o worker
exercita três jobs sequenciais com SDKs oficiais contra fakes.

## Limites e sequência restante

O teste máximo usa PNG sintética de 10.000 × 8.000, 80 milhões de pixels,
7.322.972 bytes. Compara saída textual total máxima, uma região de tradução
máxima que é pintada e página vazia. Fallback íntegro não é aprovação visual.
Não cobre novamente todos os scripts, JPEG/WebP máximos, ONNX residente,
falhas/OOM combinados, hardware x86_64 nativo ou operação GCS/Tasks.

Teto cgroup 8 GiB e AS pai/filha 3 GiB são diagnósticos/precondições atuais,
não admissão do ambiente cloud 1 GiB. A imagem operacional ainda não entrega
pacote nativo fixado e a base Java 23 histórica não é aprovação de segurança.
Próximo trabalho: distribuição operacional opt-in verificável, matriz ampliada
do worker nessa base e decisão de orçamento após provas integrais, com gates
operacionais/qualidade próprios. Não habilitar uploads para testar.

Resultados e checksum da parcela ficam na
[evidência sanitizada](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-glibc-integration-2026-10-10.md).
020 permanece `in-progress/open`, verdict `changes-requested`,
TASK-002/006/007/008 abertas; 021 continua bloqueada. APIs, manifests,
migrations, dados OCR históricos e código mobile não foram alterados.
