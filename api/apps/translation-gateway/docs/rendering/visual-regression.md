# Regressão visual do render

Duas camadas, ambas com expectativas **por fala**:

| Teste | Onde roda | O que confere |
|---|---|---|
| `VisualRegressionTest` | sempre (cenas geradas no teste) | uma cena por regra: piso de fonte em balão liso, coluna vertical japonesa, balão oval, fala sobre arte com dica (inpainting), SFX sobre arte (original intacto), balão com retícula, tradução igual ao original, tradução que não cabe |
| `RealPageRegressionTest` | só onde as amostras existem | páginas reais de Ubunchu! (ja 01_03, 01_04, 01_07, 01_09, 02_06; en ch02 p.03–04) |

Asserções (`RegionChecks`): `overflow` esperado; fonte ≥ piso; **tinta original que sobra** ao lado do texto
novo (pixels que eram tinta, continuam tinta e ficam fora da caixa do texto novo, com folga de 3 px); **pixels
alterados fora** dos balões (+15%) e das caixas de texto (+14 px); original idêntico quando deve ser preservado.

## Páginas reais

As imagens (CC BY-NC-SA 2.1 JP, Hiroshi Seo; e a edição em inglês) **não** vão para o repositório. Os fixtures em
`src/test/resources/visual-regression/*.json` guardam só as entradas do render — texto do OCR, tradução congelada
(saída do Google na captura), polígonos, balões e classe do detector por fala — e as expectativas. O teste procura
as páginas em `TOONLIRA_SAMPLES` (padrão `~/Documentos/Projetos/toonlira-samples`) e é pulado sem elas. O LaMa é
trocado por um preenchimento branco determinístico (o modelo não faz parte da regressão).

Nas páginas reais a "tinta que sobra" inclui bordas de balão e arte dentro da caixa de cada fala, então os
valores são uma **linha de base** ("não piorar"): fonte ≥ 85% da gravada, tinta ≤ gravada × 1,1 + 20 px, pixels
fora ≤ gravado + 50.

### Capturar uma página nova
1. Processar a página no gateway local (`.local/bench/submit_pages.py`) para obter o manifesto de render.
2. `java -cp <classes>:<deps> .local/bench/CaptureFixture.java <detector.onnx> <amostras> <imagem relativa> <manifest.json> src/test/resources/visual-regression/<nome>.json`
   (balões e classes vêm do detector, com a mesma regra do `LayoutInterpreter`).
3. Gravar as expectativas: `UPDATE_VISUAL_FIXTURES=1 ./mvnw -pl apps/translation-gateway -am test -Dtest=RealPageRegressionTest`.

### Mudança intencional de comportamento
Rodar com `UPDATE_VISUAL_FIXTURES=1`, **revisar o diff dos JSON** (quais falas mudaram de fonte/overflow/tinta) e
commitar junto com a mudança — o diff é o registro do que a regra nova alterou.
