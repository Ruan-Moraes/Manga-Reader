# Build oficial local libwebp — 2026-10-04

Preparação autorizada por Ruan: source oficial, compilador/headers somente em
container local, sem C próprio; integração permanece Java. Parcela investigativa
de TASK-002/007/008 e AC-006, não correção entregue de cópias nativas.
020 in-progress/open, review changes-requested, 021 approved/blocked.

## Execução e provenance

[Plano anterior](../../../../../../api/apps/translation-gateway/docs/rendering-native-build.md).
Source libwebp 1.6.0 reutilizado, SHA-256
`e4ab7009bf0629fd11982d4c2aa83964cf244cffba7347ecd39019a9e38c4564`.
Imagem reutilizada
`eclipse-temurin@sha256:88593498863c64b43be16e8357a3c70ea475fc20a93bf1e07f4609213a357c87`,
ARM64/Alpine 3.21.3, uma CPU, 1 GiB/sem swap adicional, 64 PIDs,
cap-drop ALL/no-new-privileges. Apenas archive RO e diretório exclusivo
ignorado montados, não workspace/HOME/imagem/ADC. Root gravável permite apk
somente no container, sem instalação no host.

`apk add --no-cache gcc musl-dev make` usou HTTPS dos repositórios oficiais
Alpine v3.21. gcc 14.2.0-r4, musl-dev/musl 1.2.5-r11, make 4.4.1-r2.
Atualização musl r9 → r11 ficou restrita ao container. Inventory de 84 pacotes
preservado localmente. Rede bridge desconectada antes de configure/build/smoke;
inspeção Networks retornou `{}`. Nenhum pull/provider/credencial/mídia real.

Configure/Makefiles upstream sem alterações: prefix `/build/install`,
shared/on, static/off; mux/demux/extras/decoder separado/threading e
PNG/JPEG/GIF/TIFF/GL/SDL/WIC off; AVX2/SSE4.1/SSE2 off em ARM64; `CFLAGS=-O2`.
`make -j1` e `make install` exit 0, somente no prefix local.
Sem autogen, SWIG, Python ou JNI customizado. Comparação byte a byte contra
nova extração do archive: 367 arquivos upstream, zero divergências.
Arquivos gerados adicionais não são confundidos com source.

Warning preservado: configure linha 14870 executa `-a` isolado por quebra
de linha upstream. Observado nas duas configurações, exit 0 e build concluído;
opções x86 explícitas não o eliminaram. Sem edição para ocultá-lo ou alegação
de build sem warnings. Aviso Docker de `--time` deprecated também explícito.

## Integridade e smoke Java

| Artefato             | SHA-256                                                            |
| -------------------- | ------------------------------------------------------------------ |
| libwebp.so.7.2.0     | `ae9bd6f135c9ccd5de96cacc19b155f5c646bf3362c6d39086f4b1e1df427eb8` |
| libsharpyuv.so.0.1.2 | `f7ef39823cce822098b53a516262b07490a42f69522de1ff5aa9db73232fa457` |
| encode.h             | `928e8d3ed502baa0f47ed10913ee018ed6172afcd4f308e0ea005a126b83f27e` |
| decode.h             | `e554551d085f234e930f36b5879a77ef58bfea34c48ebfd620426e63b224025c` |
| COPYING              | `5aec868f669e384a22372a4e8a1a6cd7d44c64cd451f960ca69cc170d1e13acf` |
| PATENTS              | `cc3273e0694ea5896145e0677699b53471b03ea43021ddc50e7923fbb9f5023c` |

ELF64 little-endian/AArch64, SONAME libwebp.so.7; NEEDED libsharpyuv.so.0 e
libc.musl-aarch64.so.1. RUNPATH `/build/install/lib` é local, não distribuição
portável. Exports de versão/encode/decode conferidos; não prova de structs ABI.
SHA não substitui assinatura upstream, ainda não validada, nem revisão das
licenças transitivas. Toolchain não será distribuído como runtime nesta parcela.

Probe Java 23 ignorada usa [FFM SymbolLookup](https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/lang/foreign/SymbolLookup.html)
e [Linker](https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/lang/foreign/Linker.html)
somente para funções de versão sem argumentos. Verifica SHA antes do load,
arena controla lifetime. Positivo exit 0, encoder/decoder 1.6.0; SHA zerado
exit 1 com mensagem sanitizada antes do load. Probe SHA
`94fd23f1c1f13c53e79e95661fd980c93681f0969d8d69b152b34c6406e844f5`.

Positivo repetido em container novo da imagem original pinada, root RO,
network none, build RO, 256 MiB/heap 64 MiB, uma CPU/64 PIDs/cap-drop ALL:
exit 0. Smoke não depende da atualização musl do container de compilação.
Não processa imagem nem valida round-trip/exact/alpha ou redução de memória.

Artefatos/probe/inventory: `.local/rendering-linux/native-build.vLY64G/`,
com `build-manifest.json`. Container exclusivo parado/removido; imagem/cache
e artefatos preservados. Toolchain só existia no container removido, não no host.

## Decisão e gates

Preparação concluída, sem alteração de runtime/pom/schema/defaults/codec.
Checksum técnico 292 arquivos permanece
`5f49d753e69776a2d4ab3a396100589f163fdd91a8d1d20b023dc3dfb01c838e`;
gates Java/Node/web estão na [baseline de recursos](rendering-linux-resources-2026-10-04.md).
Checksum de governança e gates SDD/mobile reexecutados após estabilização,
sem renovar conclusões históricas ou reinstalar dependências.

`pnpm check` integral exit 0: 116 suítes/892 testes, com SDD/links/typecheck/
lint/FSD/formato e controles de performance. Formatação só dos documentos
alterados e diff-check aprovados. Nenhum container de build/teste permaneceu;
libs/headers/manifesto continuam em diretório ignorado, não no artefato de produção.

Próxima parcela deve validar ABI/buffers/lifetime e round-trip Java antes de
integrar adapter. Carregar a lib não prova ausência de cópias internas.
AC-006 permanece parcial; findings de 1 GiB/cgroup read-only, distribuição,
contenção/integração, retenção integral e revisão visual continuam abertos.
Tasks/status/gates conservados; governança não é performance Android.
