# Raster nativo compartilhado — evidência parcial, 2026-10-04

Parcela de TASK-002/003/004/007/008, AC-001/002/003/004/006. 020 continua
`in-progress/open`, review `changes-requested`; 021 `approved/blocked`.
Fixtures sintéticas, sem imagens privadas, provider, ADC, credenciais, instalação,
download ou alteração cloud nesta parcela. Java 23, não C próprio ou Python.

## Plano e implementação

[Plano anterior aos testes/código](../../../../../../api/apps/translation-gateway/docs/rendering-native-raster.md).
Uma alocação Arena confinada, alinhada, de quatro bytes por pixel compartilha
memória entre MemorySegment, DataBuffer TYPE_INT e BufferedImage. Não há
int[] integral nesse DataBuffer. Ownership/close são explícitos, sem GC como
garantia. Segmento e aliases de raster não permitem acesso após close nem
uso em thread estrangeiro; close estrangeiro não libera a superfície.

`NativeArgbRaster` é interno à infraestrutura. Seam `decodeInto` reutiliza
inspeção/container/reader JDK e `ArgbDecodeDestination`, escrevendo JPEG/PNG
na superfície fornecida, sem copiar uma página intermediária. Conversor de
um pixel e linhas são mantidos. WebP direto ainda exige codec FFM: sem fallback
para PAM nesse seam. O caller continua responsável pelo snapshot limitado e
validado por hash; este incremento não cria uma nova garantia de rehash.

`CleanBoxPainter` aceita somente ARGB não premultiplicado ou a vista nativa
conhecida. Não admite custom arbitrário. Compositor/antialias/recorte e fontes
permanecem iguais. Superfície não é ligada a bean, RenderPort ou task: o worker
opt-in existente continua usando o codec CLI. Nenhum contrato persistido,
migration, OpenAPI, task, manifesto, dependência ou default mudou.

Fontes/testes auditados estão em
[rendering](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/NativeArgbRaster.java),
[decode](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/ValidatedRasterDecoder.java),
[alias/lifetime](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeArgbRasterTest.java),
[decode compartilhado](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRasterDecodeTest.java)
e [pixels/placements](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRasterPaintingTest.java).

## Testes e finding reproduzido

Primeiro red: compilação falhou pelas APIs ainda ausentes. Após implementação,
99 testes focados executados; uma falha revelou que um BufferedImage coerced
para alpha premultiplicado pode preservar `TYPE_INT_ARGB`. A validação antiga
por tipo aceitava composição incompatível. Fix acrescenta rejeição explícita
de premultiplicação, sem remover a asserção ou mudar o requisito.

Foco final: **103 testes, zero failures/errors/skipped**, incluindo 38 novos:

- NativeArgbRasterTest: 12, alocação exata/zero, canais/alpha/endian, aliases,
  bancos/bounds, política/dimensões, lifetime, thread e mensagens sanitizadas.
- NativeRasterDecodeTest: 15, sete tipos PNG e JPEG RGB/gray com equivalência
  ao ImageIO, mesmo DataBuffer, buffer inválido, dimensão divergente,
  truncamento, PNG animado e declaração WebP incompatível rejeitados; interrupt
  preservado e nenhuma interação com o codec. Não afirma cobertura de WebP
  válido direto ou de todos os formatos possíveis de PNG por esse teste.
- NativeRasterPaintingTest: 11, sete destinos, equivalência de todos os pixels
  ao raster anterior, placements/overflow iguais, vazio com RGB sob alpha zero,
  premultiplicado/custom incompatíveis e superfície encerrada rejeitados.

65 regressões existentes de decoder/pintura/caixa limpa também passaram.
Nada foi removido para obter resultado verde. A comparação de pixels é prova
funcional limitada às fixtures, não revisão visual/linguística independente.

Comando focalizado, reactor a partir de `api/`:

```text
./mvnw -o -q -pl apps/translation-gateway -am test -Dtest=NativeArgbRasterTest,NativeRasterDecodeTest,NativeRasterPaintingTest,ValidatedRasterDecoderTest,PageRasterPainterTest,CleanBoxPainterTest -Dsurefire.failIfNoSpecifiedTests=false
```

## Integridade e gates

Snapshot técnico do gateway: 296 arquivos, SHA-256
`a845ce521eb984dbca509eb737f9d0a612700e8dc7b8a6a687f15e2f91ce4e73`.
Mesma receita das evidências anteriores: src/scripts/openapi/pom e configuração
Terraform ordenados por path relativo, path NUL bytes NUL. Não inclui docs,
target ou artefatos ignorados. Checksum SDD mobile é separado e não cobre Java.

JAR empacotado offline com exit 0:
`3f480eab71caf20770331eeb99c09474c7cd3b46c0ff35b20abf7ea9f4b0e928`.
Maven global offline/Docker, opt-ins native/archive/Linux/resources e JAR
atual: exit 0. **1.010 testes gateway/85 classes**, zero failures/errors/skipped,
XMLs frescos desde `2026-10-04T20:24:54.261Z`, contados antes da suíte leve.
Quatro harnesses históricos não reexecutados excluídos. PostgreSQL 17: migration
49 casos, rendering persistence 83 e worker integrado 17; cadeia V1–V7 válida.
Não há V8 de produção. Histórico de hashes preservado.

O global reexecutou profiling do **CLI anterior**, não desta superfície nova:
80M/4 GiB passou, pico cgroup 1.933.172.736 bytes, 9,185 s; 1 GiB falhou por
OOM sem resultado. Faults de scratch/memória preservaram original e execuções
seguintes passaram. São dados reais locais de fixture sintética, não melhoria
de memória comprovada para a alternativa nem aprovação operacional. Comandos
de opt-in estão no [protocolo de recursos](../../../../../../api/apps/translation-gateway/docs/rendering-linux-resources.md).

Node tooling: 85 pass, um opt-in de fonte não selecionado; exit 0.
Web `pnpm exec tsc -b`: exit 0. Suíte leve gateway offline/reactor com
`-Dtest.excludedGroups=testcontainers`: exit 0. `pnpm check` mobile integral:
exit 0, 116 suítes/892 testes; performance-tooling, SDD/links, typecheck,
eslint, FSD e formato passaram, sem reinstalação. Warnings `act(...)` existentes
no Jest permanecem explícitos, não foram corrigidos fora deste escopo.

Formatação dirigida, whitespace dos arquivos novos e `git diff --check`
aprovados. Headers SDD rebaseados mecanicamente após estabilização; nenhum
verdict histórico renovado. Checks SDD/links/formato reexecutados no fechamento.
Nenhum container exclusivo de rendering permaneceu; artefatos locais oficiais
anteriores foram preservados e não incluídos no pacote de produção.

## Limites e próxima parcela

Não carregou `.so`, não validou structs ABI, WebPPicture emprestado, encoder
exact/alpha ou direct WebP decode. Também não mediu o pico dessa alternativa:
o profiling global continua exercitando o CLI anterior. Arena não é cgroup,
contenção de processo, deadline nativo nem orçamento operacional aprovado.

Cópias CLI e 1 GiB insuficiente continuam findings funcionais de AC-006.
Próxima parcela exige ABI verificável, ownership de buffer emprestado e
round-trip exact/alpha, depois integração supervisionada e nova medição sob
os mesmos limites. Distribuição/licenças, contenção, retenção integral e
qualidade geral permanecem abertas. Não flexibilizar AC-006 para aprovar seam.

Runtime mobile inalterado; conforme MOB-DEC-007/performance, prova Java não é
medição Android e não gera evidência de performance nativa do aplicativo.
Nenhuma task aberta é marcada concluída nem dependência da 021 liberada.
