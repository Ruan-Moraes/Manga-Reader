# Qualidade visual da tradução — estado e pendências (2026-11-14)

Origem: auditoria visual das 12 páginas de *Ubunchu!* ep. 01 (pt-BR), que reprovou o lote
(balões vazios, resíduos, remendos sobre a arte, fontes gigantes, SFX/UI traduzidos como fala,
sem gate de qualidade). Registro no débito técnico: DT-77 em [`docs/tech-debt.md`](../../../../../docs/tech-debt.md).
Contrato do manifesto: [rendering-contracts.md](rendering-contracts.md).

## Feito

| Item | Onde |
|---|---|
| Texto que não cabe **preserva o original** (sem balão apagado nem marcador); retentativa com a caixa inscrita inteira | `PageRasterPainter` |
| Fonte limitada a 1,35× a mediana da página (3+ regiões) | `PageRasterPainter.fontCap` |
| Fringe de 4 px: apaga traços de glifo que vazam do polígono OCR, só se encadeados à tinta dentro dele | `CleanBoxPainter.fillWithFringe` |
| Termos protegidos (glossário, URLs, `$var`) em `<span translate="no">`; região que perde o termo volta ao texto-fonte | `ProtectedTerms`, `TranslationEnvelopeCodec`, `glossary/protected-terms.txt` |
| Regiões só-literais (números, URLs, nomes) não vão ao provedor | `CloudTranslationAdapter` |
| `quality` (`OK`/`NEEDS_REVIEW`; `TEXT_NOT_RENDERED`, `ALL_TEXT_NOT_RENDERED`) no manifesto, revalidado no decode; não bloqueia a entrega | `PageQuality`, `RenderManifestService` |
| Agrupamento heurístico de parágrafos por balão (en/es/pt-BR; CJK intocado) | `OcrRegionGrouper`, `ProcessOcrTaskUseCase` |
| Máscara do balão: limpa só o interior do balão + letras cercadas; arte, borda e SFX fora do balão ficam mesmo com polígono OCR maior que o balão | `BalloonMask`, `CleanBoxPainter.fillMasked` |
| Original preservado quando a tradução é igual ao texto ("AKANE!", "FREEK" — sem `NEEDS_REVIEW`) ou o texto está sobre arte (<25% da tinta cercada pelo balão — com `NEEDS_REVIEW`) | `PageRasterPainter.preserveOriginal`, `UnchangedText`, `PageQuality` |
| Sem quebra no meio da palavra ("YouTu / be", "Pesq / uisa") | `PageRasterPainter.compose` (`requireNextWord`) |
| Espaço que o provedor põe entre termo protegido e pontuação removido ("Ubuntu!", "(wget)") | `TranslationEnvelopeCodec` |
| Parágrafos com caixas sobrepostas (manuscrito inclinado) agrupados como um bloco | `OcrRegionGrouper` |
| Balões do ONNX levados ao render (artefato de layout verificado por hash, mesma imagem e OCR): limitam fundo do balão e expansão de fonte, com folga de 15% | `ProcessRenderingTaskUseCase.bubbles`, `CleanBoxPainter.balloonLimit`, `BalloonMask` |
| Inpainting LaMa (ONNX, CPU, ~0,85 s/região) para falas e legendas sobre arte no render local: arte reconstruída, tradução em preto com contorno; SFX preservados; só pixels alterados pelo modelo são escritos | `LamaInpainter`, `CaptionFilter`, `PageRasterPainter` |
| Releitura do OCR: falas com palavras de baixa confiança ou fora do léxico são relidas em 4 variantes de imagem num mosaico (1 chamada extra ao Vision por página) e a votação (confiança + concordância + dicionário) escolhe a leitura; sem regra por obra/idioma | `OcrRereadService`, `OcrReread`, `RereadMosaicBuilder`, `lexicon/` |
| `quality` na API: V10 grava as contagens de texto na etapa de render; `ReadyResult.quality` (opcional) derivado delas; mobile aceita o campo; selo "revisar" no `gateway-tester` | `RenderTextCounts`, `PageQuality.of`, `GatewayController.Quality`, V10 |
| Agrupamento por balão ONNX (`GATEWAY_LAYOUT_MODE=grouping`, opcional): divide parágrafos do Vision por palavra quando cruzam a borda do balão e junta falas por balão; heurística continua para texto livre e como fallback | `OcrRegionGrouper.splitByBubbles`/`group(..., bubbles)`, `ShadowLayoutService.detectForGrouping` |
| ONNX: `text_bubble`/`text_free` no layout `1.2` (`textBoxes`, `regionKinds`), modo sombra; modelo baixado em `.local/` | `OnnxBubbleDetector.decodeAll`, `LayoutInterpreter` |
| Limpeza do halo JPEG (contorno retangular cinza em volta do texto): até 8 px, distância 6–120, preserva antialiasing de borda/arte, desiste em retícula/gradiente (>40% não-liso); limpeza calculada antes de pintar | `CleanBoxPainter.halo`/`extraCleanup` |
| Piso de fonte 0,75× a mediana: região pequena (ou em overflow) recomposta numa caixa expandida para o fundo liso do balão; para em tinta e em outras regiões; tolera e limpa o halo JPEG até 8 px; só aceita se a fonte aumentar | `PageRasterPainter.raiseToFloor`, `BalloonExpansion` |

Validação real (worker reiniciado, GCP `toonlira-rm`): ch02 p.02–04 chegaram a `READY`; na p.03 as
regiões caíram de 29 para 15 com falas coerentes. Suíte do gateway: 1314 testes; 3 falhas
pré-existentes de ambiente (Java 23 vs 25, render nativo).

Piso de fonte validado em ch02 p.02–03 reais: p.03 menor fonte 15 → 24 px ("Claro!", "AKANE!",
"MINHA MOTIVAÇÃO…" agora no tamanho das vizinhas); p.02 overflows 6 → 2. Suíte: 1317 testes, mesmas 3
falhas de ambiente. Halo validado na p.03 real: contornos retangulares sumiram dos balões lisos sem dano
visível na arte. Máscara do balão validada nas p.03–04: nenhuma caixa branca sobre arte; SFX "clatter",
"PAH!", "FREEK" e "AKANE!" mantêm a letra original; texto sobre a borda do quadro preservado com revisão.
Suíte: 1324 testes + novos de layout, mesmas 3 falhas de ambiente.

Não houve comparação antes/depois controlada nem teste com o original em japonês.

## Pendente (por prioridade)

### Qualidade visual
2. **Agrupamento por layout ONNX** (avaliado — ver [layout-experimental.md](../ocr-evaluation/layout-experimental.md)):
   balões melhores que a heurística em 10 de 12 páginas inglesas com diferença; os balões chegam ao
   render e limitam máscara e expansão de fonte. Falta: **agrupar texto vertical CJK por balão** (72% dos
   balões japoneses têm várias colunas traduzidas isoladas) e provisionar o modelo para usar `grouping`
   em produção.
3. **SFX/texto livre** (parcial): falas/legendas sobre arte agora são traduzidas com inpainting
   ([inpainting.md](inpainting.md)); SFX preservados por decisão de produto; letreiro manuscrito partido
   em parágrafos sobrepostos agora vira uma fala só ("Podemos ser a Brigada da GUI!", 23 px). Falta: (c) usar `regionKinds` no render exige
   levar o layout até a requisição de render (hoje só no bucket privado).
4. **Inpainting real** (parcial): LaMa em CPU para falas sobre arte, só no render `local`
   ([inpainting.md](inpainting.md)). Falta: levar aos modos isolado/nativo sem quebrar o isolamento;
   balões com fundo de retícula ainda usam preenchimento liso. (O fringe da moldura de retícula saiu
   com a máscara do balão.)
5. **Erros de OCR** (parcial): releitura por confiança em mosaico com votação apoiada em dicionário —
   ver [ocr-reread.md](../ocr-evaluation/ocr-reread.md). Falta: casos em que todas as variantes erram
   igual ("THE CHOSEN 05...") — candidato a camada de linguagem opcional.

### Contrato e produto
6. ~~**`quality` na API**~~ — feito: `ReadyResult.quality` (V10 + OpenAPI + zod do mobile).
7. ~~**Selo "revisar" no `gateway-tester`**~~ — feito (lote e página única).

### Verificação
8. Comparação com a edição original (ep. 01, Hiroshi Seo) e diff por região.
9. Regressão visual com asserções por região, estendendo `VisualRenderingFixture`.
10. Validar mais páginas reais (bancada offline com cache do Vision já existe para o agrupamento);
    calibrar piso (0,75×, fundo ≤ 30), releitura (variação entre execuções: "WINDOWS 15 50" ora corrigido,
    ora não) e inpainting.

## Próximo passo sugerido
Item 4 (inpainting real para texto livre preservado) ou avaliar o modo `grouping` em mais páginas/mangá
japonês antes de torná-lo padrão.
