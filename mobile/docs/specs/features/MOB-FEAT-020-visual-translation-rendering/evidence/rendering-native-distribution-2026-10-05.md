# Distribuição relocável e opt-in supervisionado — 2026-10-05

Parcela posterior a [FFM supervisionado](rendering-supervised-native-2026-10-05.md),
TASK-002/007/008. Ruan escolheu manter libwebp com orçamento total medido.
Preparação local de Java/compiler/headers/libwebp autorizada; sem C próprio,
Python, provider, ADC, mídia privada, cloud ou deploy. 020 in-progress/open,
021 approved/blocked; tasks abertas/verdict preservados.

## Fontes e testes

- [Plano e uso](../../../../../../api/apps/translation-gateway/docs/rendering-native-distribution.md).
- [Pacote JS](../../../../../../api/apps/translation-gateway/scripts/render-native-package.mjs) e
  [testes Node](../../../../../../api/apps/translation-gateway/scripts/render-native-package.test.mjs).
- [Admissão Java](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/NativeCodecDistribution.java),
  [parser ELF limitado](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/NativeCodecElf.java),
  [configuração opt-in](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderingConfiguration.java).
- [Testes de pacote](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeCodecDistributionTest.java),
  [metadata ELF sintética](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeCodecElfTest.java),
  [configuração/regressões](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/RenderingConfigurationTest.java),
  [Linux relocável/bean](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeCodecDistributionLinuxTest.java).

Testes precederam ferramenta, parser ELF e classe de configuração; RED de módulo
ausente/compilação confirmado. Fixture da licença com final de linha diferente
foi rejeitada e corrigida para os bytes upstream, sem flexibilizar pins.
Comparação inicial com source autotools anterior encontrou config.h gerado;
a prova definitiva comparou cada entrada do archive oficial ao novo source:
367 arquivos, zero divergências. Nenhum código upstream editado.

## Build e pins observados

Release oficial libwebp 1.6.0 já adquirido: SHA-256
`e4ab7009bf0629fd11982d4c2aa83964cf244cffba7347ecd39019a9e38c4564`.
Hash/bytes conferidos; assinatura GPG não verificada neste incremento.
Imagem Java já em cache:
`eclipse-temurin@sha256:88593498863c64b43be16e8357a3c70ea475fc20a93bf1e07f4609213a357c87`.
Java 23.0.2+7, Alpine 3.21.3 ARM64. Toolchain explícito somente no container:
gcc 14.2.0-r4, musl-dev 1.2.5-r11, make 4.4.1-r2, cmake 3.31.1-r0,
binutils 2.43.1-r3. Rede desconectada antes do CMake/build.

Build oficial Release/-O2, shared, SIMD/thread/tools/extras/mux desligados;
install RPATH `$ORIGIN`, build-with-install-rpath ON,
install-rpath-use-link-path OFF. Bibliotecas extras do install fora do pacote.
Probes de OpenGL/SIMD indisponíveis não aprovam essas funções. Pins deste build,
não promessa de reprodução bit a bit em outro toolchain.

| Artefato            | SHA-256                                                            |
| ------------------- | ------------------------------------------------------------------ |
| libwebp.so.7        | `5046e2b5eb34a094f84b72b45acc007aa6592faecd505df4ade1add2cf794737` |
| libsharpyuv.so.0    | `7c10e4e0b24bc3548d97f7a67e311714589d0ad6bdd0626c7f0b89ee47c1f122` |
| COPYING             | `5aec868f669e384a22372a4e8a1a6cd7d44c64cd451f960ca69cc170d1e13acf` |
| PATENTS             | `cc3273e0694ea5896145e0677699b53471b03ea43021ddc50e7923fbb9f5023c` |
| manifest.properties | `b2c1ce7b18b69fede9a556d18423858455003d3bf82c252263b6eb550b8a4209` |
| Boot JAR atual      | `d7aefeadb709ab14777598c09013e00943f6d2cf17212eff0b7a2250da2f11c1` |

readelf confirmou SONAME/NEEDED/RUNPATH; Java confere os bytes independentemente.
Dependências exatas: webp → libsharpyuv.so.0 + libc.musl-aarch64.so.1;
sharp → mesma libc. JVM/libc pertencem à imagem, não duplicadas no package.
Pin externo e mount readonly confiável são obrigatórios: bits POSIX não
protegem contra administrador substituindo arquivos/ancestrais.

## Provas

- JS: criação exclusiva/concorrência, hashes/licenças, symlink, original
  preservado, metadata sem paths e pacote readonly. Falha de escrita mantém
  reserva parcial para recuperação explícita; sem download/runtime implícito.
- Java: ELF sintético limitado, bounds, SONAME/RUNPATH/dependências, pin/licença,
  arquivo extra ou gravável, symlinks, propriedades duplicadas, erros sanitizados.
  Não é loader ELF geral nem auditoria de segurança do source upstream.
- Linux real: pacote readonly em `/relocated/lib`, sem `/build`, root readonly,
  rede none, ambiente limpo, pull never, uma CPU/64 PIDs/1 GiB experimental
  **para fixtures pequenas**. Codec confere ABI/versão e round-trip/alpha/RGB
  invisível; dwebp independente compara todos os pixels.
- Bean: contexto Spring mínimo worker seleciona IsolatedRenderAdapter;
  pai sem native access, filha Boot com FFM. Página sintética vazia 13×17 gera
  WebP equivalente, mantém original e elimina staging. Não é worker completo
  com DB, OCR/layout residentes, storage ou uploads.
- Default disabled/público não criam renderer. CLI local conservado; opt-in
  inválido não vira CLI, falha sanitizada. Configuração nova não habilitada.

## Snapshot técnico

325 fontes/testes/configurações auditados, SHA-256
`6d065b54e83aae8ec25de4ed7d909a3a0afc859b6c04aeb4dc7f967aee4c55f8`.
Receita anterior: paths relativos `/` ordenados de src/scripts/openapi,
pom.xml e Terraform .tf/.tfvars.example; path + NUL + bytes + NUL em SHA-256
cumulativo; exclui docs/target/.DS_Store/.terraform/lock local.
Separado do checksum de governança mobile; snapshots anteriores não renovados.

## Gates

Maven global offline/Docker concluído exit 0, com opt-ins native/Boot/Linux,
recursos shared anteriores e distribuição nova explicitamente preparada.
Gateway: 1.059 testes em 96 classes, zero falhas/erros/ignorados. XMLs frescos
após `2026-10-05T10:15:38.080Z`, contados antes da suíte leve; quatro harnesses
manuais históricos fora da rodada foram excluídos da contagem, não apagados.
V1–V7 em PostgreSQL 17 revalidadas. Java/distribuição novos: 11 casos;
seis testes Node novos. O package pelo reactor permaneceu atual nos testes Boot.
Foco Java leve e dois testes Linux reais aprovados. Node completo: 91 pass,
um opt-in de fonte não selecionado, zero failures; web `pnpm exec tsc -b`: exit 0.
Suíte leve: a primeira execução sandbox bloqueou sockets localhost e supervisão,
com uma falha e 15 erros de ambiente; repetida fora dessa restrição, exit 0,
sem modificar testes/asserts ou criar clients reais. Não enfraquece o gate.
`pnpm check` integral: exit 0, 116 suítes/892 testes, com perf/SDD/typecheck/lint/
FSD/formatação. Warnings existentes de act/SQLite/mocks nativos preservados.
Prettier direcionado e git diff --check: exit 0. SDD/links finais reexecutados
após rebase mecânico dos headers, sem renovar conclusões históricas.
Container de build exclusivo removido; source/package/cache preservados.
Inspeção final do prefixo dos containers locais do renderer encontrou zero ativos.

## Pendências

Contenção kernel/árvore, recursos agregados e worker completo em Linux, máximas,
volume textual, sequência, cancelamento/OOM/disco ainda exigem implementação/provas.
Heap não é teto agregado; o filho ainda pode provocar OOM do cgroup inteiro.
Prova pequena a 1 GiB não resolve OOM do máximo multicolor anterior.
Terraform/RAM/defaults intactos. AC-001/004/005 recebem regressões pequenas;
AC-002/003 não recebem aprovação visual nova; AC-006 permanece parcial.
Retenção operacional, revisão independente e Android continuam pendentes.
Governança mobile sem runtime alterado: performance nativa não inferida.
