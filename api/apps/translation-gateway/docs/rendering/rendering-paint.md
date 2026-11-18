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

## Título no tamanho do original (2026-11-17)

Letreiramento grande (título, grito desenhado) é redesenhado com a fonte pesada até o tamanho da letra de
origem (`sourcePitch`: raiz de área ÷ letras), acima do teto de 48 px que mantém os balões parelhos. Falas
continuam com o teto. No portão, "WING TIPS" passou de 48 para 91 px e "The Command Line Rocks!" de 47 para 55.

### Limite conhecido: texto de tela que atravessa quadros

No Ubunchu! p06 o Vision lê numa linha só "ffmpe" (fim de um quadro) e "gnome-panel" (quadro seguinte), e o
agrupamento junta as legendas de três telas desenhadas num bloco que é redesenhado por cima da arte.
Duas tentativas foram medidas e descartadas:

- **Guarda de calha no render** (borda, faixa lisa, borda dentro da caixa): também barra gritos desenhados de propósito
  sobre a calha ("The Command Line Rocks!") e casos sintéticos com linhas retas.
- **Agrupar por quadro** (`RegularPanelDetector` no agrupamento): o detector corta pelos espaços em branco, então
  parte títulos sem moldura ("Pepper / & Carrot", "후추와 / 당근"). Além disso, não separou o bloco.

Para resolver é preciso um detector de quadros que exija moldura, e não só espaço em branco.

## Balão de aquarela (2026-11-17)

O "fundo liso" de um balão era fixo: até 30 de distância da cor do balão. Num balão pintado em aquarela, ou em
papel envelhecido, o papel varia bem mais que isso. As letras deixavam de parecer cercadas por papel (a região era
tratada como texto sobre arte) e a caixa do texto não crescia pelo balão. Antes isso só se ajustava em página
inteira de scan antigo (`noisyScan`).

Agora, dentro de um balão detectado, a tolerância segue o grão do próprio papel entre as letras: a mediana
de distância ×2, entre 30 e 75 (`flatTolerance`). O crescimento da caixa (`BalloonExpansion`) usa a mesma
tolerância. Papel limpo continua em 30. No portão, só o zh p03 mudou: os balões azuis "传统…" e "远古建立的..."
passaram a ser traduzidos.

### O que a revisão chamou de "texto não lido"

A medição contra o lote pago mostrou que quase todo texto "não lido" foi lido e traduzido, mas não coube:

- "我回屋了。" e "不如什么!" (zh p01);
- os balões azuis do zh p03 (corrigidos acima);
- "BACK-BACK! AWAY" e "DO AS I SAY!" da Fight 40.

A releitura paga já cobre as caixas do detector: só 5 de todo o corpus ficam sem leitura, e são
onomatopeias. Os casos de encaixe restantes ficam para a etapa de tamanho de letra. Exemplos:

- no balão oval minúsculo do zh p01, a tradução é longa demais;
- nos balões justos da Fight 40, o entrelinha da fonte (≈1,36×) não deixa caber duas linhas a 12 px.

## Entrelinha apertada como último recurso (2026-11-17)

Quando nenhum caminho cabe (caixa própria, crescida, sílabas, letra menor), a fala dentro de um balão detectado
é composta com entrelinha de 1,18× o tamanho da fonte, em vez da altura de linha da face (≈1,36×). A caixa
cresce pelo papel liso do balão. É o que um letrista faz num balão justo. Texto fora de balão detectado fica na própria caixa.
No portão passaram a caber:

- "BACK-BACK! AWAY" (Fight 40);
- "YOU'RE RIGHT CAMILLA" (Jungle 73);
- "我回屋了。" (zh p01);
- "SIGH" (Ubunchu! en p3);
- o "The" de "The Beast".

"DO AS I SAY!" (Fight 40) e "不如什么!" (zh p01) continuam com o original: a tradução é longa demais
para o balão.

## Piso pela letra de origem em todas as escritas (2026-11-17)

Antes, só chinês, japonês e coreano tinham piso pelo tamanho da própria letra de origem. Inglês e espanhol
dependiam só da mediana da página, então uma fala lida numa caixa justa saía bem menor que o letreiramento
original ("Pff... ¡Obvio!" a 12 px num balão de letra grande).

Agora todas as escritas têm esse piso: 0,7 × raiz de (área ÷ letras), que corresponde a cerca de 3/4 do
tamanho da fonte de origem. A caixa cresce pelo balão até alcançá-lo, ainda limitada ao teto da página (mediana ×1,35).
No portão, 31 falas cresceram (por exemplo, 12→21, 15→23, 27→37). Nenhuma piorou e a tinta que sobra não mudou.

**Limite:**

- O piso parte do texto lido. Se a caixa do OCR for bem maior que o texto, o piso sai alto, mas o crescimento
  continua preso ao papel liso e ao balão detectado.
- Dois balões vizinhos com a mesma letra podem sair em tamanhos diferentes quando só um deles alcança o piso
  ("Sério!?" 21 ao lado de "Ninguém?" 13, es p03).

## Caixa redesenhada não engole outros textos (2026-11-18)

No Ubunchu! p06, o OCR juntou num bloco só os rótulos de três telas desenhadas ("72個…firefox…gnome-panel").
O filtro tratou o bloco como grito, e ele foi apagado e redesenhado por cima da arte de três quadros, cortando os
balões dentro dele ("Plugins ou co-").

Um letreiramento de verdade não contém outros balões. Agora, uma região que seria reconstruída sobre a arte e cuja
caixa contém metade ou mais da caixa de outra região de texto fica com o original (`swallows`). As regiões de
dentro são desenhadas normalmente.

No portão, o sinal separa sem ambiguidade:

- o bloco do p06 contém 6 regiões inteiras;
- entre todas as outras regiões reconstruídas, a maior sobreposição com um vizinho é de 32%, e nenhum vizinho fica
  pela metade dentro.

Só o p06 mudou.

**Limite:** "[全般 DNS ホスト] 有線接続…" (texto de tela num quadro só) continua sendo tratado como grito. O tamanho de
letra não o separa dos gritos reais: 1,48× a mediana da página, contra 1,52× de um grito do corpus.
