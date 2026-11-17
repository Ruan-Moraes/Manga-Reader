# Regressão visual do render

Duas camadas, ambas com expectativas **por fala**:

| Teste | Onde roda | O que confere |
|---|---|---|
| `VisualRegressionTest` | sempre (cenas geradas no teste) | uma cena por regra: piso de fonte em balão liso, coluna vertical japonesa, balão oval, fala sobre arte com dica (inpainting), SFX sobre arte (original intacto), balão com retícula, tradução igual ao original, tradução que não cabe |
| `RealPageRegressionTest` | Ubunchu!: só onde as amostras existem; corpus: sempre | páginas reais de Ubunchu! (ja 01_03, 01_04, 01_07, 01_09, 02_06; en ch02 p.03–04) e as 50 páginas do corpus de validação (`visual-regression/corpus/`) |
| `CorpusOcrReplayTest` | sempre | estágio de OCR das 50 páginas do corpus: resposta do Vision e detector congelados → `OcrAssembly` (o mesmo do worker) → regiões iguais à linha de base |

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

## Portão de regressão do corpus

O corpus de validação (`web/apps/gateway-tester/corpus/`, versionado: 8 capítulos em en/ja/ko/zh/es, livres de
direitos) é a base de "nenhuma regressão" para mudanças em OCR, agrupamento e render:

- `src/test/resources/corpus-replay/<capítulo>/<página>.vision.pb` — resposta do Cloud Vision, capturada **uma vez**;
- `<página>.detections.json` — saída do detector de balões (ou `{"failed": ...}` quando o detector falhou, como o
  worker trata: agrupamento por proximidade);
- `<página>.regions.json` — linha de base das regiões (texto + caixa) produzidas pelo `OcrAssembly`;
- `visual-regression/corpus/<capítulo>-<página>.json` — fixture de render (falas e tradução congeladas de um lote).

Capturar ou completar: `scripts/regression/capture-corpus.sh [web/apps/gateway-tester/corpus/runs/<lote>]` (pago:
uma chamada de Vision por página ainda sem `.vision.pb`; o detector roda local). Limite: a releitura paga
(`OcrRereadService`) não é reproduzida, então o texto de algumas regiões difere do que o worker publicou.

Uma correção que muda regiões ou o render de propósito regrava as linhas de base com `UPDATE_VISUAL_FIXTURES=1` e
o diff entra no commit. Uma mudança no OCR que altera as falas de uma página invalida a tradução congelada da sua
fixture de render: rodar um lote novo e recapturar essa fixture. O lote pago (botão "Rodar pipeline" do
gateway-tester) continua sendo o portão final; o leitor `#/resultados` compara cada página com o **lote anterior**.
