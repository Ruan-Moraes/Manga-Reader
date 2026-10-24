# libwebp com orçamento total — plano incremental, 2026-10-05

Decisão humana: Ruan escolheu manter libwebp após a pesquisa das alternativas.
A [spec 020](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/spec.md)
admite buffers internos limitados/contabilizados, não cópias redundantes na
aplicação. Não altera WebP lossless/exact, limite de 80M pixels, 12 MiB de
entrada, 12.000 pixels por dimensão, manifesto ou contrato RenderPort.

## Fatos e hipótese

- O raster Java compartilhado evita PAM/Import/Copy integrais no wrapper FFM.
  O source oficial VP8L ainda cria buffers próprios: encoder e decoder não
  tornam-se streaming por receber um ponteiro emprestado.
- O [perfil anterior](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-native-resources-2026-10-04.md)
  passou com teto experimental de 4 GiB e falhou no máximo multicolor com 1 GiB.
  Isso não valida o worker completo ou um orçamento intermediário.
- Hipótese da próxima prova: 2 GiB são suficientes para as duas fixtures
  sintéticas de 80M no mesmo probe FFM, mantendo heap/scratch/codec/qualidade.
  Trata-se de candidato local, não mudança de Terraform ou aprovação operacional.

## Primeira prova, antes dos testes

Acrescentar casos opt-in a NativeRenderResourceTest: máxima plana e multicolor
com teto kernel de 2 GiB, heap 256 MiB, scratch 128 MiB, uma CPU, swap zero,
network none, root/inputs read-only e libs/JAR fixados. Preservar os testes
anteriores de 4 GiB, OOM a 1 GiB, scratch insuficiente e página seguinte.

Reutilizar NativeRenderResourceProbe: snapshot limitado → decode no raster
nativo → compositor/fontes → encode lossless/exact → decode no mesmo raster
→ SHA-256 de todos os pixels → manifesto/arquivo revalidados. Zero regiões é
controle de recursos, não aprovação de texto pintado no máximo. Fixture pequena
pintada e sete destinos continuam em seus testes existentes.

Registrar cgroup memory.peak (inclui JVM/nativo/cache/tmpfs), VmHWM, tempo,
bytes/hash finais e preservação do original. Teto experimental é conferido
contra o kernel; ausência de métrica não vira zero. Novo teste é medição de
hipótese, sem inventar um red se o caminho existente já passar.

## Incrementos seguintes e admissão

Parcela posterior: o [adapter FFM supervisionado](rendering-supervised-native.md)
foi implementado como construção explícita e testado no JAR Boot Linux. A prova
inclui supervisor e filha, não worker Spring completo. Bean/default e RAM cloud
permanecem inalterados; a sequência abaixo continua delimitando a admissão.

1. Integrar o raster/codec FFM em adapter supervisionado explícito, com
   capacidade antes de qualquer decode e buffers sempre vivos durante a downcall.
   Processo filho permite isolamento de crash/timeout, mas não protege o pai
   de OOM agregado sem contenção e orçamento efetivos.
2. Admitir distribuição fixada/readonly das bibliotecas e dependências, sem
   download durante job; provar plataforma/ABI/hash e ausência de carga disabled.
3. Medir o caminho completo do worker, inclusive JVM pai, fontes, OCR/layout
   residentes, staging/serialização/uploads e sequências de páginas. Cobrir
   JPEG/PNG/WebP, extremos de dimensão/pixels, alpha, pintura e limites de saída.
4. Provar contenção/cleanup em timeout, cancelamento e memória/scratch
   insuficientes, sem segunda chamada cobrada ou commit parcial. Só então propor
   orçamento operacional, com margem fundamentada; 2 GiB não é valor aprovado.

Fórmula de planejamento, não previsão numérica: memória base residente + pico
da página em todas as fases + temporários contabilizados + margem medida.
Xmx é apenas uma parcela. Cloud Run mantém o filesystem gravável em memória;
gravar em /tmp não transfere esse custo para um disco gratuito.

## Limites e reprodução

Parcela local posterior de 2026-10-08: falta de espaço no caminho admitido,
com preparação/cap real do pai e launcher exclusivo dos testes. O staging
tmpfs de até 512 MiB é preenchido de forma limitada, sem arquivo sparse;
filesystem do computador é recusado antes da escrita. Três ARM64 e um x86_64
emulado observaram espaço útil zero, FAILED sem artefatos → sucessora READY,
duas filhas encerradas e cleanup/original/reentrega íntegros. Só src/test muda;
produção/default/RAM cloud/qualidade permanecem iguais. Ver
[evidência e reprodução](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-admitted-disk-fault-2026-10-08.md).
Timeout/cancelamento admitidos e orçamento agregado ainda não aprovados.

Nenhuma mudança de bean/runtime, schema, migration, infra, ADC/provider, mídia
real, legal, mobile ou dependência. Default disabled, cloud 1 GiB e gates
conservadores preservados. 020 in-progress/open; TASK-002/006/007/008 abertas;
021 approved/blocked. Esta prova local não fecha AC-006 integral.

Preparar o JAR atual offline pelo reactor. Reutilizar pins/comando da
[documentação do codec](rendering-native-codec.md), selecionando
`-Dtest=NativeRenderResourceTest`, com `renderer.shared.resources.enabled=true`,
diretórios locais verificados e Docker local. Sem pull/install ou rede no probe.

Referências primárias: [libwebp 1.6.0](https://github.com/webmproject/libwebp/blob/v1.6.0/src/enc/vp8l_enc.c),
[Docker memory](https://docs.docker.com/engine/containers/resource_constraints/),
[Cloud Run filesystem](https://docs.cloud.google.com/run/docs/container-contract).
