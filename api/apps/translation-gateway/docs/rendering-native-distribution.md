# Distribuição local fixada do codec — 2026-10-05

Parcela de TASK-002/007/008 da 020, sob a decisão de manter libwebp com
[orçamento total medido](rendering-memory-policy.md). Não é admissão operacional:
cloud continua com 1 GiB e defaults disabled; 020 in-progress/open, 021 blocked.

Parcela posterior: o bean seleciona a variante guardada com
[limites self-only](rendering-native-limits.md) antes de fontes/decode.
As provas e pins abaixo são a fotografia da distribuição anterior; não são
renovados como perfil do worker completo ou orçamento operacional.

Parcela posterior de 2026-10-07: admissão explícita de ARM64 e x86_64/musl,
com manifesto/ELF/libc vinculados e correspondência ao runtime no bean. O
packager aceita `--platform linux-x86_64-musl`; sua ausência preserva o comando
ARM64 anterior, nunca deduzindo o alvo do host. Defaults/migrations/contratos,
libwebp lossless/exact e RAM cloud permanecem. Provas de codec, guard, bean e
worker com PostgreSQL/storage reais em x86_64 **emulado** estão na
[evidência](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-amd64-2026-10-07.md).
Não é hardware AMD64 nativo, orçamento garantido, isolamento ou deploy cloud.

## Pacote e admissão

Parcela posterior de 2026-10-10: [alvos glibc explícitos](rendering-glibc-integration.md)
coexistem com musl. Runtime é verificado por `PT_INTERP` do Java, sem FFM no
pai; dependências exatas são específicas de cada alvo. Glibc exige política
fixa de arenas no pai/helper/filha limitados. As descrições/pins musl abaixo
são a fotografia anterior, não regra permissiva para carregar glibc como musl.

`scripts/render-native-package.mjs` recebe somente arquivos locais e hashes
explícitos. Não baixa, compila, carrega biblioteca ou usa Google. Reserva destino
novo atomicamente, sem sobrescrever/retomar/remover pacote parcial. Falha de
escrita preserva o diretório para recuperação explícita pelo operador.

O pacote contém exatamente `libwebp.so.7`, `libsharpyuv.so.0`, `COPYING`,
`PATENTS` e `manifest.properties`: arquivos regulares 0444, diretório 0555, sem
symlinks. Licenças e archive oficial são fixados por hash; o manifesto registra
versão 1.6.0, plataforma Linux ARM64/musl e hashes. Paths locais não entram nele.
O SHA-256 do manifesto é fornecido pelo operador por canal de configuração,
nunca obtido da task ou do próprio pacote como única raiz de confiança.

`NativeCodecDistribution.admit` valida pin externo, coleção exata de arquivos,
permissões POSIX, hashes, atribuição e metadata real de ambos os ELF. O parser
Java limitado exige ELF64/LE/ET_DYN/AARCH64, SONAME fixo, RUNPATH `$ORIGIN`,
sem RPATH absoluto, e dependências exatas: libwebp → libsharpyuv + libc musl;
libsharpyuv → libc musl. Rejeita limites/offsets incoerentes, tags duplicadas,
strings inválidas e metadata ausente, sem `readelf`, FFM, shell ou rede no runtime.
Não é loader ELF geral nem auditoria de segurança do source upstream. A filha
continua conferindo hashes, ABI e versões encoder/decoder antes da chamada.

Permissões de arquivo não impedem um administrador de trocar o pacote/ancestrais.
A distribuição operacional deve estar em mount readonly, com deployment e imagem
controlados. Nesta prova, todo o pacote foi montado readonly em `/relocated/lib`;
`/build` não existia e nenhuma variável de search path foi herdada.

## Preparação explícita

Aquisição/toolchain em container é ação separada previamente autorizada. Cache
Docker, archive e package não são preparados durante task ou teste comum. Usar
source oficial intacto e diretório de build novo; preservar versões anteriores.
Compilar pelo CMake oficial, sem source C próprio ou Python. Após instalar os
pacotes oficiais do compilador, desconectar a rede antes de configurar/build.

Exemplo das opções executadas no container local (diretórios isolados `/build`):

```text
cmake -S /build/libwebp-1.6.0 -B /build/cmake
  -DCMAKE_BUILD_TYPE=Release -DCMAKE_C_FLAGS_RELEASE=-O2
  -DCMAKE_INSTALL_PREFIX=/build/install -DBUILD_SHARED_LIBS=ON
  -DWEBP_LINK_STATIC=OFF -DWEBP_ENABLE_SIMD=OFF -DWEBP_USE_THREAD=OFF
  -DWEBP_BUILD_ANIM_UTILS=OFF -DWEBP_BUILD_CWEBP=OFF -DWEBP_BUILD_DWEBP=OFF
  -DWEBP_BUILD_GIF2WEBP=OFF -DWEBP_BUILD_IMG2WEBP=OFF -DWEBP_BUILD_VWEBP=OFF
  -DWEBP_BUILD_WEBPINFO=OFF -DWEBP_BUILD_LIBWEBPMUX=OFF -DWEBP_BUILD_WEBPMUX=OFF
  -DWEBP_BUILD_EXTRAS=OFF -DWEBP_BUILD_WEBP_JS=OFF -DWEBP_BUILD_FUZZTEST=OFF
  '-DCMAKE_INSTALL_RPATH=$ORIGIN' -DCMAKE_BUILD_WITH_INSTALL_RPATH=ON
  -DCMAKE_INSTALL_RPATH_USE_LINK_PATH=OFF
cmake --build /build/cmake --parallel 2
cmake --install /build/cmake
```

As linhas da configuração acima representam **um** comando, não um script novo.
O install também produz bibliotecas extras oficiais; o pacote admite somente
webp/sharpyuv. Nenhum arquivo upstream foi editado. Manter os bytes de COPYING
e PATENTS, inclusive finais de linha, em vez de reformatá-los.

Empacotar explicitamente, com paths absolutos canônicos e destino inexistente:

```text
node scripts/render-native-package.mjs --webp <libwebp.so.7.2.0>
  --sharp <libsharpyuv.so.0.1.2> --webp-sha256 <hash-verificado>
  --sharp-sha256 <hash-verificado> --copying <COPYING> --patents <PATENTS>
  --destination <diretorio-novo>
```

Esse é um comando com todas as opções. Saída `packaged-not-admitted` significa
somente cópia/pins/licenças: admissão ELF e execução são provas separadas.
Registro do ambiente/pins efetivamente observado fica na
[evidência sanitizada](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-native-distribution-2026-10-05.md).

## Seleção explícita do worker local

`gateway.rendering.mode=supervised-native` é exclusivo do perfil worker, em
Java 23 Linux ARM64 ou x86_64/musl little endian, com pacote do mesmo alvo.
`disabled` continua padrão; `local` conserva
o CLI existente. Não há fallback entre modos. Configuração inválida falha no
startup com `Renderer preparation unavailable`, sem causa sensível.

- `GATEWAY_RENDERING_TEMP_DIR`: diretório absoluto existente e gravável;
- `GATEWAY_RENDERING_NATIVE_DISTRIBUTION`: pacote canônico readonly, vazio no default;
- `GATEWAY_RENDERING_NATIVE_DISTRIBUTION_SHA256`: pin externo, vazio no default;
- `GATEWAY_RENDERING_NATIVE_TIMEOUT`: PT60S, máximo 60 segundos;
- `GATEWAY_RENDERING_CHILD_HEAP_MIB`: 128, intervalo admitido 64..128 no bean nativo;
- `GATEWAY_RENDERING_PROCESS_DEADLINE`: PT90S, máximo cinco minutos.

O bean admite o pacote sem carregar FFM no pai e instancia IsolatedRenderAdapter.
Heaps maiores são recusados, não reduzidos silenciosamente: a reserva JVM
compartilha o teto virtual com o raster/encoder. O ajuste de 2026-10-08 mantém
AS de 3 GiB, codec/política/mídia íntegros e defaults de ativação desabilitados.
Heap/prazo não representam memória/disco totais nem contenção kernel. Filha
selecionada recebe native access; mantém capacidade/ownership/cleanup anteriores,
uma página pesada por JVM pai e sem fila. Processo público/default disabled
não verifica arquivos, carrega biblioteca nativa ou inicializa renderer.

A prova do bean usa contexto Spring mínimo e página pequena sintética sem texto,
não o worker completo com DB, OCR/layout residentes, storage e uploads. O caminho
transacional existente é preservado, mas seu profiling completo e interleavings
com o novo modo ainda precisam de provas. Terraform não foi modificado.

## Repetição offline e limites

Package atual pelo reactor antes dos testes de Boot. Testes leves:
NativeCodecElfTest, NativeCodecDistributionTest, RenderingConfigurationTest;
Node `node --test scripts/render-native-package.test.mjs`.

Prova real explicitamente selecionada: NativeCodecDistributionLinuxTest, com
`renderer.distribution.enabled=true`, `renderer.distribution.directory`,
`renderer.distribution.sha256`, `renderer.linux.docker.host` e
`renderer.linux.codec.directory` preparados conforme
[prova Linux](rendering-linux.md). Pull never/network none, Java/imagem fixados,
inputs/JAR/libs readonly e fixtures sintéticas. Decoder CLI independente confere
todos os pixels pequenos, alpha e RGB invisível; nada é enviado a providers.

Próximos incrementos: contenção atômica/recursos totais e execução do worker
completo em Linux, depois profiling de máximas/volume textual, sequências e
fault injection. Revisão visual/linguística e operação cloud continuam abertas.
Um package relocável não aprova automaticamente AC-006 ou um novo teto cloud.

Provas x86_64 posteriores opt-in: `renderer.amd64.enabled=true`,
`renderer.amd64.distribution.directory` e `renderer.amd64.distribution.sha256`,
com mesmo cache/socket/decoder ARM64 independente. Nada é baixado nos testes.
`NativeCodecAmd64LinuxTest` verifica codec/bean/guard; o
`NativeRenderingWorkerAmd64LinuxTest` fixa diagnóstico 4 GiB e confere estados,
hashes, redelivery e limpeza para pequena e máxima no worker completo com
providers falsos. O teste original de kernel OOM ARM64 não é substituído.
