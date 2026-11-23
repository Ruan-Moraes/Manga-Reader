# Fidelidade — Ubunchu! cap. 1: original japonês × edição inglesa × nossa saída pt-BR (2026-11-15)

Confronto feito à mão, página a página, entre o OCR das páginas japonesas (`ubunchu01_ja`, 00–11), o OCR da edição
inglesa RtL (`ubunchu-en/ch01`) e a tradução pt-BR da rodada 2 (`.local/bench/out-load2`). Obras: *Ubunchu!* © Hiroshi
Seo, original sob CC BY-NC 2.1 JP e edição inglesa sob CC BY-NC-SA; imagens fora do repositório, aqui só trechos
curtos para identificar cada caso.

Correspondência de páginas: ja `01` = capa (en `01a`); ja `02`…`11` = en `02`…`11`. A nota do autor (ja `00`) não tem
par na edição inglesa; a `01b` inglesa (instruções de leitura RtL) não existe no original.

## Veredito

A história chega inteira e o sentido geral se mantém em todas as páginas. **Os desvios de sentido vêm de três
fontes**, só as duas primeiras são nossas:

1. **OCR que se propaga** (nosso): "IS" lido "15", "I" com serifa lido "/", palavras desenhadas lidas como texto.
2. **Escolha de palavra errada para o contexto** (nosso, tradutor): homônimos sem contexto (*play*, *Wine*, *manager*,
   *launch*).
3. **Adaptação da própria edição inglesa** (não é bug): frases que já divergem do japonês no inglês; traduzimos o
   inglês fielmente.

## 1. Erros de OCR que chegam ao leitor

| Pág. | Japonês (sentido) | Inglês lido | pt-BR gerado | Situação |
|---|---|---|---|---|
| 02 | "minha recomendação é Ubunchu" | MY RECOMMENDATION **15**… | MINHA RECOMENDAÇÃO 15… | aberto → camada Gemini (passo 6) |
| 05 | "instalar Linux não é tão fácil" | **15** NOT THAT EASY! | 15 Não é tão fácil assim! | aberto → Gemini |
| 07 | "Ubuntu é só Linux, no fim" | UBUNTU **15**…. | UBUNTU 15…. | aberto → Gemini |
| 11 | "isto é…" | THIS **15**… | Isto é… | o tradutor já acertou sozinho |
| 11 | "concordo" | **/** AGREE! | / Concordo! | **corrigido** (`LetteringRepair`) |
| 04 | "aí é só dar clique duplo" | ..THEN **/** THINK YOU… | AÍ / ACHO QUE… | limite: `/` no meio da frase não é reparado (ambíguo com "CLI / GUI") |
| 01 | autor 瀬尾 浩史 | **WE** BY HIROSHI SEO | WE, de Hiroshi Seo | **corrigido** (palpite de baixa confiança descartado) |
| 06 | revista "Ubuntu特集" | **L**ubuntu Guide | Guia Lubuntu | aberto (OCR do desenho) |
| 07 | onomatopeia de dor | **owl** OW! | coruja AI! | aberto; SFX desenhado lido como palavra |
| 11 | resto de letreiro | had | teve | aberto (fragmento) |

## 2. Palavra errada para o contexto (tradutor)

| Pág. | Inglês | pt-BR gerado | Deveria ser | Causa |
|---|---|---|---|---|
| 08 | PERHAPS IT WILL BE ABLE TO **PLAY**… | Talvez consiga **tocar**… | …rodar/jogar (os jogos) | *play* sem o contexto dos balões vizinhos |
| 08 | IF YOU USE **WINE**… | SE VOCÊ USAR **VINHO**… | …usar o **Wine** | nome de software em caixa alta |
| 06 | IT IS THE NETWORK **MANAGER** | É o **gerente** de rede | É o **Gerenciador** de Rede | nome de programa |
| 09 | …TIME TO **LAUNCH** THAT TERMINAL… | É hora de **lançar** aquele seu terminal? | …de **abrir** aquele seu terminal? | calque |
| 02 | **NO WAY!!** (= "rejeitado!") | Não acredito!! | De jeito nenhum!! | sentido de recusa perdido |
| 02 | Isn't it Ubuntu not Ubunchu? | Não é Ubuntu e não Ubunchu? | É Ubuntu, não Ubunchu. | nota do tradutor mal formada no inglês |
| 06 | smile smile (SFX) | sorria sorria | manter o desenho | onomatopeia traduzida como verbo |
| 08 | Win (rótulo na tela) | Vencer | manter o desenho | **corrigido** (texto desenhado fora de balão fica) |
| 05 | bin (rótulo desenhado) | lixeira | manter o desenho | **corrigido** (idem) |
| 09 | case_Wellcome.pdf | caso_Wellcome.pdf | manter | **corrigido** (nome de arquivo protegido + texto de tela fica) |

## 3. Adaptações que já estão na edição inglesa (não são bug nosso)

- 05: "aproveite seu computador **infantil** baseado em texto" — o japonês é "vá curtir sua juventude escura com o
  terminal"; o "childish" é do inglês.
- 07: "VELHOS E ABAFADOS LABORATÓRIOS UNIX" — frase acrescentada pela edição inglesa; a nossa versão é literal e soa
  dura (naturalidade, não fidelidade).
- 08: "ISTO É UMA PROPRIEDADE PRIVADA!!!!" — o japonês é "uma coisa dessas no clube?!"; a edição inglesa adaptou.
- 11: "Eu sou por causa da minha comunidade" — o japonês diz "o significado é 'o laço entre as pessoas'"; o inglês
  usou a definição oficial de *ubuntu*. Coerente com a obra.
- 11: "Embora ela seja persistente" — o japonês é "desculpe a insistência, mas é Ubuntu"; o inglês já distorceu.

## 4. Forma

- Aspas com espaço dentro: `" Ubuntu "` (11) — o tradutor devolve espaços em volta de termo protegido. **Corrigido**
  (`TranslationEnvelopeCodec`: termo protegido entre um par de aspas é colado a elas).
- Caixa alta inconsistente: falas em CAIXA ALTA no inglês saem ora em caixa alta, ora em caixa normal.
- "Stop talking at the same time**l**" (02): o "!" lido como "l" virou ponto final — perde o tom.

## Resultado com a camada Gemini (`gemini-3.8-flash`, mesma noite)

Todos os itens da seção 1 marcados "→ Gemini" e os da seção 2 (*play*, *Wine*, *manager*, *launch*, *no way*) saíram
certos. A nota "Isn't it Ubuntu not Ubunchu?" virou "Não é Ubuntu em vez de Ubunchu?" (melhor, ainda dura).
Detalhes em [`auditoria-rodada-2-2026-11-15.md`](auditoria-rodada-2-2026-11-15.md#camada-gemini--validação-real-12-páginas-2026-11-15).

## O que fazer com isto

- Itens 1 (IS→15) e 2 (*play*, *Wine*, *manager*, *launch*, *no way*) são exatamente o alvo da camada Gemini: usar esta
  tabela como gabarito da validação do passo 6.
- "Wine", "Network Manager", "Synaptic" e afins **não** vão para o glossário global: "WINE" numa obra sobre vinho
  seria o vinho. Contexto é trabalho do refinamento, não de lista fixa.
- Revisão humana continua necessária para naturalidade (seção 3) antes de publicar.
