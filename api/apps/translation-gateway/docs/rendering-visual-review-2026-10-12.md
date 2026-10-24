# Galeria sintética para revisão visual — 2026-10-12

Complemento da [matriz nativa corrigida](native-metadata-runtime-2026-10-11.md).
A 020 permanece `in-progress/open`; a 021 permanece bloqueada. Nenhum modo de
produção, schema, provider, imagem licenciada, credencial ou recurso cloud foi
alterado. A geração foi executada localmente em 2026-10-11; a consolidação desta
parcela não transforma a galeria em aprovação de qualidade geral.

## Entrega e cobertura

[VisualRenderingFixture](../src/test/java/com/toonlira/translationgateway/infrastructure/rendering/VisualRenderingFixture.java)
gera arte geométrica sem depender de fontes do host. Textos são fixtures
sintéticas independentes, não OCR ou tradução da arte gerada. Quatro regiões
por página: fundo claro, fundo escuro com quebra explícita/caracteres de markup
inertes, quadrilátero inclinado e área estreita com overflow intencional.

O [harness opt-in](../src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderingVisualReviewLinuxTest.java)
executa o `RenderChildMain` e as bibliotecas do JAR/imagem existentes, sem montar
outro JAR sobre a imagem. Usa rootfs readonly, rede desligada, uma CPU, teto
diagnóstico de 1 GiB e limites self-only da filha. Não inicia Spring, banco,
worker completo ou SDK/provider. O UID é o mapeado do staging de diagnóstico;
não é uma nova prova do UID de produção ou da admissão do worker em 1 GiB.

São 14 páginas PNG de 1.200 × 900: sete destinos em ARM64 e x86_64 emulado.
Cada caso preserva original, WebP final, PNG decodificado por CLI independente,
manifesto `1.0` e `case.json` com hashes/limites/status de revisão.

As duas imagens são as da execução anterior:

- ARM64: `sha256:887e1a818a97ac75b98500392631a55b72d1054f0babf3ea766275d6a49fe885`;
- x86_64: `sha256:0a8a27a67cb05333c1c2de7e2f4e8ebc066d2b505cd6075b8ab80bd9add4ef15`.

JAR inalterado, SHA-256
`6c6a8703aad2f52839790b7a95852544cc75a3328e2709bc4032dfcd63eee29e`.
O helper novo não alterou os caminhos usados pela matriz anterior. Essa matriz
permanece uma fotografia de seu source snapshot; não é aprovação automática
do tooling novo.

## Verificação e observações

Nove testes leves das fixtures e dois testes opt-in da galeria passaram: 11
testes, zero falhas/erros/skips, 1min06s. A comparação percorreu todos os pixels:
zero mudanças fora da união dos polígonos; originais intactos; três regiões
pintadas e uma com fallback integral em cada caso. SHA-256 do WebP e PNG
decodificado coincidiram entre arquiteturas em cada fixture.

A inspeção técnica dos sete PNGs observou contraste em fundos claro/escuro,
texto dentro das regiões e markup exibido como caracteres. Isso não é revisão
linguística independente, aprovação humana ou evidência de tradução real.

Limitações observadas e mantidas visíveis:

- pontos das barras sintéticas continuam fora do quadrilátero dentro da elipse;
  a preservação desses pixels é intencional, não remoção perfeita do texto fonte;
- o marcador de overflow é composto por três pixels e exige conferência ampliada;
  o texto completo permanece no manifesto/relatório, sem reivindicar legibilidade
  da tradução na área que não comporta texto;
- uma impressão inicial de pontuação chinesa isolada não foi confirmada:
  os offsets medidos foram `0..9` e `9..11`, mantendo `序。` na segunda linha.
  A fonte Noto e o `LineBreakMeasurer` existente foram usados no diagnóstico;
  não houve ajuste de coordenadas, texto, política ou regra pelo ID da fixture.

O navegador automatizado recusou `file://` por política de segurança. Não se
criou servidor alternativo nem se trocou de superfície para contornar a recusa.
A inspeção dos PNGs foi direta e os testes do HTML são estruturais; screenshot,
layout do HTML e interação no navegador continuam pendentes de conferência local
manual. Esse limite não é uma falha observada na pintura nem aprovação da UI.

O comportamento de quebra por palavras/caracteres e a opção `requireNextWord`
estão descritos no [JDK 25](https://docs.oracle.com/en/java/javase/25/docs/api/java.desktop/java/awt/font/LineBreakMeasurer.html).
A investigação não justifica mudar essa política por uma impressão visual.

## Relatório somente de leitura

[render-visual-review.mjs](../scripts/render-visual-review.mjs) confere os 14 casos,
hashes, headers/dimensões declaradas, vínculos e regiões antes de escrever um
HTML exclusivo no diretório privado da galeria. Headers não substituem decode:
a comparação de pixels pertence ao harness Java, não ao gerador do HTML.
Limites: 8 MiB por arquivo, 16 MiB de inputs acumulados e 4 MiB de HTML.

Imagens PNG verificadas ficam embutidas como snapshots no HTML, evitando que
uma alteração posterior do arquivo mude silenciosamente a imagem apresentada.
Links para os arquivos continuam disponíveis para inspeção; sua integridade
deve ser revalidada caso tenham sido modificados. Texto é escapado, geometria
é numérica validada, CSP bloqueia scripts/rede e não há download, cliente de
provider, inferência ou aprovação automática. Uma nova saída pode ser gerada
sem executar novamente o renderer; um nome existente é recusado.

O primeiro HTML tinha crédito incorreto das fontes (Apache 2.0). Regressão
reproduzida antes da correção para **SIL Open Font License 1.1**, conforme os
arquivos empacotados e `BundledRenderingFonts`. O HTML inicial fica preservado
como histórico não aprovado; usar a versão posterior com créditos e snapshots
corrigidos. Não houve nova renderização para corrigir o relatório.

## Repetição

Pré-requisitos: Docker/JDK/codecs e imagens locais já preparados e conferidos.
Não existe aquisição implícita. Criar um diretório-pai privado novo (modo 700)
fora do Git; `renderer.visual.directory` deve ser um filho ainda inexistente.
Reservar novamente outro diretório para uma nova execução, nunca sobrescrever.

```bash
cd api
./mvnw -o -pl apps/translation-gateway -am test \
  -Dtest=VisualRenderingFixtureTest,NativeRenderingVisualReviewLinuxTest \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Drenderer.visual.enabled=true \
  -Drenderer.visual.directory=/privado/nova-rodada/gallery \
  -Drenderer.native.image.runtime=ubuntu \
  -Drenderer.native.image.arm64.id=sha256:<imagem-arm64-verificada> \
  -Drenderer.native.image.amd64.id=sha256:<imagem-amd64-verificada> \
  -Drenderer.glibc.arm64.directory=/privado/codec-arm64 \
  -Drenderer.glibc.arm64.sha256=<hash-manifest-arm64> \
  -Drenderer.glibc.amd64.directory=/privado/codec-amd64 \
  -Drenderer.glibc.amd64.sha256=<hash-manifest-amd64> \
  -Drenderer.linux.docker.host=unix:///caminho/docker.sock \
  -Drenderer.linux.docker.path=/caminho/docker \
  -Drenderer.linux.codec.directory=/privado/decoder-independente

node apps/translation-gateway/scripts/render-visual-review.mjs \
  --gallery /privado/nova-rodada/gallery \
  --output /privado/nova-rodada/gallery/report.html
```

Usar também o toolchain local já verificado quando o reactor precisar separar
JDK 23 dos demais módulos e JDK 25 do gateway. Substituir todos os placeholders
por pins/caminhos verificados. O relatório deve ser gerado somente após exit
zero do harness e conferência de sua suíte, não apenas pela existência de arquivos.

Revisão humana: conferir legibilidade/contraste/quebras/geometria/fallback em
tamanho integral e guardar observações separadamente, em arquivo privado.
Não comparar IDs como correspondência semântica entre jobs reais: aqui as
regiões são identificadores determinísticos de uma fixture conhecida.

Qualidade em mangás reais, referências independentes, consumo operacional,
segurança residual e OOM agregado permanecem abertos. Nenhum novo aceite,
deploy, chamada paga ou ativação decorre desta galeria.

## Repetição e gates finais

O XML da primeira galeria não foi copiado a tempo: o Maven global já havia
substituído seu relatório por uma suíte desabilitada (um skip). Essa cópia foi
mantida em quarentena e não sustenta a aprovação. O log/exit e os artefatos da
primeira execução foram preservados. Uma repetição deliberada em diretório
novo passou em 2026-10-12, novamente com 11 testes, zero falhas/erros/skips e
1min06s. O wrapper copiou os XMLs antes de registrar o término e antes de
permitir outra execução Maven.

Os 14 `case.json` coincidiram integralmente entre rodadas, incluindo os hashes
de original, WebP, PNG decodificado e manifesto. A reprodução não executou
provider nem substituiu os arquivos anteriores.

SHA-256 XML da repetição nativa (dois testes):
`958d0cb6fef824bae03d34df14ce2633e16c885beb4349cbe96814ac589f3d67`;
XML das fixtures (nove testes):
`8969babd6392ee78edfcbbea667d3615f604504f554a5a644747ce4d93240078`.

Gates da árvore nova: Maven global offline com Docker, sete módulos `SUCCESS`,
2.762 testes, zero falhas/erros e 104 skips opt-in, 2min46s; Node 146 aprovados,
um skip opt-in; `pnpm check` mobile integral (116 suítes/892 testes) e type-check
web aprovados. Links, Prettier direcionado e diff do gateway passaram.
O diff global continua vermelho somente pelo baseline externo de EOF em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, não corrigido.

Snapshot técnico: **417 arquivos**, SHA-256
`1ee3734e80f1e323a16deabbccf243be0a25f16f6df9a280bfabf7013b1a2c30`.
Mesmo escopo/algoritmo: `src/`, `scripts/`, `openapi/`, `pom.xml` e `.tf`/
`.tfvars.example` diretos de `infra/terraform/`; caminhos relativos ordenados,
com sequência `path + NUL + bytes completos + NUL`. A fotografia de 412 arquivos
da matriz anterior não foi renovada retroativamente. Nenhuma fonte/configuração
mobile foi alterada; seu checksum não é cobertura desse Java/Node.
