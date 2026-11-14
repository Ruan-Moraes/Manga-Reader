# ocr/

Avaliação **offline** de OCR sobre amostras locais. Referência de uso:
[`docs/ocr-evaluation/`](../../docs/ocr-evaluation/). Os artefatos são gravados em
`.local/` na raiz do repositório (ignorado pelo Git).

| Arquivo | Função |
| --- | --- |
| `ocr-samples.mjs` | Catálogo de amostras (`verify`, `download`, `gallery`), com limites de tamanho e validação de PNG. |
| `ocr-evaluation.mjs` | CLI principal: `run`, `report`, `layout`, `diagnose` e `columns` (modos `offline` e `vision`). |
| `ocr-diagnostic.mjs` | Parser offline da resposta bruta do Vision (hierarquia página/bloco/parágrafo/palavra/símbolo). |
| `ocr-columns.mjs` / `ocr-columns-core.mjs` | Candidatas a colunas de texto vertical (CLI e algoritmo puro). |
| `ocr-layout.mjs` | Análise experimental de layout com modelo ONNX local. |
| `ocr-calibration.mjs` | Gera imagens sintéticas de calibração (`prepare`, `report`). |
| `CalibrationGlyphRenderer.java` | Renderizador de glifos só com JDK, chamado por `ocr-calibration.mjs` (fonte via stdin, sem rede). |
| `ocr-calibration-evaluation.mjs` | Executa/relata a avaliação sobre as imagens de calibração. |
| `*.test.mjs` | Testes de cada script acima. |

```bash
# na raiz do repositório
node api/apps/translation-gateway/scripts/ocr/ocr-samples.mjs verify
node api/apps/translation-gateway/scripts/ocr/ocr-evaluation.mjs run --mode offline --run-id exemplo
node api/apps/translation-gateway/scripts/ocr/ocr-evaluation.mjs report --run-id exemplo
```
