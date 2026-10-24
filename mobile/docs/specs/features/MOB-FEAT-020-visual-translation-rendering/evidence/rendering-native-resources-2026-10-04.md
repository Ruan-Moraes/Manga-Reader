# Recursos do fluxo FFM — evidência parcial, 2026-10-04

TASK-002/007/008, AC-001/004/005/006. 020 in-progress/open, verdict
changes-requested; 021 approved/blocked. Testes locais autorizados por Ruan,
sem mídia real, rede Google, ADC/credenciais, provider ou cloud. Java/source
upstream intacto, nenhum C próprio/Python/script shell próprio. Nenhum runtime
mobile alterado; performance Android não aplicável nem inferida dessa medição.

## Implementação, TDD e isolamento

[Plano anterior aos testes](../../../../../../api/apps/translation-gateway/docs/rendering-native-codec.md),
[teste](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderResourceTest.java),
[probe](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderResourceProbe.java)
e [métricas comuns](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/RenderResourceMetrics.java).
Classes de teste montadas individualmente, não empacotadas. Temurin pinado,
Java 23.0.2 ARM64, pull=never/network none/root read-only/cap-drop ALL,
no-new-privileges/uma CPU/64 PIDs/swap zero. JAR/libs/imagem sintética read-only;
export exclusivo e Docker config vazia, sem HOME/repo/credenciais montados.

IPC limitado, metadata revalidada, decode PNG no NativeArgbRaster, compositor
existente e encode FFM. SHA-256 de todos os pixels antes/depois do decode BGRA
no mesmo segmento; sem segundo raster integral. Export após verificação/cleanup,
manifesto pelo contrato atual. Não liga ao RenderPort/worker ou supervisor de
produção. Deadline cooperativo de 60 s do codec, não hard deadline nativo.

RED por métodos/classes ausentes antes da implementação. Fixture multicolor
gerada por linha, sem raster integral na JVM supervisora; fórmula RGB/mais de
256 cores/determinismo testados. Primeira execução Docker falhou antes de create:
daemon/socket ausente. OrbStack iniciado sob autorização anterior e versão
confirmada antes da repetição. Nenhum teste removido ou gate enfraquecido.

Referência pintada do teste inicialmente era BGR/ImageIO, rejeitada pelo painter;
corrigida para decoder ARGB validado existente, mantendo comparação de todos os
pixels. Scratch 64 MiB passou na plana, mas multicolor falhou na preparação das
fontes antes de encode. Repetição explícita com 128 MiB nos máximos e 1 GiB
permitiu medir encoder; sem mudança do orçamento operacional ou da entrada.

## Medições focalizadas

Uma observação por caso, não benchmark estatístico/SLA/ganho percentual.
Heap 256 MiB, scratch 128 MiB nos máximos, 64 MiB nos pequenos.
10.000×8.000 = 80.000.000 pixels; original intacto e dentro de 12 MiB.
Cgroup peak inclui JVM/nativo/cache/tmpfs; VmHWM é RSS do processo, não outra
parcela a somar. Valores vêm de cgroup2/proc/tmpfs reais; ausências são null.

| Cenário            | Teto    | Resultado                           | Pico cgroup bytes |    VmHWM KiB |  Tempo total |
| ------------------ | ------- | ----------------------------------- | ----------------: | -----------: | -----------: |
| Máxima plana       | 4 GiB   | exact/manifesto válido              |         821133312 |       722196 |      8,614 s |
| Máxima multicolor  | 4 GiB   | exact/manifesto válido              |        1350234112 |      1164352 |     15,046 s |
| Pequena multicolor | 1 GiB   | exact/manifesto vazio               |         276480000 |       223916 |      6,119 s |
| Pequena pintada    | 1 GiB   | exact/CLI e compositor equivalentes |         308432896 |       240500 |      6,237 s |
| Máxima multicolor  | 1 GiB   | kernel OOM/sem resultado            |      indisponível | indisponível | indisponível |
| Máxima plana       | 128 MiB | kernel OOM/sem resultado            |      indisponível | indisponível | indisponível |
| Scratch 16 KiB     | 1 GiB   | falha antes do decode/sem resultado |          92340224 |        61620 |      0,019 s |
| Página seguinte    | 1 GiB   | exact após falhas                   |         338362368 |       223676 |      6,174 s |

Encoder multicolor: 6,845 s; decode 1,838 s; verificação 0,300 s; preparação do
painter/fontes 5,738 s, mesmo sem regiões. Não atribuir tempo total ao encoder
ou afirmar cobertura do custo de 1.024 regiões. OOM não retorna métricas da
filha: Docker OOMKilled=true/exit não zero/ausência de result.bin são a prova.
Falhas preservaram source e a página seguinte passou. Pequena pintada compara
dwebp independente com compositor ARGB existente, pixel a pixel. Texto sintético,
sem aprovação de qualidade linguística/visual. Hash final/manifesto conferidos.

| Fixture            |   Bytes | SHA-256                                                            |
| ------------------ | ------: | ------------------------------------------------------------------ |
| Plana máxima       |  252979 | `51d600a40e9f25601fa91a8ebd98e55a18ad5b4c423756ee612783a8db94186b` |
| Multicolor máxima  | 7322972 | `15e8bc69f58a1905ecd2805ce56267ee652e6dd6a69674663662ae8d5b25469c` |
| Multicolor pequena |  160942 | `06985649f58a3c7d55cce5dcdd8ed60416ab67ce846a6f4b36694f3ebaba59a2` |

RGB multicolor: `(x mod 256, y mod 256, (x+y) mod 256)`, nenhuma mídia do catálogo.

## Source audit e finding funcional

Source oficial 1.6.0, archive pinado da preparação anterior. vp8l_enc.c SHA-256:
`95f1037606289e315a2413cfc2ca537340a5036ba28ae52ad1c85d8a8efa20b8`;
backward_references_enc.c:
`59ca144a95dd40a3b42fcaf5e2ef1fe7382ada8425cb860e469023b826173192`.

AllocateTransformBuffer (1226..1264) aloca W×H uint32 mais scratch/transform.
MakeInputImageCopy (1267..1286) copia todas as linhas; condição 1610..1612 chama
o caminho sem paleta/near-lossless. Original emprestado continua vivo: **AC-006
não está integralmente atendido**. EncoderInit (422..435) ainda reserva hash
chain por pixel; VP8LHashChainInit (205..214 do segundo arquivo) aloca outro
uint32/pixel. Este último é working memory, não outra imagem. Não confundi-los.

low_memory é usado em config/webp_enc.c (lossy), não retira essa cópia VP8L.
Não há prova de switch público que resolva isso sob lossless/exact atual.
Não reduzir AC a cópias Java, liberar ponteiro durante downcall, alterar
qualidade/limites ou aumentar budget operacional. 1 GiB não foi admitido para
essa entrada válida; é finding funcional, não mera verificação externa.

Auditoria adicional do decoder: `vp8l_dec.c`, SHA-256
`49e4aec24d95d70df3c53e9ae53d5f3bc5646012d9f1d0968a5f88936f310653`.
AllocateInternalBuffers32b (1556..1573) reserva pixels width×height mais linhas
de cache; VP8LDecodeImage (1743) chama essa reserva mesmo com destino externo.
Width pode ser reduzido por transform de paleta; não assumir redução em mídia
multicolor. BGRA externo evita outra saída do wrapper, não todo estado integral
interno do decoder. Isso é inspeção estática, não atribuição do pico medido a
uma função. Hashes dos três fontes foram conferidos diretamente nos membros
do tar oficial, iguais aos arquivos locais; nenhum source foi modificado.

## Hashes e gates

Snapshot técnico 306 arquivos:
`a08b26bd932cf9a3ec12ae069225307b97ca8762d22a70efc60ebe6a0baaf1b7`.
Receita: src/scripts/openapi/pom.xml e Terraform `.tf`/terraform.tfvars.example,
paths ordenados, path relativo com `/` NUL bytes NUL, SHA-256 cumulativo.
Exclui docs/target/.DS_Store/.terraform/lock local ignorado. Checksum mobile
separado; hashes e evidências anteriores preservados. JAR de produção inalterado.

JAR da prova atual, sem mudança de produção:
`edd5d757d2adbe115e031aec66f5eca3c1aaaab6fa564890e67d98c2bb6b82a5`.
Maven global offline/Docker, opt-ins native/archive/Linux/resources/shared e
novo shared.resources: exit 0. **1.027 testes gateway/90 classes**, zero
failures/errors/skipped. XMLs frescos desde `2026-10-04T23:40:59.919Z`, contados
antes da suíte leve; quatro harnesses históricos não reexecutados excluídos.
V1–V7/PostgreSQL 17 revalidados, sem migration nova. Suíte leve gateway/reactor
com `-Dtest.excludedGroups=testcontainers`: exit 0.

Repetição na suíte global, mesmo input e budgets: plana exact, pico cgroup
961163264 bytes/VmHWM 742504 KiB/8,897 s; multicolor exact, 1255686144 bytes/
1167432 KiB/15,433 s. Multicolor 1 GiB e fault 128 MiB tiveram OOM sem resultado;
scratch 16 KiB falhou sem resultado e página seguinte exact. São duas
observações locais, não distribuição estatística ou ganho contra CLI.
CLI foi reexecutado separadamente: plana 4 GiB exact, pico 1872420864 bytes/
8,763 s, e OOM com 1 GiB; budgets heap/scratch diferem, sem comparação percentual.
Nenhum container rendering permaneceu após conclusão.

Node `node --test scripts/*.test.mjs`: 85 pass/um opt-in de fonte não selecionado,
exit 0. Web `pnpm exec tsc -b`: exit 0. Mobile `pnpm check` completo: exit 0,
116 suítes/892 testes, incluindo SDD/links/typecheck/lint/FSD/formato/performance
tooling. Warnings act/SQLite anteriores preservados, sem correção alheia,
reinstalação ou lockfile alterado. Formatação dirigida/diff-check e checks
SDD/links finais reexecutados após estabilizar documentos. Rebase mecânico dos
headers correntes não renova verdict/histórico das outras features.

## Pendências

Nenhum HTTP/contrato/manifesto/V1–V7/default/gate alterado. TASK-002/006/007/008
abertas. Resolver cópia interna/orçamento máximo antes da admissão da alternativa,
implementar integração supervisionada/contenção/distribuição verificada e auditar
retenção/qualidade integralmente. Testes verdes não promovem a 020 ou abrem a 021.
