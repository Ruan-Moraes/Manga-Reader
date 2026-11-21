# Padrões de hifenização

`hyph-pt.pat.txt`, `hyph-es.pat.txt` e `hyph-en-us.pat.txt` são os padrões de hifenização (algoritmo de Liang)
do projeto **hyph-utf8** (https://github.com/hyphenation/tex-hyphen, `hyph-utf8/tex/generic/hyph-utf8/patterns/txt`),
baixados em 2026-11-16 sem alteração. Os autores, o copyright e a licença de cada um estão, completos, em
`hyph-<idioma>.license.txt` (cabeçalho do `.tex` correspondente):

- português (`pt`): BSD 3-clause — Pedro J. de Rezende, J. Joao Dias Almeida, Leonardo Araujo, Aline Benevides;
- espanhol (`es`): MIT/X11 — Javier Bezos, CervanTeX;
- inglês americano (`en-us`): uso e redistribuição livres mantendo o aviso — Gerard D.C. Kuiken.

Usados só pelo render, como último recurso, para partir com hífen uma palavra que não cabe na largura de um
balão estreito. Descrevem o idioma, não o texto de uma obra (`docs/principios-de-correcao.md`).
