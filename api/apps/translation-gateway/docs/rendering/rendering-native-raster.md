# Raster nativo compartilhado — plano, 2026-10-04

Parcela de TASK-002/003/004/007/008 e AC-001/002/003/004/006. Corrigir a fronteira
de buffers antes de conectar a biblioteca compartilhada ao renderer. O objetivo
integral continua reduzir cópias no pipeline, não aprovar AC-006 por este seam.

## Decisão e isolamento

Criar superfície ARGB em Arena confinada Java 23, com uma única alocação nativa
de quatro bytes por pixel, alinhada para uint32. DataBuffer TYPE_INT sem int[]
integral apresenta a mesma memória a BufferedImage, decode por scanline e,
futuramente, ao ponteiro emprestado de WebPPicture. Libwebp/pom/bean/defaults
não mudam neste incremento. Nenhum C, JNI próprio ou carregamento de biblioteca
é necessário para Arena/DataBuffer; não baixar nada em testes comuns.

Tamanho/dimensões/pixels validados antes de allocate. Ownership explícito,
AutoCloseable/idempotência no thread proprietário, lifetime e thread-confinement
verificados também por cada acesso. Alias de segmento/raster fica inválido
após close, sem GC como garantia de liberação; não serializar endereço.
Não permitir banco/índice fora do buffer nem manter capacidade após liberar
memória durante uso nativo futuro. Timeout de chamada nativa continua a exigir
supervisão em JVM filha; Arena não a preempta.

## Decode e composição

Preservar o caminho atual e sua assinatura. Acrescentar caminho interno de
decode JPEG/PNG em superfície fornecida, sem copiar uma página intermediária;
reusar revalidação/conteúdo/reader JDK e destino de conversão por um pixel.
WebP exige codec nativo direto futuro: rejeitar nesse seam, sem fallback para
decode PAM ou alegar cobertura concluída. Nenhum task/bean chama o seam novo.

CleanBoxPainter aceita somente raster ARGB existente ou a superfície nativa
conhecida com ColorModel/masks/stride compatíveis. Não permitir qualquer imagem
custom/premultiplicada por conveniência. Painter mantém buffers de linha e
mesmos polígonos, texto, placements/overflow e fontes. Não usar Graphics2D da
página para introduzir cópia: a canvas de antialias continua uma linha.

## Testes antes da implementação

- Alias bidirecional BufferedImage/segmento/DataBuffer/subimage; tamanho real,
  zero inicial, alpha/canais/endian e bounds/bancos.
- Closed/foreign thread falham sem UAF, conteúdo, endereço ou cause; close
  estrangeiro não libera memória; close proprietário repetido seguro.
- JPEG e variantes PNG escrevem diretamente no mesmo buffer; pixels equivalentes
  ao decode JDK pequeno; metadados/assinatura/animado/erro/interrupt revalidados.
- Sete destinos pintados no raster nativo equivalem pixel a pixel ao existente,
  com geometria/placements/overflow invariáveis. Página vazia intacta e custom
  arbitrário continua rejeitado.
- Nenhuma biblioteca/credencial/rede/novo codec nos testes comuns; profiling
  máximo/nativo permanecerá opt-in em incremento de integração.

## Gates e limites

Foco red/green, suíte leve/completa e Maven global offline/Docker com artefato
atual, Node, web typecheck, pnpm check, SDD/links/formatação dirigida/diff.
Registrar checksum técnico separado e evidence ACs afetados; manter tarefas
abertas, 020 in-progress/open e 021 blocked. Review/drift não alteram requisitos.

Arena native allocation não é orçamento operacional, cgroup ou garantia de
ausência de buffers internos do encoder. CLI atual continua com as cópias já
medidas até integração verificada de biblioteca/ABI. 1 GiB insuficiente,
distribuição, contenção kernel, integração/retenção/qualidade ainda pendentes.

## Execução da parcela

Superfície nativa e seam de decode/pintura entregues, ainda sem chamador no
worker. Testes red/green verificam compartilhamento/lifetime, variantes JPEG/PNG
e equivalência de pixels nos sete destinos. A validação antiga de pintura
aceitava um ARGB premultiplicado com tipo preservado pelo JDK; regressão
reproduzida e rejeição explícita acrescentada. Não carrega libwebp nem resolve
suas estruturas/ownership. Evidência e limites em
[raster nativo](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-native-raster-2026-10-04.md).

Referências Java 23: [Arena](https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/lang/foreign/Arena.html)
e [MemorySegment](https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/lang/foreign/MemorySegment.html).
