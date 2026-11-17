# Auditoria — rodada 2 (Ubunchu! cap. 1, en→pt-BR) — 2026-11-15

Versão enxuta da auditoria visual da 2ª execução das 12 páginas. Só defeitos concretos e o que fazer.
Roteiro geral do trabalho: [`auditoria-2026-11-15.md`](auditoria-2026-11-15.md).

## Veredito

Melhora grande sobre a rodada 1 (falas recuperadas, sem resíduos pretos nem grandes apagamentos); **12/12 páginas
entregues**. **Ainda não publicável**: tipografia de capa/instruções, política de SFX/letreiros e alguns erros de
segmentação. A comparação foi só entre saídas traduzidas — **fidelidade à obra não confirmada** (falta confronto com a
edição original).

## Já resolvido (não reabrir)

- **Falha da página 05** (`internal-error`): causa encontrada — o render local recusava uma 2ª página simultânea
  (`render-busy`). Agora a página espera a vez; 12 páginas em 3 lotes paralelos → todas `READY`. Falhas engolidas
  passaram a ter log seguro (`FailureDiagnostics`).
- `ocr-unavailable` em lote: conexão gRPC ociosa reaproveitada (corrigido: idle timeout + keepalive).
- Capa: logo "Ubunchu!" apagado e pinguim borrado (corrigido no agrupamento).

## Defeitos acionáveis

### Tipografia e reflow
- **Capa (01a):** título traduzido grande demais (pesa sobre a arte); linha do autor duplicada
  ("Hiroshi Seo BY HIROSHI SEO" — o nome japonês 瀬尾 浩史 lido como "WE"); URL quebrada em `http:` / `//…`;
  créditos densos sobre a arte.
- **Instruções (01b):** o parágrafo inteiro saiu em fonte pesada com contorno (tratado como letreiro) e sem
  respiro entre frases; deveria ser texto comum em caixa.
- **Peso tipográfico:** alguns balões em negrito pesado ao lado de outros regulares sem ênfase no original (09).

### Letreiros e SFX sem política única
Ficam em inglês: "The Command Line", "No Youtube!", "Rocks!", "The Beast!" (03); "Twack",
"Clickty-tap-clack-key", "Swish", "Shoo" (04); "BEEP", "CLICK FINISH?" (05); "We must $wget make make install!" (06);
"UBUNTU IS…" (07). Decidir uma regra: preservar o desenho **ou** traduzir com fonte pesada — e aplicar igual em
todas as páginas.

### Segmentação / OCR
- "15 Não é tão fácil assim!" (05) e "Este 15…" (11): "15" é o OCR lendo "IS".
- "Jingle do Drumbeat 3!" (05): provável efeito sonoro lido como fala.
- "…é o único / A ÚNICA RESPOSTA ACEITÁVEL!!" (03): fala partida em duas regiões.
- "/ Concordo!" (11) e "Aleatório" isolado (08): resto de OCR ou rótulo traduzido como fala.
- "ush" (05): sobra de "bash" desenhado.

### Texto de interface / código
Terminal (05) e "Nome de usuário" (10): tratar como interface, não como diálogo; nunca traduzir comandos.

### Naturalidade (revisão humana ou camada de linguagem)
"computador infantil baseado em texto" (05), "VELHOS E ABAFADOS LABORATÓRIOS UNIX" (07),
"garotas de anime sensuais" (08).

### Não é bug até confrontar com a original
Desktop "quebrado" (09) faz parte da história; quadros sem fala (10).

## Correções aplicadas depois desta auditoria (2026-11-15, noite)

Todas gerais (nada específico de Ubunchu!), com teste unitário e regressão visual (`RealPageRegressionTest`, agora com
16 páginas reais: entraram 01b, 03, 05, 07, 08, 09, 10, 11 da edição en).

| Defeito | Status | Como |
|---|---|---|
| Instruções 01b em fonte pesada | **corrigido** | letreiro só quando a tinta não está quase toda em caixa/papel liso (`ORDINARY_LETTERING_INK` .9); senão texto comum |
| Política de letreiros | **corrigido** | frase desenhada (≥ 2 palavras distintas, maioria do léxico) é traduzida; onomatopeia (1 palavra, repetida, ou o mesmo som lido duas vezes: "owl OW!") fica desenhada |
| URL quebrada `http:` / `//…` | **corrigido** | `UnbrokenSpanBreaks`: nunca quebra dentro de URL, e-mail ou caminho; se não couber, a fonte diminui |
| Autor duplicado ("WE BY HIROSHI SEO") | **corrigido** | parágrafo curto em que toda palavra é palpite (confiança < .5) sai antes do agrupamento: era 瀬尾 浩史 forçado para inglês |
| Terminal (05), ícones e telas (09), "bin", "Win", "UN" | **corrigido** | região que o detector não vê como texto, fora de balão e que não é frase fica desenhada (`drawnHints`) |
| Nomes de arquivo traduzidos ("caso_Wellcome.pdf") | **corrigido** | nome de arquivo e `snake_case` protegidos na tradução |
| "/ Concordo!" (11), "/ THINK…", "THEN / THINK" (04, 10) | **corrigido** | `LetteringRepair` (en): `/` ou `|` isolado abrindo frase, ou depois de conjunção/advérbio de abertura ("THEN", "SO"…), antes de palavra maiúscula, é o "I" com serifa; "AND / OR", "YES / NO" e "CLI / GUI" ficam |
| "ush" (05) | **corrigido** | idem texto de tela (fica desenhado) |
| "…é o único / A ÚNICA RESPOSTA…" (03) | **não é bug** | no original são falas separadas ("WINDOWS XP…!!" / "SLACKWARE…!!" / "…IS THE ONLY ACCEPTABLE ANSWER!!") |
| "Aleatório"/"Shuffle" (08) | **corrigido** | era onomatopeia: texto livre de uma palavra que é som do idioma (`lexicon/en-sounds.txt`, também formas esticadas e cadeias como "Clickty-tap-clack-key") fica desenhado |
| "stop!" com remendo branco no degradê | **corrigido** | o preenchimento segue o fundo (interpola as bordas de cada trecho), em vez de uma cor só |
| Parágrafos do 01b colados | **corrigido** | parágrafos longos do OCR mantêm a linha em branco; cada parágrafo vai como peça própria ao tradutor e volta junto |
| Aspas com espaço (`" Ubuntu "`) | **corrigido** | termo protegido entre um par de aspas é colado a elas |
| "15" no lugar de "IS" | **corrigido com Gemini** | 4 de 4 casos lidos de novo como "IS" pela camada de linguagem (ver abaixo) |
| "Jingle do Drumbeat" (05) | limite | descrição de som em palavras (`text_free`); indistinguível de legenda sem contexto visual |
| "やんのかゴラァ" (ja) | **corrigido** | grito só em kana com partícula (の, か, よ…) é frase e vira letreiro traduzido; som sem partícula ("きゅう", "ひゅるる") ou repetido fica desenhado |

Fidelidade com o original japonês: [`fidelidade-cap1-2026-11-15.md`](fidelidade-cap1-2026-11-15.md).

### Achado no render real: balões partidos com páginas em paralelo

O detector de balões tinha capacidade 1 e recusava na hora a 2ª página simultânea; a falha era engolida e a página
caía no agrupamento por proximidade (08: "DON'T YOU PLAY ANY" / "NORMAL GAMES?!" traduzidos separados, "Não toque
nada"). Agora a página espera a vez (até 60 s) e a falha é logada com `FailureDiagnostics`. Mesmo defeito do
`render-busy`; explica parte da variação entre rodadas.

### Camada Gemini — validação real (12 páginas, 2026-11-15)

- **Bloqueios encontrados:** a API Vertex AI não estava habilitada no projeto (habilitada com autorização do dono) e
  o modelo padrão `gemini-2.5-flash` não é acessível para projetos novos (404 em `us`, `global`, `us-central1`).
  Padrão trocado para `gemini-3.8-flash` (GA, responde em `us`). Com a API desligada o fallback funcionou: 12/12
  `READY` só com o Google.
- **Resultado com `gemini-3.8-flash`:** 12/12 `READY`; 279 regiões, 246 ajustadas (88%), 17 leituras do OCR corrigidas, 23
  propostas rejeitadas por região (quebravam as regras: termos, tamanho, leitura reescrita). Gabarito de
  [fidelidade](fidelidade-cap1-2026-11-15.md): "IS"→"15" (4/4), *play*→"rodar", *Wine* mantido, *launch*→"abrir",
  *no way*→"DE JEITO NENHUM!!", "Network Manager" mantido, "bush"→"bash", caixa alta do original respeitada.
- **Defeitos do modelo:** traduzia onomatopeias que o Google deixara como desenho ("Swish Swish"→"Balança
  balança"), o que fazia o render retipá-las — agora rejeitado em código (`TranslationRefinement.sound`) e pedido no
  prompt. Variação entre execuções: numa saiu "servidora dessas" e "ISSO É PRIVACIDADE", na seguinte "SERVIDOR
  ASSIM" e "PROPRIEDADE PRIVADA" — revisão humana continua necessária.
- **Prompt reforçado (2026-11-15, noite):** concordância de gênero segue o substantivo, não quem fala; expressões
  fixas mantêm o sentido inteiro. Na 08, três execuções seguidas: "SERVIDOR ASSIM" e "PROPRIEDADE PRIVADA" nas três.
- **Estado final no modo padrão (sem Gemini):** 12/12 `READY`; páginas `OK` passaram de 2 para 4 (02, 07, 08, 10)
  com o campo `kept` (texto desenhado de propósito não pede revisão). Restavam 16 regiões não renderizadas em 8
  páginas; com as cadeias de sons e "SIGH" na lista, "Clickty-tap-clack-key" (04) e "SIGH" (03) também ficam
  desenhados (14, medido nos testes, não numa nova execução real). O resto: texto real sobre a arte ("RtL Edition", "Club President", "...WE WILL NEVER EVER…"), interjeições
  ("Ouch!") e restos de interface ("VPN Mobile", "dd/Remove Progr").
- **Recomendação:** ligar a camada para en→pt-BR depois de nova `disclosure.version`; padrão do código segue
  `disabled`.

## Próximos passos (ordem)

1. Letreiro só para **frases sobre a arte**, não para blocos de texto dentro de caixa (corrige 01b); capa com
   título, autor, URL e créditos como campos separados.
2. Política única de SFX/letreiro, aplicada em todas as páginas.
3. Erros que o OCR repete ("IS"→"15"): validar a camada Gemini (já implementada, desligada) com 3–4 páginas reais.
4. Classe de interface/código para terminal e telas.
5. Confronto com a edição original antes de afirmar fidelidade.

### Regiões sem render — análise por classe (2026-11-16)

Medido com uma bancada que renderiza com o LaMa real (`.local/bench/render/RealRender.java`), não só com a caixa
branca da regressão. 15 regiões em 8 páginas, em 4 classes:

| Classe | Casos | Causa | Decisão |
|---|---|---|---|
| A. Texto real em papel liso | autor/URL, "RtL Edition", "Rev 03" (capa), "…WE WILL NEVER EVER…" (11) | (1) um símbolo sem glifo na fonte latina ("♥") recusava a região inteira; (2) sem mediana de fonte na página (poucas regiões) o resgate para o papel liso nem era tentado; (3) no caminho com reconstrução da arte o texto ficava preso à caixa do OCR, embora a área reconstruída seja maior | **corrigido**: símbolo (nunca letra) vem de outra fonte embutida; sem mediana, texto que não coube é resgatado até a fonte mínima se a caixa comporta uma letra; texto pode usar toda a área reconstruída |
| B. Rótulos desenhados na arte/interface | "Club President", "VPN Mobile", "Options", "CLI-based", "dd/Remove Progr", "and" | fazem parte do desenho (braçadeira, botão, gráfico) | **aceito** — ficam no original |
| C. Som/interjeição desenhada | "Ouch!", "mm… mm..", "SIGH" | interjeições desenhadas como efeito | "Ouch!" **corrigido** (interjeições desenhadas na lista de sons, só fora de balão); "SIGH" num balãozinho e "Imm…" (OCR) ficam |
| D. Terminal | ":: then enter the text…" | classe do detector diverge (não sai como `unknown`) | limite |

Render real das 12 páginas depois disso: 12/12 `READY`, páginas `OK` de 4 para **7** (01a, 02, 04, 07, 08, 10, 11);
regiões sem render de 15 para **11**, quase todas da classe B.

### Validação em duas obras (2026-11-16)

| Obra | Páginas | Regiões | Sem render antes → depois | Observação |
|---|---|---|---|---|
| Ubunchu! cap. 3 (nunca usado para calibrar) | 12/12 `READY` | 303 | 11 → 10 | nenhuma fonte < 12: alta resolução intacta |
| Jungle Comics (anos 1940, domínio público, 975 px) | 3/3 `READY` | 30 | 9 → 6 | fonte mínima por região (política `clean-box-1.2`) |

A tradução da 2ª obra saiu boa (nomes, caixa alta e sentido corretos). O que ela revelou e Ubunchu! não tinha:
fonte mínima fixa grande demais para scan pequeno (corrigido), balões estreitos e altos onde palavras longas do
português não cabem (hifenização) e o detector de balões rejeitando a página inteira por uma detecção ruim.

Depois (bancada com LaMa real, sem cota): detector agora aceita ultrapassagem de borda < 1 px (a pág. 15 tinha uma
caixa em 499,2 numa página de 499) e a hifenização entrou como último recurso da página ("Tecnica-mente",
"Vice-presi-dente"). Os dois balões estreitos da Jungle 16 continuam sem render por **outra classe**: a máscara do
balão não acha fundo limpo (tinta cercada 0,00, caixa útil 0×0) porque a cor estimada não bate com o papel
amarelado e ruidoso do scan (JPEG q60) — próximo item. Ubunchu! cap. 3 ficou estável (10 sem render, nenhuma
fonte < 12). A execução real completa ficou para depois: a cota diária local (100 páginas/dia) acabou.

### Auditoria do cap. 3 (P0/P1) — andamento (2026-11-16)

- Cota diária não aplicada no dev local (`GATEWAY_QUOTA_ENFORCED=false` em `dev-api.sh`; produção e contrato 20/100
  intactos). Execução real das duas obras feita: Ubunchu! cap. 3 estável (10 sem render); Jungle 8 de 32.
- **P11-02 corrigido** (letras soltas "M", "N", "fo"): a máscara agora reconhece letra pela tinta escura — borrão
  escuro ≥ 60% dentro do polígono que não alcança a borda da janela por tinta escura — e limpa a auréola clara
  (¼ da altura da letra); só em regiões já ≥ 75% reconhecidas como texto em caixa lisa, então efeitos e letreiros
  sobre a arte não mudam (regressão de 16 páginas sem diferença). A caixa útil é composta com e sem as letras
  completadas e fica a de fonte maior.
- **P11-03**: não é bug (área já vazia no original).
- **P01-02 diagnosticado, não corrigido** (letreiro com contorno branco da capa): a máscara do LaMa é o retângulo
  da caixa do OCR; o contorno branco (~13 px) fica fora dela e o modelo o usa como contexto, reconstruindo letras.
  Testado e descartado: margem proporcional (apaga traços da arte vizinha, ghost continua), colagem por crescimento
  (sem efeito), reconstrução em pedaços (o modelo "completa" letras). Correção certa: máscara no formato do letreiro
  (tinta + contorno claro ligado a ela), o que muda a interface do inpaint e o protocolo do modo isolado.
- **P03-03 corrigido** (nota de rodapé partida em "You" / "may" / "see" / resto): o Vision devolve parágrafos
  separados numa mesma linha e o teste de tamanho os afastava (a caixa de "may", com descendente, tem o dobro da
  altura de "see"). Agora fragmentos de **uma linha** se juntam quando se sobrepõem na vertical (≥ ½ da menor
  altura), o vão é de um espaço de palavra (≤ 0,6 da maior altura **e** ≤ a largura de um caractere) e não se
  cobrem (o próximo termo de uma linha nunca invade o anterior). Só sequências de linhas únicas: fala de várias
  linhas não cresce de lado. Bancada de agrupamento (cache do Vision, 13 páginas em inglês + 24 em japonês): só o
  rodapé do cap. 3 muda; efeito sonoro ao lado de fala ("clatter") e texto de terminal continuam separados.
- **P03-01** (diálogo de erro em fragmentos): diagnosticado, não corrigido — mesma família, mas são linhas
  empilhadas de UI; fica como limite.
- **Erros de leitura — dois são do original**: o balão diz literalmente "SO NAVY!!" (OCR 0,99) e o logo é desenhado
  "Japnese Team" (o OCR leu "Japmese", 0,84; na pág. 10 o próprio quadro corta "Tea"). Só **"The Endo"** é erro de
  OCR: o ponto final desenhado como bolinha virou "o".
  - Camada Gemini (prompt passa a citar a classe "pontuação tomada por letra e colada à palavra, ou o inverso", sem
    exemplo do caso): execução real das 4 páginas → **"The Endo" vira "Fim"**. "NAVY" saiu "marinha" (o modelo
    traduziu literalmente mesmo com "NAIVE" no quadro seguinte) e "Japmese" fica, porque palavra capitalizada fora
    do dicionário é nome protegido — é esse guarda que impede o modelo de apagar nomes reais. Uma regra de prompt
    para "erro de grafia do próprio original" foi testada e retirada (não resolveu e arrisca trocadilhos).
  - Limite registrado: erro de grafia no letreiro original não é corrigido automaticamente.

### Máscara do letreiro, diálogo de UI e scan antigo (2026-11-16)

- **P03-01 (diálogo de erro)** — causa real: não era só fragmentação. O agrupamento dá regiões separadas, mas a caixa
  da primeira linha do diálogo engloba as linhas da segunda; a **releitura** recortava a caixa inteira e puxava o
  texto vizinho, e a mesma frase ia para a página duas vezes, uma sobre a outra. Agora uma região cujo recorte
  contém palavras de outra (dona = a menor caixa que contém o centro da palavra) não é relida e fica com a leitura
  do provedor. Execução real: frase única, fonte maior. Fica: restos do original ("inter", "se") entre as letras do
  "ERROR!", que o OCR não leu.
- **Scan antigo (Jungle)** — duas classes:
  - papel ruidoso (retícula + JPEG): a distância típica ao fundo é 34–37, contra 0–3 em páginas digitais, e o
    limite fixo de 30 via ⅔ do papel como arte (caixa útil 0×0). A página é medida (mediana do desvio de cada pixel
    à média 3×3: Jungle 8–19, Ubunchu/Theft 0–3); **só em página ruidosa** (≥ 5) a tolerância de fundo segue o ruído
    do papel da região (2× a mediana, 30–75). Medir só a região confundia arte com papel (efeitos sonoros sobre a
    arte passavam a ser redesenhados);
  - letras do original de 12 px numa legenda estreita com tradução 50% mais longa: a fonte mínima igual ao
    original não cabia. **Último recurso**, depois da caixa ampliada e da hifenização: até ¾ do tamanho do
    original. Como regra geral reduzia regiões que antes cabiam ampliadas (13→11, 11→9), por isso ficou por último.
  - Execução real: Jungle 16 de 5 para **3** sem render (2 são logotipos); Jungle 15 de 6 para **4**. O balão
    "YOU HAVE SERVED ME…" continua: no scan, "SUBJECTS" encosta no contorno do balão e a máscara o vê como arte.
  - Regressão de 16 páginas: "Club President" (cap. 1, p. 3) passa a ser traduzido (antes ficava em inglês);
    fixture regravada.
- **P01-02 (máscara do inpaint no formato do letreiro)** — o modelo recebe a caixa mais o contorno claro das letras
  ligado a ela (cor do contorno = mediana do décimo mais claro da caixa; cresce só por pixels a ≤ 30 dessa cor, até
  30% do lado menor da caixa, máx. 32 px; nunca por tinta escura). Os pixels do contorno são sempre substituídos
  (branco→rosa muda só ~60, abaixo do limiar de colagem, e ficavam letras ocas). Sem contorno quando a faixa em
  volta da caixa tem a mesma cor (letras escuras em balão branco): primeiras versões espalharam a máscara pelo
  papel e o modelo inventou textura nos balões — pego pela bancada LaMa real antes/depois em 17 páginas. A
  geometria continua dependendo só da caixa: o protocolo do modo isolado não muda.
  - Resultado: capa do cap. 3 sem os fantasmas de "TIME FOR THE FORUMS"; créditos da capa do cap. 1 mais limpos;
    demais páginas iguais. Fica: "DEBUT!?" sobre o cabelo (caixa de 1522 px → janela da página inteira reduzida 5×
    para 512; é resolução, não máscara).

### Letra presa ao contorno, letreiro largo e restos do diálogo (2026-11-16, tarde)

- **Letra presa ao contorno do balão (scan antigo)** — no balão "YOU HAVE SERVED ME…" (Jungle 16) o grão do papel
  liga "SUBJECTS" à borda, e a varredura "fora do balão" (pixels não-fundo ligados à borda da janela) levava a
  palavra junto com a borda. Em página ruidosa, essa varredura não passa por gargalos de 1–2 px entre pixels de
  fundo; o anel vizinho do que foi alcançado é devolvido, então a borda continua inteira. Caixa útil 5×121 →
  71×121; o balão é traduzido; Jungle 16 fica só com os 2 logotipos sem render. Página limpa não muda (testado
  ligar em todas: "stop!" perdia tamanho).
- **Letreiro largo (P01-02, "DEBUT!?")** — o inpaint agora:
  - divide em até 4 pedaços ao longo do lado maior quando uma janela só o reduziria mais de 4× (a linha de 1522 px
    ia ao modelo 5× menor); cada janela mascara **todo** o letreiro que contém (um vizinho visível é "completado"
    pelo modelo) e escreve só o seu pedaço; com limite de 1,5× uma faixa fina de papel ficava sem contexto e o
    modelo a pintava de cinza;
  - calcula a máscara sempre na página **original**: peça a peça, sobre a página já limpa, a cor do contorno
    mudava e o resto do contorno ficava fora (era a causa real dos fantasmas sobre o cabelo);
  - o contorno segue só até a **própria espessura** (mediana das faixas de contorno que saem das bordas da tinta:
    13 px no título, poucos px no brilho dos créditos) — crescer pela caixa engolia a barriga branca do mascote
    meio dentro do bloco de créditos (cap. 1, p. 1);
  - o buraco é o retângulo do letreiro com o contorno (lados até o percentil 75 do alcance), dilatado pela borda
    suavizada: um buraco com a silhueta das letras voltava como traços claros no lugar delas;
  - a folga do contorno segue a altura das letras (bandas de tinta), não o tamanho da caixa.
  - Testado e descartado: zerar a área mascarada na entrada (sem efeito: o export já faz); exigir que o contorno
    "envolva" as letras (a medida saiu invertida: título 0,46, créditos 0,84).
  - Bancada LaMa real em 17 páginas: capa do cap. 3 limpa nas três partes; demais iguais ou um pouco mais limpas.
    Execução real (worker, modo local em processo): capa do cap. 3 sem fantasmas. O protocolo isolado continua com
    7 inteiros de geometria (só depende da caixa); máx. de janelas por página 8 → 16. Coberto por testes de
    unidade; o ponta a ponta isolado fica pulado neste ambiente.
- **Restos no diálogo de erro (P03-01)** — diagnosticado, não corrigido: "inter", "se", "r" estão encostados
  diretamente no traço preto do "R" gigante (não presos por ruído, nem fundo dividido). Separar pixel de letra de
  pixel de traço quando se tocam pede análise de espessura de traço; fica como limite.

### WebP, token partido, Gemini e pares novos (2026-11-16, noite)

- **Páginas WebP perdiam os balões** — a detecção de balões e a releitura do OCR liam a página com `ImageIO`, que
  não lê WebP (devolvia null → `layout-invalid-response`, agrupamento por proximidade, releitura pulada). Agora um
  leitor único (`PageRasterReader`) usa o mesmo `dwebp` fixado por hash do render (WebP não confiável nunca é
  decodificado no processo); a leitura espera a vez no slot nativo em vez de falhar. Execução real com duas páginas
  WebP: nenhuma falha de detecção.
- **"pok" na fala (cap. 2, p. 6)** — o parágrafo do terminal "pok:/usr$ ls -la" era dividido pela caixa folgada do
  balão no meio de um token sem espaço. Em escritas com espaço, um parágrafo só é dividido onde o OCR viu quebra
  entre palavras; o token inteiro vai com a palavra mais longa. Japonês (sem espaços) não muda. Bancada: corrige
  também um caminho de terminal partido no cap. 2, p. 10.
- **Gemini e deslize do original ("NAVY")** — regra de prompt para deslize evidente do letreiro que a própria página
  corrige (um falante repete ou corrige a palavra): traduz-se a palavra pretendida; trocadilho e nome ficam.
  Execução real: "Eu nunca seria tão inocente!!", coerente com "Ino... inocente..." do quadro seguinte; controles
  ("Japmese", "Fim.") iguais.
- **Pares novos** — en→ja/ko/zh-Hans e ja→en rodados de ponta a ponta: legíveis, quebra de linha por idioma, texto
  horizontal. Origem coreana segue sem dicionário para a releitura (só confiança do provedor).
- **Restos no diálogo de erro (cap. 3, p. 3)** — continua: separar tinta da letra de tinta do "R" exige a geometria
  de cada palavra no render (hoje só o polígono da região chega lá), o que muda o manifesto do OCR.

### Espanhol: palavras grudadas e letreiro contornado na borda (2026-11-16, noite)

Reproduzidos com uma página sintética neutra (es→pt-BR), sem material de terceiros.

- **Palavras grudadas pelo OCR ("Nomeyalos")** — em letreiro apertado o Vision lê "Nome y a los" como uma palavra
  só (nas leituras em cache ele nunca devolve duas palavras de letras sem quebra entre elas: 0 de 1268 pares). A
  palavra grudada, com maiúscula e fora do dicionário, passava por nome próprio e ia intacta para a página. Novo
  passo do OCR (`GluedWords`): corta uma palavra fora do dicionário quando ela começa com um nome que aparece
  **sozinho em outro ponto da mesma página** e o resto se decompõe em até 4 palavras do dicionário. Sem lista: um nome
  como "Gabriela" nunca é partido (a menos que "Gabri" apareça sozinho na página). Escritas sem espaço não mudam.
- **Letreiro contornado cruzando a borda do balão** — a palavra que encosta no contorno preto do balão ficava (a
  máscara a tomava por arte, ligada à borda da janela). Agora, quando as letras já reconhecidas da região têm cores
  próprias (preenchimento colorido, contorno) que a arte em volta não usa, a tinta dessas cores dentro do polígono é
  letra, com a franja de suavização junto; a borda (cores da arte) fica. Exige paleta da arte conhecida (sem arte em
  volta nada muda) — sem essa trava, texto sobre degradê ganhava remendo chapado. Texto preto encostado em arte preta
  (paletas iguais) continua como estava: é o caso do "ERROR!" do cap. 3, que segue como limite.
  - Resta: onde a letra saía do balão, a limpeza pinta com a cor do balão (ponto branco sobre a arte).
- **Fragmentos soltos ("…bién?!")** — não reproduzido com texto limpo ("¿Eh?! ¿Yo también?!" → "Hã?! Eu também?!");
  depende de como o OCR parte o letreiro estilizado.
