# Preparação local Java 23/glibc — 2026-10-10

Registro da preparação expressamente autorizada pelo usuário: rede e disco
locais para imagens oficiais, compilador/headers e libwebp upstream. Nenhuma
credencial, imagem privada, chamada paga, configuração cloud ou deploy foi usado.
Não é integração do renderer nem admissão operacional da MOB-FEAT-020.

## Entradas fixadas

A mesma versão Java dos diagnósticos anteriores, **23.0.2+7**, foi preservada.
Foi usada a variante oficial Ubuntu 24.04 Noble/glibc, com digest por alvo:

| Alvo         | Digest de `eclipse-temurin`                                               |
| ------------ | ------------------------------------------------------------------------- |
| Linux ARM64  | `sha256:b35cf225d6e3ac822b58f142b8268e5d2db8bf23a9a167c56ee2e821a5ea6cb5` |
| Linux x86_64 | `sha256:393ad826422f9dbee85d4601304d7c68c6c8240251a4d9633dc66a1017eac7fd` |

O [Dockerfile oficial da revisão fixada](https://github.com/adoptium/containers/blob/766789f16156ca5424fbd3a1b435d6bcd13d14b0/23/jdk/ubuntu/noble/Dockerfile)
é uma base **histórica de diagnóstico**, não uma aprovação de segurança ou
escolha automática de produção. O runtime original possui glibc
`2.39-0ubuntu8.3` e libstdc++ `14.2.0-4ubuntu2~24.04` nos dois alvos.

Entradas preservadas e novamente verificadas:

| Entrada                                                             | SHA-256                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| libwebp 1.6.0, archive upstream                                     | `e4ab7009bf0629fd11982d4c2aa83964cf244cffba7347ecd39019a9e38c4564` |
| ONNX Runtime Java 1.24.2, JAR oficial                               | `f429cc9d64b3bcef00bfac921a6aa231b3c280bee2e55c27f2563035b1a44104` |
| Detector FP32 da revisão `16e8a622f91fabc6b5b65c96d32d1183f8843546` | `065744e91c0594ad8663aa8b870ce3fb27222942eded5a3cc388ce23421bd195` |

Não houve upgrade/troca de SDK ou modelo, fallback, compatibilidade musl
simulada, conversão de mídia ou download durante task comum.

## Compilação e artefatos

Containers descartáveis distintos instalaram explicitamente
`build-essential` e `cmake` dos repositórios oficiais Ubuntu, sem pacotes
recomendados. APT atualizou também dependências transitivas: os builders
usaram GCC 13.3.0, CMake 3.28.3, glibc `2.39-0ubuntu8.9` e libstdc++
`14.2.0-4ubuntu2~24.04.1`. **Builder atualizado não é a base original do runtime.**
As listas completas e snapshots locais do toolchain foram preservados.
São snapshots derivados de teste, não imagens oficiais ou artefatos publicados.

A primeira consulta APT com todas as capabilities removidas falhou por falta
de `setuid/setgid/chown`. Apenas os builders foram recriados com CHOWN,
DAC_OVERRIDE, FOWNER, SETUID e SETGID, mantendo `no-new-privileges`, sem modo
privilegiado, mounts pessoais ou credenciais. Runtime dos probes permaneceu
sem capabilities. A rede dos builders foi desconectada **antes** do CMake.

Os comandos CMake são os mesmos da
[preparação upstream existente](rendering-native-distribution.md#preparação-explícita):
release `-O2`, bibliotecas compartilhadas, SIMD/threads/extras desligados,
RUNPATH `$ORIGIN`, sem source C próprio. `tar -dzf /source.tar.gz -C /build`
terminou com código zero nos dois alvos depois do build: source intacto.
COPYING e PATENTS foram preservados sem alteração.

| Alvo   | `libwebp.so.7.2.0` SHA-256                                         | `libsharpyuv.so.0.1.2` SHA-256                                     |
| ------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| ARM64  | `d98f252299f6451b57fc2a3cc914cc949d110e7c1ecd993f4714679ce7b82178` | `0de1f045859d93a0c80542538d667896e547489cfa5e0785c17a445fab01a0d4` |
| x86_64 | `bafda2750fa28e6e69b75df85b840b4e89cb47fedca57780c934a721903e67af` | `03205e19b046bdcee9b5245a7fb4b0378aecc2de119779719ce1a29f7c0a02fc` |

`readelf` confirmou ELF64 little endian AArch64/x86-64, SONAME esperado e
RUNPATH `$ORIGIN`. Dependências observadas:

- webp: sharpyuv, `libm.so.6` e `libc.so.6`;
- sharpyuv: `libm.so.6` e `libc.so.6`;
- ARM64: ambos também referenciam `ld-linux-aarch64.so.1`.

Isso **difere do allowlist musl**. Não se apontou o packager/admission atual
para estes binários, não se enfraqueceu o parser ELF e não se renomeou o alvo
para obter aceitação. A árvore oficial de install inclui outras bibliotecas
e symlinks; também não é o pacote readonly restrito de produção.

## Provas executadas sem rede

Probes Java, exclusivos desta preparação local, usaram as bases **originais**
fixadas acima, não os builders. Rootfs e mounts readonly, usuário 1000,
network none, cap-drop ALL, sem swap adicional, CPU 1 e PIDs 64.
O arquivo do modelo e o JAR oficial foram montados readonly; nenhuma amostra
foi montada. x86_64 foi executado sob emulação no computador ARM64.

| Prova                                                                             | ARM64                          | x86_64 emulado                 |
| --------------------------------------------------------------------------------- | ------------------------------ | ------------------------------ |
| ONNX: verificar modelo, carregar runtime e criar sessão real                      | Passou                         | Passou                         |
| ONNX: uma inferência real local sobre raster branco gerado de 640 × 640           | Passou; zero balões            | Passou; zero balões            |
| Tempo sessão + inferência desse probe                                             | 1.961.867.964 ns               | 4.299.921.911 ns               |
| `memory.peak` desse container ONNX                                                | 638.562.304 bytes              | 746.991.616 bytes              |
| FFM: versões encoder/decoder 1.6.0 e encode/decode lossless de BGRA opaco 16 × 13 | Pixels e buffer fonte íntegros | Pixels e buffer fonte íntegros |
| FFM: hash incorreto                                                               | Rejeitado, exit 1 sanitizado   | Rejeitado, exit 1 sanitizado   |

O container ONNX teve teto diagnóstico de 4 GiB, sem teto virtual do worker;
o codec pequeno teve 1 GiB. Não são medidas do worker completo, throughput,
qualidade do detector, recuperação de OOM, alpha/RGB invisível, raster máximo
ou admissão cloud. O aviso de identificação de CPU no ARM64 não impediu as
provas; não é certificação de hardware.

## Repetição local e próximos passos

O diretório ignorado de preparação guarda `preparation.json`,
`execution.json`, listas de pacotes, probes Java e classes, bibliotecas,
licenças e comandos efetivamente executados. Ele é um registro local,
não um pacote distribuído pelo Git. Repetir as provas exige esse diretório
ou uma nova preparação explícita; não há instalador/download implícito.
Os comandos de runtime usam `--pull=never`, `--network none` e os pins
verificados. Não dependem de ADC, Vision, GCS ou respostas OCR privadas.

Para integrar glibc ao produto, o próximo incremento deve testar e implementar
alvos explícitos no contrato de distribuição/ELF/runtime, mantendo o musl
histórico identificado e recusando mistura. Depois executar codec completo,
guard/bean e worker com PostgreSQL/storage/providers locais, sequências,
máximos, falhas e orçamento total. O teste FFM direto acima não substitui
`NativeWebpCodec`, sua política lossless/exact ou sua ABI completa.

Fontes, testes versionados, configuração, JAR, migrations e defaults do
gateway permanecem intactos nesta preparação. O checksum técnico auditado
continua `62ef09e4ccaffca71ace56be3d9cfaef52d78fbdbae20d30f474117f63815c4e`
(373 arquivos), JAR `954b42c29bf71ec316e29d59c87e133d6b2b7541fbf69564a5eb77a234a091cd`.
020 permanece `in-progress/open`; 021 continua bloqueada. Cloud 1 GiB e
todos os defaults desabilitados foram preservados.

## Verificação desta preparação

Execução global iniciada em `2026-10-10T09:49:12Z`, pelo reactor `api/`:
`./mvnw -o -q test` com Docker local. Os relatórios novos registraram 2.700
testes, zero failures/errors e 96 skips opt-in; gateway: 1.229 testes,
zero failures/errors, os mesmos 96 skips. Esses skips **não** são novas provas
dos testes nativos integrais. Os probes explícitos acima são evidência distinta.

`tsc -b` web, `pnpm specs:check`, links documentais, Prettier dos dois
documentos alterados e `git diff --check` passaram. Não houve reinstalação de
dependências Maven/pnpm, formatação global, mudança de validator ou renovação
de conclusões históricas. O checksum técnico foi conferido antes/depois e
permaneceu igual; nenhum arquivo do escopo do checksum SDD foi alterado.

Os dois containers descartáveis de build foram removidos após salvar arquivos
e snapshots locais do toolchain. Os resultados podem ser recuperados desses
artefatos; nenhum outro container, cache, imagem ou arquivo foi removido.
