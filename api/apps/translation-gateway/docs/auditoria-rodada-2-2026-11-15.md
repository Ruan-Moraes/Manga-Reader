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
| "/ Concordo!" (11), "/ THINK…" | **corrigido** | `LetteringRepair` (en): `/` ou `|` isolado abrindo frase antes de palavra maiúscula é o "I" com serifa |
| "ush" (05) | **corrigido** | idem texto de tela (fica desenhado) |
| "…é o único / A ÚNICA RESPOSTA…" (03) | **não é bug** | no original são falas separadas ("WINDOWS XP…!!" / "SLACKWARE…!!" / "…IS THE ONLY ACCEPTABLE ANSWER!!") |
| "Aleatório"/"Shuffle" (08) | **aceito** | rótulo de interface (`text_free`), traduzido como previsto |
| "stop!" com remendo branco no degradê | **corrigido** | o preenchimento segue o fundo (interpola as bordas de cada trecho), em vez de uma cor só |
| Parágrafos do 01b colados | **corrigido** | parágrafos longos do OCR mantêm a linha em branco; cada parágrafo vai como peça própria ao tradutor e volta junto |
| Aspas com espaço (`" Ubuntu "`) | **corrigido** | termo protegido entre um par de aspas é colado a elas |
| "15" no lugar de "IS" | **corrigido com Gemini** | 4 de 4 casos lidos de novo como "IS" pela camada de linguagem (ver abaixo) |
| "Jingle do Drumbeat" (05) | limite | descrição de som em palavras (`text_free`); indistinguível de legenda sem contexto visual |
| "やんのかゴラァ" (ja) | limite | grito só em kana e curto não vira letreiro; agora fica desenhado (antes saía retipado com resíduo) |

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
- **Recomendação:** ligar a camada para en→pt-BR depois de nova `disclosure.version`; padrão do código segue
  `disabled`.

## Próximos passos (ordem)

1. Letreiro só para **frases sobre a arte**, não para blocos de texto dentro de caixa (corrige 01b); capa com
   título, autor, URL e créditos como campos separados.
2. Política única de SFX/letreiro, aplicada em todas as páginas.
3. Erros que o OCR repete ("IS"→"15"): validar a camada Gemini (já implementada, desligada) com 3–4 páginas reais.
4. Classe de interface/código para terminal e telas.
5. Confronto com a edição original antes de afirmar fidelidade.
