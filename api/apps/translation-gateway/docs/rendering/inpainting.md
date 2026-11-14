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
   Onomatopeia repetida ("clatter clatter"), palavra única e não-palavras ficam de fora.
2. `PageRasterPainter` só aplica o inpainting quando a dica existe **e** a máscara do balão confirma texto
   sobre arte (`enclosedInk < 0,25`) **e** há inpainter (modo local). Senão, comportamento anterior.
3. `LamaInpainter`: janela quadrada ≥ 2,5× a caixa (contexto), reduzida a 512, máscara = caixa OCR + 4 px;
   o resultado volta ao tamanho da janela e **só os pixels que o modelo mudou** (+2 px) são escritos —
   o resto mantém o original, sem "remendo" retangular de tom diferente.
4. Texto composto na caixa inscrita do polígono, recortado à caixa reconstruída, com contorno.
5. Falha do modelo → região preservada (como sem inpainting).

## Por que não nos modos isolado/nativo

O render isolado roda num processo filho sem acesso nativo e com memória limitada (decisão de
segurança). Levar ONNX para lá quebraria o isolamento; esses modos não recebem inpainter e preservam o
texto sobre arte como antes. Produção ainda tem o render desabilitado (`infra/terraform`).

## Validação real (Ubunchu! ch02, en→pt-BR)

- p.03 "Thank you for finally calling it Ubuntu!" → "Obrigado por finalmente chamá-lo Ubuntu!" sobre o
  vão entre quadros reconstruído.
- p.04 "Now Akane... Fine then!! Ubunchu it is..." → traduzido; a borda do quadro que o texto cruzava foi
  reconstruída. Os "clatter" (SFX) permanecem desenhados.

## Limites conhecidos

- Janelas grandes (faixas longas) passam por 512 px e voltam: detalhe fino reconstruído sai suave.
- Retícula sob o texto é reconstruída de forma aproximada.
- Espaço antes de pontuação após termo protegido ("Ubuntu !") vem da etapa de tradução, não daqui.
