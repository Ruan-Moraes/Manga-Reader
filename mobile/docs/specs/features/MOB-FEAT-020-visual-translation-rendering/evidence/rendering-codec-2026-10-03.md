# Evidência parcial — codec WebP local, 2026-10-03

MOB-FEAT-020/TASK-002. Gate aberto e execução incremental autorizada; feature
`in-progress`. TASK-002 continua aberta: fontes e distribuição por plataforma
não estão entregues. Não há renderer completo, `READY` ou aprovação visual.

## Implementação e revisão

Testes escritos antes de `PamRasterIo` e `WebpProcessCodec`: compilação vermelha
por tipos ausentes. Implementação Java sem shell, Python, JNI novo ou download.
Uso local das ferramentas oficiais libwebp 1.6.0 já instaladas, explicitamente
identificadas por caminho e hash. Não há busca no PATH, fallback ou bean Spring.

- PAM RGB/RGBA com header limitado, dimensões conferidas antes de alocar,
  somente buffers de linha e um raster Java; não materializa imagem inteira em
  PNG/byte array ou duplica o canvas na JVM.
- `cwebp -quiet -lossless -exact -q 100 -m 4 -metadata none -o - -- <PAM>`;
  stdout limitado antes de gravar, não reduz resolução/qualidade para caber.
- `dwebp -quiet -pam -o - -- <snapshot>` depois de SHA-256/MIME/bytes/dimensões
  verificados; nenhuma escrita sobre o arquivo do chamador.
- Capacidade nativa única compartilhada sem fila. Deadline mata processo; o
  slot não é liberado antes de confirmar término. Stderr é descartado e causas
  brutas não são expostas. Hash dos binários é revalidado por operação.
- PAM, snapshot comprimido e saída parcial possuem cleanup exclusivo por path
  criado pela operação, sem varrer diretório ou remover arquivo alheio. Falha
  de cleanup tem código sanitizado próprio.

Fontes: [plano e comandos](../../../../../../api/apps/translation-gateway/docs/rendering-codec.md),
[adapter e PAM](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering),
[testes](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering).

## Evidência observada e limites

42 cenários focados: 19 PAM, 13 adapter/processos falsos e dez opt-in nativos;
zero falhas/erros/ignorados na execução explícita. Fixtures pequenas, sintéticas,
incluem alpha 0/1/127/255 e RGB invisível não nulo. Round-trip compara cada pixel
ARGB. Limite exato de bytes aceito; um byte a menos falha inteiro. Original,
arquivos alheios e raster do chamador preservados. Saída tem hash calculado
sobre bytes e metadados reais.

Binários Homebrew locais macOS arm64, libwebp 1.6.0:

- cwebp SHA-256 `b31070342821b6316c756e22a336a72bbde4a6e4f2a9cabb22ffd49a73cc89cf`;
- dwebp SHA-256 `0fea0ca571920dac090ca32f4e4559b5125b92e33963b314f27c6757c1c1201c`.

Esses hashes identificam a instalação medida, não são pins universais de
produção. Empacotamento/licenças transitivas, limites de memória nativa e
profiling em volume ainda pendentes. Processos isolados e buffers de linha
não constituem prova de AC-006 integral. Nenhum runtime mobile foi alterado;
MOB-DEC-007 não exige medição de aparelho nesta parcela de documentação Java.

## Matriz parcial

| Critério | Evidência nesta parcela                                        | Pendência integral                                |
| -------- | -------------------------------------------------------------- | ------------------------------------------------- |
| AC-001   | pixels do round-trip idênticos e raster original preservado    | pintura limitada aos polígonos                    |
| AC-002   | nenhuma fonte/desenho avaliada                                 | fontes, wrapping, direção, contraste e revisão    |
| AC-003   | nenhuma composição/overflow executada                          | desenho e fallback visuais                        |
| AC-004   | codec preserva pixels sem alteração                            | página vazia no renderer/worker                   |
| AC-005   | arquivo real, SHA-256, MIME, bytes e dimensões                 | upload, commit, URLs, ACK e TTL do render         |
| AC-006   | limite de stdout, deadline, capacidade única e falhas isoladas | profiling/caps nativos, memória/disco no pipeline |

## Fotografia técnica

207 arquivos do gateway, mesmo algoritmo da consolidação anterior:
`2f1abb5b864812a3b9ce88808e872a4e4d5e01e08efc8f0c5c8b95c952aff7d8`.
O snapshot histórico de contratos/019 é preservado. Headers SDD são checksum
mobile separado, não prova de cobertura Java.

## Comandos e resultados

Opt-in nativo (executáveis precisam estar previamente preparados):

```bash
cd api
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=PamRasterIoTest,WebpProcessCodecTest,WebpProcessCodecNativeTest \
  -Dsurefire.failIfNoSpecifiedTests=false -Drenderer.native.enabled=true \
  -Drenderer.cwebp.path="${RENDER_CWEBP_PATH:?}" \
  -Drenderer.cwebp.sha256="${RENDER_CWEBP_SHA256:?}" \
  -Drenderer.dwebp.path="${RENDER_DWEBP_PATH:?}" \
  -Drenderer.dwebp.sha256="${RENDER_DWEBP_SHA256:?}"
```

Comando focado: exit 0, 42 testes; incluem imagem mínima transparente. Sem opt-in, os dez testes nativos ficam
explicitamente ignorados; não se infere evidência nativa de suíte comum.
Web `tsc -b`: exit 0. Maven global `./mvnw -o -q test` com Docker e o mesmo
opt-in nativo: exit 0 após todos os casos adicionados. Gateway: 473 testes,
48 classes, zero falhas/erros/ignorados, incluindo V1–V5 e gRPC local.
Suíte leve `-Dtest.excludedGroups=testcontainers`: exit 0; nessa execução,
o opt-in nativo não foi passado e não constitui prova dos testes nativos.
Node `node --test api/apps/translation-gateway/scripts/ocr-*.test.mjs`:
85 aprovados, zero falhas e um opt-in tipográfico não executado.
O resultado final de `pnpm check`, SDD, links e formato está na
[review corrente](../review.md); headers são rebase mecânico, sem renovar
conclusões históricas.

Nenhum provider, credencial, download/instalação de fonte ou codec, imagem real,
schema, migration, infra, contrato público ou default alterado.
