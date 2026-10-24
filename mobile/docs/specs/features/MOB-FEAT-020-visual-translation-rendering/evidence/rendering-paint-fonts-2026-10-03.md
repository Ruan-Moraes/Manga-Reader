# Evidência parcial — fontes e composição raster, 2026-10-03

MOB-FEAT-020: parcela TASK-002 e execução técnica TASK-003/004. A feature
continua `in-progress/open`; não há bean, adapter de arquivos, integração ao
worker ou produtor de `READY`. A 021 permanece bloqueada.

## Fontes, aquisição e integridade

Cinco fontes oficiais originais adquiridas explicitamente, sem imagem ou
credencial em rede: Noto Sans Regular e CJK JP/KR/SC/TC. Antes de empacotar,
cada tamanho/blob Git foi comparado com a árvore upstream da revisão fixa.
Licenças SIL OFL 1.1 exatas e copyright são preservados. Revisões, proveniência,
tamanhos, SHA-256 e blob IDs estão no
[manifesto de recursos](../../../../../../api/apps/translation-gateway/src/main/resources/rendering/fonts/font-pack.json).

O loader estrito valida metadados/licenças e abre cada font apenas uma vez;
o snapshot validado alimenta Font.createFont. SHA-1 Git é incremental, sem
segunda cópia completa do font. Não há download automático, registro global
ou fallback de fonte lógica/sistema. Variantes chinesas usam faces distintas.
Recursos do classpath acompanham o build; distribuição libwebp por plataforma
e licenças transitivas continuam pendentes, portanto TASK-002 fica aberta.

## Algoritmo e limites

[Plano geométrico](../../../../../../api/apps/translation-gateway/docs/rendering-paint.md):
spans de centros de pixels, recorte, cores estimadas antes de mutação, mediana
ARGB do entorno excluindo todas as regiões, sobreposição pela ordem OCR.
Não expande quadrilátero para bounding box, cria máscara de página inteira
ou reescreve arquivo do original. Página vazia não altera pixels.

[Compositor](../../../../../../api/apps/translation-gateway/docs/rendering-text.md):
caixa interna segura, fonte 48→12 px na política inicial, quebra por locale,
centralização, contraste preto/branco, direção horizontal LTR dos sete destinos
e dados textuais inertes. Nenhum espaço CJK é inserido. Desenho antialias usa
raster de uma linha; transferência é restrita ao span OCR. Neutralização e
texto acontecem por região na ordem original, preservando a precedência de
sobreposição. Texto inteiro precisa caber antes de pintar; glyph ausente,
controle não suportado ou falta de espaço resultam em overflow/font=0,
marcador discreto quando couber e tradução integral no manifesto existente.

As caixas candidatas não prometem layout ótimo nem remoção perfeita do texto.
Não usam balões, colunas ou onomatopeias experimentais. Nenhuma inferência,
tradução ou mídia privada foi executada neste incremento.

## Testes e falhas observadas

Testes escritos antes das novas classes; fases vermelhas por tipos ausentes
foram reproduzidas. Uma execução inicial de desenho sem modo headless encerrou
a JVM macOS com exit 134, sem resultados aprovados. Repetição headless passou;
Surefire agora fixa java.awt.headless=true no módulo, sem excluir testes.

79 testes focados aprovados: 26 fontes, 13 geometria, 21 composição e 19
nativos libwebp. Os cenários geométricos incluem 128 fixtures inclinadas
determinísticas, com geometria independente Path2D e diff de cada pixel.
Caixas internas também são conferidas contra essa geometria. Testes nativos
incluem pintura, página vazia, os sete destinos, alpha/RGB invisível,
hash/MIME/dimensões reais e original sintético em arquivo preservado.
Fixtures pequenas não são benchmark de qualidade ou memória em volume.

## Matriz parcial

| Critério | Evidência desta parcela                                                   | Pendência integral                                          |
| -------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- |
| AC-001   | neutralização/desenho limitados ao polígono, diff e WebP exato            | adapter de arquivos, retenção e integração worker           |
| AC-002   | fonts físicos, glyphs, wrapping e contraste nos sete destinos             | revisão visual/linguística e integração                     |
| AC-003   | fallback completo por ID, controles/glyph/caixa estreita, marcador seguro | consumo/integridade no pipeline final                       |
| AC-004   | zero regiões sem caixa e round-trip ARGB exato                            | estado terminal real no worker                              |
| AC-005   | codec final, metadados e hash reais                                       | upload/commit/URLs/ACK/TTL de imagem e manifesto            |
| AC-006   | um raster de trabalho, buffers de linha, interrupção e limites existentes | profiling/caps nativos, falhas de memória/disco no pipeline |

## Fotografia técnica

224 arquivos: `9c620d5b1ba415f7b3d4e78b2e30cdf58b4e3a789e4765c6799269b55ca6f122`.
Mesmo algoritmo histórico: arquivos de src/scripts/openapi, pom.xml e Terraform
tf/tfvars.example, ordenados por path relativo; SHA-256 de path + NUL + bytes +
NUL. Agora inclui binários/licenças/manifests empacotados. Docs/build/artefatos
privados são excluídos. Hash técnico Java é separado do checksum SDD mobile;
fotografias de contratos, codec e 019 não foram renovadas.

## Comandos e validação

```bash
cd api
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=BundledRenderingFontsTest,CleanBoxPainterTest,PageRasterPainterTest,WebpProcessCodecNativeTest \
  -Dsurefire.failIfNoSpecifiedTests=false -Drenderer.native.enabled=true \
  -Drenderer.cwebp.path="${RENDER_CWEBP_PATH:?}" \
  -Drenderer.cwebp.sha256="${RENDER_CWEBP_SHA256:?}" \
  -Drenderer.dwebp.path="${RENDER_DWEBP_PATH:?}" \
  -Drenderer.dwebp.sha256="${RENDER_DWEBP_SHA256:?}"
```

Opt-in usa somente executáveis previamente preparados, sem descobrir PATH ou
instalar. Pins locais são os da [evidência anterior](rendering-codec-2026-10-03.md),
não pins de produção universais. Sem opt-in, nativos são explicitamente
ignorados; suíte leve não comprova inferência/codec reais.

Suíte leve do gateway, Node (85 pass/um opt-in não executado) e web tsc -b
passaram. Suíte completa e Maven global offline/Docker com opt-in nativo
passaram: gateway 542 testes/51 classes, zero falhas/erros/ignorados.
pnpm check integral, SDD, links e formato passaram; a
[review corrente](../review.md) registra as contagens e limites da verificação.

MOB-DEC-007: nenhuma mudança de runtime mobile; benchmark de aparelho não é
aplicável nesta parcela Java/documental. Profiling gateway/Android da entrega
integral segue em TASK-008, sem alegação de ganho ou aprovação por mocks.

Nenhuma migration, interface pública, default, configuração cloud, deploy,
credencial ou chamada paga. Compositor é construção explícita e isolada.
