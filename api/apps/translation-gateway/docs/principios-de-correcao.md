# Princípios de correção — sem correção estática na tradução

> **Normativo.** Vale para todo o pipeline do gateway de tradução (OCR, agrupamento, tradução, camada de
> linguagem, render). Decisão do responsável pelo projeto em 2026-11-15. Ler antes de corrigir qualquer
> defeito de qualidade.

## A regra

**Nenhuma correção estática.** Quando uma letra, palavra ou frase sai errada, o conserto **nunca** é
reconhecer aquele texto e trocá-lo:

- nada de `if (texto.equals("15")) texto = "IS"`, tabela `"15" → "IS"`, `replace("servidora", "servidor")`;
- nada de lista de palavras, nomes ou frases **tirada da obra em que o erro apareceu**;
- nada de exemplo no prompt do modelo de linguagem copiado do caso que se quer consertar — o modelo
  "acerta" a página de teste e a medição deixa de provar que a regra generaliza.

Cada obra é diferente. Um conserto que só funciona porque conhece o texto daquela página não escala e
esconde o problema real.

## O objetivo não é a perfeição

O objetivo é **o melhor resultado possível dentro do erro**: uma regra geral que acerta a maioria dos
casos, com custo e desempenho aceitáveis. **Um caso sair errado é aceitável. Sair errado sempre, ou só
sair certo porque a resposta foi colocada no código, não é.** O que sobra vira limite documentado ou
revisão humana — não um `if`.

## Como corrigir um defeito

1. **Diagnosticar a classe do erro, não a instância.** "15 no lugar de IS" é *dígito parecido com letra
   lido com pouca confiança*; "servidora" é *concordância com quem fala em vez do substantivo*; "bin →
   lixeira" é *texto desenhado em tela tratado como fala*. A correção mira a classe.
2. **Procurar o sinal geral** que separa o certo do errado: confiança do OCR, geometria, classe do
   detector, balão, tamanho de letra, escrita/idioma, estrutura da frase, contexto da página.
3. **Escolher pelo custo-benefício**: a solução mais simples que cobre a classe; considerar custo por
   página (chamadas pagas), tempo de render e risco de piorar outros casos.
4. **Medir em muitos casos, não no que motivou a mudança**: testes unitários com casos positivos **e
   negativos** (o que não pode mudar), regressão visual com páginas reais, e, quando possível, páginas de
   mais de uma obra/idioma. Registrar o diff das expectativas e revisá-lo.
5. **Documentar o que ficou de fora** como limite conhecido.

## O que é permitido (e por quê)

| Permitido | Condição |
|---|---|
| **Recursos do idioma** (dicionário de frequência, lista de onomatopeias de quadrinho, classes gramaticais fechadas, partículas do japonês) | Descrevem o **idioma**, valem para qualquer obra; ficam em arquivo de recurso com origem/licença (`lexicon/NOTICE.md`), nunca espalhados em `if` |
| **Limiares numéricos** (confiança, tamanho, proporções) | Calibrados por medição e validados em mais de uma página; o motivo fica no comentário |
| **Formatos** (URL, e-mail, caminho, nome de arquivo, `$VAR`) | São padrões estruturais, não texto de uma obra |
| **Exemplos em comentários e testes** | Documentam o caso real que motivou a regra; não mudam o comportamento |
| **Exemplos no prompt do modelo** | Só **inventados**, ilustrando a classe de erro — nunca o texto da página de avaliação |

## Checklist antes do merge

- [ ] A correção funciona sem conhecer o texto da página que motivou o defeito?
- [ ] Há teste com casos que **não** devem mudar?
- [ ] A regressão visual foi revisada (diff de expectativas)?
- [ ] Custo e desempenho por página continuam aceitáveis?
- [ ] O que não foi resolvido está registrado como limite?

## Histórico de aplicação

- **Rejeitado:** tabela `15 → IS` (2026-11). Resolvido pela classe: releitura do OCR por confiança e
  camada de linguagem com o contexto da página.
- **Corrigido em 2026-11-15:** exemplos do prompt do Gemini tirados de Ubunchu! ("WINDOWS 15 50
  PATHETIC", "servidor assim", "propriedade privada", "Swish Swish") trocados por exemplos inventados e
  regras gerais.
- **Corrigido em 2026-11-16:** o glossário `glossary/protected-terms.txt` (Ubuntu, Linux, GNOME, wget, Firefox,
  Debian…, montado a partir de Ubunchu!) foi removido. `ProtectedTerms` reconhece nomes pelo próprio texto e
  pelo dicionário do idioma: palavra com maiúscula colada a minúscula ("YouTube"), sigla ou palavra com inicial
  maiúscula no meio da frase que o dicionário não conhece ("Akane"), palavra latina em texto japonês/chinês.
  Validação nas 12 páginas do cap. 1: os 49 nomes que a lista protegia continuaram intactos (49/49); nenhuma
  fala nova voltou para o inglês. Limite aceito: sigla que também é palavra comum ("GNOME" = gnome) e letreiro
  todo em caixa alta não são detectados — ficam com o tradutor e a camada de linguagem.
