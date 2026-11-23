# visual-review/

Gera uma galeria HTML estática para revisão humana da renderização (14 casos).
Só revalida artefatos existentes e escreve HTML; não renderiza nem chama serviços.
Doc: [`rendering-visual-review`](../../docs/rendering/rendering-visual-review-2026-10-12.md).

| Arquivo | Função |
| --- | --- |
| `render-visual-review.mjs` | `createVisualReview`: confere os casos e escreve o HTML. Opções `--gallery` e `--output` (caminhos absolutos). |
| `render-visual-review.test.mjs` | Testes. |
