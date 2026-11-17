# Releitura do OCR por confiança (mosaico + votação com dicionário)

Corrige erros de leitura do provedor (ex.: "IS SO" lido "15 50", "OS" lido "05", "STOP" lido "TÏÏÏ")
sem regra por obra, idioma ou palavra. Ligado por padrão: `GATEWAY_OCR_REREAD_MAX_REGIONS=8`
(`0` desliga; máximo 16). Pesquisa e opções avaliadas: discussão de 2026-11-14 (ferramentas de mangá,
correção pós-OCR, votação entre variantes, super-resolução, LLM multimodal).

## Fluxo (`OcrRereadService`, depois do agrupamento)

1. **Dúvida**: o Vision devolve confiança por palavra (`OcrParagraph.Word.confidence`). Uma fala é
   suspeita se alguma palavra (pontuação ignorada) tem confiança < 0,8 ou, em en/es/pt-BR, não está no
   léxico. Ordem: palavra mais fraca primeiro; até `reread-max-regions` falas por página.
2. **Variantes** (`RereadMosaicBuilder`, só CPU): recorte da fala inteira (contexto ajuda: "THIS OS"
   é lido certo, um "05..." isolado não) em 4 formas — 2× e 3× coloridas, 3× binarizada (Otsu) com
   traço afinado, 3× em cinza com contraste esticado.
3. **Mosaico**: todos os recortes × variantes numa única imagem (`MosaicLayout`, espaço branco entre
   eles) → **uma** chamada extra ao Vision por página com dúvida (inline, não armazenada). Página sem
   dúvida: nenhuma chamada extra.
4. **Votação** (`OcrReread.choose`): por fala, original × releituras; pontos = confiança média +
   concordância entre variantes (0,2 por variante) + fração de tokens que são palavras do idioma
   (número conta como não-palavra). Só troca se ≥ 2 variantes concordam, a leitura é parecida com a
   original (sem puxar texto vizinho; palavras fora da caixa original são descartadas) e vence por
   margem de 0,15. Diferença só de espaçamento nunca vence. Falha em qualquer etapa → leitura original.

Logs só com contagens (`paragraphs`, `suspects`, `tilesRead`, `replaced`); nunca texto.

## Escolha das variantes (laboratório, Ubunchu! ch02 p.03–04, 8 tratamentos)

| Caso | Acertos por variante |
|---|---|
| "ARE 50" → SO | colorida 2×/3×, binarizada fina, cinza+contraste (4/8); binarizadas normal/grossa erram |
| "THIS 05" → OS | 7/8 |
| "05..." isolado | 0/8 (sem contexto) |
| "WINDOWS 15 50" | só binarizadas 2×/fina; maioria erra no recorte do parágrafo |

O traço engrossado repetia os erros e saiu do conjunto.

## Resultado real (p.02–04, en→pt-BR)

- "WINDOWS IS SO PATHETIC!" → "O Windows é tão patético!" (antes "WINDOWS 15 50: PATÉTICO!").
- "YOU LINUX FREAKS ARE SO ANNOYING!", "ABOUT THIS OS..." → "sobre este sistema operacional",
  "SSSSSS TTTTTTT" (SFX STOP).
- 2–3 substituições por página, 1 chamada extra ao Vision por página.

## Limites conhecidos

- Quando todas as variantes erram igual, não corrige ("THE CHOSEN 05..." — ambíguo até com contexto;
  "the chosen 5" também é plausível). É onde uma camada de linguagem (LLM, opcional, ainda não
  implementada; exige atualizar o disclosure) ajudaria.
- Recorte de texto inclinado pode pegar rótulo vizinho ("mar Survey"); essas regiões costumam ser
  preservadas no render (texto sobre arte).
- Léxico só para en/es/pt-BR (`src/main/resources/lexicon/`, FrequencyWords 50k, CC BY-SA 4.0 — ver
  `NOTICE.md`); ja/ko/zh usam só confiança e concordância. Página WebP sem leitor ImageIO local pula a
  releitura.

## Recuperação de texto não lido (2026-11-15)

O Vision às vezes não devolve nada para falas curtas isoladas (「わーい」, 「あ」, 「で」, 「第1話」). Com o
agrupamento por balão ligado, caixas de texto do detector sem nenhuma palavra do OCR dentro são relidas com as
mesmas variantes, numa chamada extra só nas páginas que têm esse tipo de caixa (até o mesmo orçamento de 8). A
caixa vira parágrafo novo, antes do agrupamento, só quando 2+ variantes concordam numa leitura com letras e
confiança ≥ 0,8; reticências e pontuação sozinha não contam.

Medido em 24 páginas japonesas (16 caixas sem leitura):

| Recorte | Resultado |
|---|---|
| margem 6–24 px | a borda do balão confunde: 「わーい」 vira "0000"/"ll" |
| caixa exata do detector | 9 recuperadas (「わーい」 4/4 variantes, 「第1話」, 「アキバ帰りの」, 「あ」, 「ら」, 「うん」, 「で」); nada inventado |

Duas proteções saíram da bancada: no mosaico, a distância lateral entre recortes passou a ser ≥ a altura do
recorte (glifos sozinhos ampliados 3× eram lidos como uma linha só, "あらららら") e palavra que cruza dois
recortes é descartada; numa caixa vertical, palavra de várias letras deitada na horizontal (「であも」 para
「あー」「でも」 — leitura atravessando colunas) é descartada.

### Moldura branca, leitura parcial e reticências (2026-11-15, 2ª rodada)

- **Moldura branca**: o recorte exato da caixa vai para o centro de um quadro branco (meia caixa de cada lado).
  Na bancada das 16 caixas, o Vision passou a ler 「あーでも」 na ordem certa (3/4 variantes; antes 「であも」,
  descartado) e 「あ」 isolado da pág. 07. Dividir colunas verticais por projeção de tinta não acrescentou nada
  e ficou de fora.
- **Leitura parcial**: caixa do detector cujas palavras cobrem < 60% do seu lado longo (coluna esquecida num
  balão de várias colunas — 24 de 312 caixas nas 24 páginas, ~10 delas parciais de verdade) entra na mesma
  chamada. Só troca os parágrafos por uma leitura concordada **mais longa que os contém** (`OcrReread.extend`):
  「でも」 → 「うん……でも」, 「や」 → 「いいや」. Parágrafo que sai da caixa nunca é substituído.
- **Reticências**: na votação, "…", "……" e "..." são a mesma leitura (as variantes discordavam só no número
  de pontos e nenhuma vencia).

Resultado real: 「うん……でも」 → "É... mas...", 「あーでも」 → "Ah, mas...", 「いいや」 → "Não". Continuam sem
leitura 「つ」 e balões só de reticências (corretamente sem tradução).

## Montagem do OCR: leituras chutadas, onomatopeias e reparos (2026-11-17)

Regras de classe, todas medidas no portão offline (`CorpusOcrReplayTest`, 50 páginas do corpus):

- **Leitura chutada** (`OcrParagraph.isGuess`): um parágrafo com confiança média por palavra abaixo de 0,5, de
  qualquer tamanho, fica como desenho. Caíram 4 leituras-lixo; fala real do corpus lê a 0,56 ou mais.
- **Palavra repetida embaixo do balão** (`OcrRegionGrouper.continuesSpeech`): uma linha fora da caixa do balão só
  continua a fala se tiver duas palavras diferentes. "Clap Clap" é onomatopeia.
- **Travessão lido como `_`** (`LetteringRepair.dashes`): só em letreiramento todo em maiúsculas, entre letras
  ("RIO_I MUST" → "RIO—I MUST"). Nomes de arquivo em minúsculas ficam como estão.
- **Aspas angulares** (`LetteringRepair.quotes`): "<<" e "»>" colados a uma palavra viram « e ».
  Comparações e setas ficam como estão.

### Limites conhecidos

- **Furigana:** no Ubunchu! a leitura em kana ao lado do kanji é a piada ("迷宮" lido "ディレクトリ"). Tirá-la do texto
  perde o sentido, e uma coluna estreita de fala ("あんた") foi confundida com leitura. A leitura continua no texto.
- **Letra capitular** ("T" decorado de "TABU", Jungle 117): o Vision não a lê, então a legenda sai como
  "ABU..." e o "T" fica desenhado ao lado. Corrigir pede reler a mancha da capitular.
