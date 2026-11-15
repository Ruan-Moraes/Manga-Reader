# Inpainting de falas sobre arte (LaMa, CPU)

Texto de **fala ou legenda** desenhado sobre a arte (fora de balão: "Thank you for finally calling it
Ubuntu!", "Now Akane... Fine then!!") era preservado em inglês. Agora, no modo de render `local`, a arte sob
ele é reconstruída e a tradução é escrita por cima (preto com contorno branco). **SFX continuam com o
desenho original** (decisão de produto de 2026-11-14).

Ligado só quando `GATEWAY_RENDERING_INPAINTING_MODEL_PATH` aponta para o modelo; vazio = comportamento
anterior (texto sobre arte preservado). Threads: `GATEWAY_RENDERING_INPAINTING_THREADS` (padrão 4).

## Modelo

- LaMa (big-lama), porta ONNX **Carve/LaMa-ONNX** `lama_fp32.onnx`, revisão
  `c3c0c9e468934d62e79c329e35d82dd09ff8c444`, SHA-256
  `1faef5301d78db7dda502fe59966957ec4b79dd64e16f03ed96913c7a4eb68d6` (verificado antes de carregar).
- Licença **Apache-2.0** (código original advimman/lama também Apache-2.0); pesos treinados no Places2
  (CC BY 4.0) — atribuição recomendada aos autores do Places2.
- Não versionado: baixar para `.local/inpainting/` (ignorado pelo Git). ~200 MB, ~+200 MB de RAM no worker.
- Entrada fixa 512×512 (`image` RGB 0–1, `mask` 0/1); saída RGB 0–255.

## Bancada (Ryzen 7 9700X, 4 threads)

| Variante | Tempo por região | Observação |
|---|---|---|
| `lama_fp32.onnx` (199 MB) | ~0,85 s | escolhida |
| `lama_int4_int8.onnx` (36 MB) | ~1,03 s | mais lenta em CPU (dequantização) |

Uma página tem tipicamente 0–3 falas sobre arte.

## Fluxo

1. `ProcessRenderingTaskUseCase` marca **dicas de legenda** (`CaptionFilter`): tradução diferente do
   original, ≥ 2 tokens diferentes com letras e, se houver léxico do idioma, ≥ 60% deles palavras.
   Japonês/chinês (sem espaços): ≥ 4 letras com kanji ou ≥ 6 só em kana, ≥ 3 letras diferentes e sem
   unidade repetida — 「※ウブントゥですよ」 é legenda; 「ひゅるる」, 「カタカタ…」, 「ドキドキ」 são SFX.
   Onomatopeia repetida ("clatter clatter"), palavra única e não-palavras ficam de fora.
2. `PageRasterPainter` só aplica o inpainting quando a dica existe **e** a máscara do balão confirma texto
   sobre arte (`enclosedInk < 0,25`) **e** há inpainter (modo local). Senão, comportamento anterior.
3. `LamaInpainter`: janela quadrada ≥ 2,5× a caixa (contexto), reduzida a 512, máscara = caixa OCR + 4 px;
   o resultado volta ao tamanho da janela e **só os pixels que o modelo mudou** (+2 px) são escritos —
   o resto mantém o original, sem "remendo" retangular de tom diferente.
4. Texto composto na caixa inscrita do polígono, recortado à caixa reconstruída, com contorno.
5. Falha do modelo → região preservada (como sem inpainting).

## Modos isolado/nativo: LaMa no pai, dois passes do filho (2026-11-15)

O render isolado roda num processo filho sem acesso nativo e com memória limitada (decisão de
segurança): só ele decodifica a página. Por isso o LaMa (ONNX, nativo) **não** vai para o filho:

1. O pai (worker) marca o diretório de staging com `inpaint.enabled` quando tem o modelo.
2. **1º passe do filho**: o pintor pede as janelas como sempre, mas um `Recorder` só as grava em
   `inpaint-request.bin` (geometria + 512×512 RGB cru + máscara 0/1, até 8 janelas) e as recusa; o resultado
   desse passe é o fallback completo (letra original nas falas sobre arte).
3. **Pai**: valida o arquivo (tamanho exato, máscara 0/1, geometria coerente) e roda o modelo só nesses
   números — nunca vê a imagem codificada; grava `inpaint-patches.bin`.
4. **2º passe do filho**: um `Replayer` recebe os pedidos na mesma ordem, confere a geometria da janela e
   aplica a resposta com a mesma regra do modo local (`InpaintWindow.apply`). Diferença de geometria ou falha
   do modelo → aquela fala fica com a letra original.

Custo: um 2º lançamento do filho só em páginas com fala sobre arte. Arquivos versionados, sem serialização
Java. Validado com JVM-filho real e o codec WebP real (`IsolatedInpaintingEndToEndTest`); o pixel final é
idêntico ao do modo local (`InpaintExchangeTest`). Na mesma mudança, o pedido ao filho passou a levar as
**dicas de fala e os balões detectados** — antes o filho pintava sem eles (máscara sem limite de balão).
Produção ainda tem o render desabilitado (`infra/terraform`).

## Validação real (Ubunchu! ch02, en→pt-BR)

- p.03 "Thank you for finally calling it Ubuntu!" → "Obrigado por finalmente chamá-lo Ubuntu!" sobre o
  vão entre quadros reconstruído.
- p.04 "Now Akane... Fine then!! Ubunchu it is..." → traduzido; a borda do quadro que o texto cruzava foi
  reconstruída. Os "clatter" (SFX) permanecem desenhados.

## Limites conhecidos

- Janelas grandes (faixas longas) passam por 512 px e voltam: detalhe fino reconstruído sai suave.
- Retícula sob o texto é reconstruída de forma aproximada. Balões com fundo de retícula (≥ 15 pontos de tinta
  em volta do texto) também passam pelo LaMa em vez do preenchimento liso; não há exemplo real nas amostras
  (Ubunchu! não tem fala sobre retícula), só o teste sintético.
- Espaço antes de pontuação após termo protegido ("Ubuntu !") vem da etapa de tradução, não daqui.

## Letreiros à mão e fala que não cabe no papel (2026-11-15)

- **Letreiro** (`CaptionFilter.letterings`, dica `letteringHints`): frase (≥ 8 letras com kanji, ou ≥ 3
  palavras) que o detector não vê como texto (`unknown`) **ou** desenhada bem maior que a letra da página
  (sqrt(área/letras) ≥ 1,8× a mediana). Com inpainter: LaMa apaga, a tradução vai em **Noto Sans Black**
  (pacote verificado `noto-sans-1.1`, OFL, mesma revisão da Regular) com contorno branco largo, no tamanho da
  própria caixa e **inclinada** como o polígono do OCR (até 0,5 rad); fica fora da mediana/teto/piso das falas.
  Onomatopeia curta continua SFX. Real: pág. 01_03 「ターミナルがあれば全てが」 → "Com um terminal, tudo…".
- **Fala que não cabe no papel**: fala com dica que o caminho liso não consegue encaixar nem crescendo no balão
  (letra sobre papel cortado por linhas de velocidade, sem interior de balão contínuo) passa pelo LaMa e é
  reescrita na própria caixa, em vez de ficar sem tradução.
- As duas dicas também viajam ao filho isolado (`RenderSubprocessProtocol`).

