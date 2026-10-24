# Caixa limpa — plano geométrico

Parcela de MOB-FEAT-020/TASK-003, 2026-10-03. Não altera manifesto OCR,
traduções, banco, defaults ou worker. Não usa imagem privada ou provider.

## Plano antes do código

1. Fixtures sintéticas precedem o adapter. Conferir todos os pixels fora dos
   quadriláteros com uma implementação independente da geometria.
2. Converter os quatro vértices normalizados para coordenadas contínuas da
   imagem e recortar aos limites. Rasterizar pelo centro do pixel, com bordas
   superiores/esquerdas incluídas e inferiores/direitas excluídas. Não ampliar
   para o retângulo delimitador e não aplicar antialias à neutralização.
3. Estimar todas as cores sobre o raster ainda intacto. Amostrar até 128 pontos
   no perímetro do retângulo externo, a dois pixels na política inicial,
   excluindo qualquer região OCR. Usar mediana inferior por canal ARGB;
   ausência de amostra usa branco opaco explicitamente. É estimativa de caixa
   limpa, não reconstrução de arte ou aprovação visual.
4. Escrever sequencialmente pela ordem OCR; a última região prevalece na
   interseção. Representar geometria compactamente, sem máscara ou segundo
   raster de página inteira. O caller entrega um único raster de trabalho
   decodificado; o adapter nunca abre ou sobrescreve arquivo original.
5. Cancelamento/interrupção descarta o raster parcial no caller futuro;
   dimensões/tipo incompatíveis falham antes da pintura. Não lançar causas,
   texto, IDs, paths ou job em exceções/representações.
6. Página vazia não altera pixels. Região subpixel sem centro coberto não é
   ampliada; a composição textual futura a sinalizará como overflow.

## Limites da parcela

A cor é calculada por canal, não por modelo semântico de balão. Sobreposições
continuam na ordem original, sem consumir layout experimental. Nenhum texto é
desenhado neste incremento; wrapping, contraste e fallback são TASK-004.
Arquivo WebP, commit/READY e retenção são tasks posteriores. Testes de pixels
não substituem profiling nativo ou revisão visual de páginas reais.
