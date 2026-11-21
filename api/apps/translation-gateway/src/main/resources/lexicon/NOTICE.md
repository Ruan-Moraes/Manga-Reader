# Listas de palavras (léxico do OCR)

`en.txt`, `es.txt` e `pt-BR.txt` são as 50 mil palavras mais frequentes de cada idioma, em ordem de
frequência, derivadas de **FrequencyWords** (Hermit Dave), lista `content/2018/<idioma>/<idioma>_50k.txt`,
construída a partir do corpus OpenSubtitles2018 (OPUS).

- Fonte: https://github.com/hermitdave/FrequencyWords
- Licença do conteúdo: **CC BY-SA 4.0** (https://creativecommons.org/licenses/by-sa/4.0/)
- Alteração feita aqui: removida a coluna de contagem de ocorrências; demais linhas inalteradas.

Por exigência da licença, estas listas derivadas permanecem sob CC BY-SA 4.0, com esta atribuição.
Usadas apenas para pontuar leituras do OCR (a palavra existe no idioma?), nunca exibidas ao leitor.

## Onomatopeias (`<idioma>-sounds.txt`)

`en-sounds.txt`, `es-sounds.txt`, `pt-BR-sounds.txt` e `ko-sounds.txt` são listas curtas de onomatopeias
comuns em quadrinhos de cada idioma, escritas para este projeto e dedicadas ao domínio público (CC0). Usadas só
para decidir que um texto livre de uma palavra é efeito sonoro e deve ficar com o desenho original; nunca
exibidas ao leitor.

## Classes gramaticais (`<idioma>-clause-openers.txt`, `-alternatives.txt`, `-particles.txt`)

Listas fechadas da gramática do idioma, escritas para este projeto (CC0): palavras que abrem uma oração e
palavras que ligam alternativas em inglês (reparo do "I" com serifa lido como `/`), e partículas do japonês em
hiragana (grito curto em kana com partícula é frase). Descrevem o idioma, nunca o texto de uma obra
(`docs/principios-de-correcao.md`).
