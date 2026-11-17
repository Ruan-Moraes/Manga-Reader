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

## Papel do balão e sobra do original (2026-11-17)

Duas regras da revisão do corpus de validação (`docs/rendering/visual-regression.md`):

- **Cor do papel quando a caixa abraça o balão.** A cor de referência é a mediana do anel em volta da caixa do OCR.
  Num balão pequeno de gibi antigo, a caixa encosta na borda e metade do anel cai na arte escura, e a mediana virava
  a cor da arte: o interior claro deixava de ser "fundo" e a fala ia para o inpainting. Agora, **só dentro de um balão
  detectado**, quando o anel tem duas cores (quartis a mais de 180 de distância) e a cor clara cobre ao menos o dobro
  da escura dentro da caixa, a clara é o papel. Fora de balão, ou com a cor escura dominando (texto preto grosso,
  balão escuro), nada muda — texto preto colado em arte preta continua sendo arte.
- **Nunca digitar sobre sobra.** Depois da limpeza lisa, se mais de 3% da caixa do texto novo ainda tem tinta original
  intacta (letras que a máscara tomou por arte), a região volta a ser o original e fica marcada como não renderizada.

Limite conhecido: no papel pontilhado de impressão antiga (Planet Comics 73), a máscara ainda junta letras e
pontos num bloco "arte", e o inpainting dentro do balão pode reconstruir a borda como mancha sob o texto. Uma
verificação de mancha pós-inpainting foi testada e descartada: com o LaMa real ela desfazia traduções aceitáveis.

## Letras que escapam da caixa (2026-11-17)

A máscara do balão guarda como arte toda mancha de tinta que chega à borda da janela. Isso protege contornos e
desenhos, mas também guarda a letra cujo traço sai da caixa do OCR: letreiramento a pincel (título coreano),
uma cauda de letra, um "R" encostado. O resultado era meia palavra apagada ao lado da tradução.

Depois do apagamento liso, `StrayLetters` procura as manchas que continuam lá e apaga as que parecem letra:

- tamanho de glifo: cada lado com no máximo 1,5× o passo da letra de origem;
- quase toda dentro do polígono: pelo menos 90%;
- tom da tinta apagada: pelo menos 80% da distância média dela ao papel.

A mancha é preenchida com a mediana de um anel de papel em volta dela, o que serve também para gradiente e papel
envelhecido. Arte que cruza a caixa, maior que uma letra ou de outro tom (disco cinza, retícula) fica.

No portão, o título coreano, o "ず" do Ubunchu! p04 e o "R" da Jungle 2 foram apagados por inteiro. Nenhuma outra
página mudou.
