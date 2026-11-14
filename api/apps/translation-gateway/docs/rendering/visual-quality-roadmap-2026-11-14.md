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
2. **Agrupamento por layout ONNX** (feito, opcional): falta (a) avaliar em mais páginas e em mangá
   japonês antes de virar padrão — as caixas do modelo nas páginas em inglês são imprecisas; (b) usar
   os balões também para limitar máscara/layout no render (hoje o layout não chega ao render).
3. **SFX/texto livre** (parcial): texto sobre arte e letra igual ao original já são preservados; o ONNX
   classifica `text_free` em sombra. Falta: (a) texto livre preservado continua em inglês — só redesenhar
   SFX com tipografia estilizada ou inpainting real resolveria; (b) letreiro desenhado à mão sobre fundo
   liso ("GUI brigade!") é trocado por fonte comum pequena (13 px); (c) usar `regionKinds` no render exige
   levar o layout até a requisição de render (hoje só no bucket privado).
4. **Inpainting real**: fundos texturizados/gradiente ainda recebem cor mediana e podem deixar remendos.
   (O contorno retangular de halo JPEG em balões lisos foi resolvido — ver "Feito".) Pendente também: o
   fringe pinta uma moldura de 4 px quando a cor de limpeza é a mediana de uma retícula.
5. **Erros de OCR** (parcial): releitura por confiança em mosaico com votação apoiada em dicionário —
   ver [ocr-reread.md](../ocr-evaluation/ocr-reread.md). Falta: casos em que todas as variantes erram
   igual ("THE CHOSEN 05...") — candidato a camada de linguagem opcional.

### Contrato e produto
6. ~~**`quality` na API**~~ — feito: `ReadyResult.quality` (V10 + OpenAPI + zod do mobile).
7. ~~**Selo "revisar" no `gateway-tester`**~~ — feito (lote e página única).

### Verificação
8. Comparação com a edição original (ep. 01, Hiroshi Seo) e diff por região.
9. Regressão visual com asserções por região, estendendo `VisualRenderingFixture`.
10. Validar mais páginas reais; calibrar fringe (4 px, distância de cor 120), piso (0,75×, fundo ≤ 30) e parâmetros do agrupador
    (gap ≤ 0,8×altura, sobreposição ≥ 40%).

## Próximo passo sugerido
Item 4 (inpainting real para texto livre preservado) ou avaliar o modo `grouping` em mais páginas/mangá
japonês antes de torná-lo padrão.
