# Memória do capítulo (2026-11-18)

Páginas do mesmo capítulo traduziam o mesmo nome de formas diferentes. No lote de validação apareceram, por exemplo:

| Original | Traduções |
|---|---|
| "Coriander" | "Coriander" e "o coentro" |
| "コモナ" | "Komona" e "Comona" |
| "Pimienta" | "Pimienta" e "Pimenta" |
| "후추" | "Pimenta" e "Huchu" |

Cada página era decidida isoladamente pela tradução automática. A memória do capítulo faz a primeira tradução de
um nome valer para as páginas seguintes do mesmo capítulo.

## Contrato

`PageSubmission.contextRef` é opcional: um UUID opaco que o cliente sorteia por capítulo e repete em todas as
páginas dele. Sem esse campo, a página é traduzida sozinha, exatamente como antes.

- O campo entra na impressão digital de idempotência só quando está presente. Assim, as submissões sem capítulo
  continuam com a mesma impressão digital de antes.
- Um `contextRef` malformado responde `400 invalid-request`. O mesmo vale agora para qualquer parâmetro de tipo
  inválido; antes, um `attemptRef` malformado devolvia 500.

## Dados (V12)

`processing_jobs.context_ref` guarda o capítulo de cada página e pode ser nulo.

`translation_context_terms` guarda os termos decididos:

- **Chave primária:** (`installation_id`, `context_ref`, `source_language`, `target_language`, `source_term`), e
  `target_term` depende da chave inteira (BCNF).
- **Escopo:** a instalação é dona da memória (FK `ON DELETE CASCADE`). Um capítulo nunca é visível para outra
  instalação, nem para outro par de idiomas.
- **Primeira decisão vale:** com `INSERT … ON CONFLICT`, a primeira página que decide um termo fica com ele.
  Duas páginas traduzidas ao mesmo tempo não brigam.
- **Retenção:** os termos são conteúdo de página, então seguem a retenção de resultado divulgada (no máximo 1 hora).
  `expires_at` é renovado só quando uma página posterior usa o termo de novo, e nunca passa de 1 dia depois da
  decisão. Linhas vencidas não são lidas, e `CleanupPersistenceUseCase` as apaga em lotes (índice em `expires_at`).
  Não há categoria nova de dado no disclosure.

## Quais nomes entram (`ChapterTerms`)

A regra usa só o próprio texto da página, sem lista de nomes (`principios-de-correcao.md`). Um termo entra quando:

- é uma palavra do dicionário do idioma de origem;
- aparece com maiúscula no meio de uma frase, em texto que não está todo em maiúsculas;
- nunca aparece em minúscula na mesma página.

Exemplos:

- "Coriander defies death" → entra.
- "MY Potion!" ao lado de "this potion" → não entra.

A palavra termina no apóstrofo: "Coriander's" conta como o nome "Coriander". Na hora de aplicar, uma palavra que
faz parte de um nome de várias palavras com maiúscula, separadas só por espaço ou possessivo ("Squirrel's End",
"Technologist's Union"), não é fixada. A tradução automática trata o nome inteiro, como antes. Fixar só uma das
palavras deixava o resto solto: "Esquilo 's Fim", no segundo lote real.

Quando uma página escreve a palavra em minúscula ("the potion"), a decisão dela é apagada do capítulo, porque
isso mostra que a maiúscula em outra página era ênfase ou título ("MY Potion!", «Hechizos de Destrucción»). A
regra não usa só a página atual porque, no primeiro lote real, "Potion", "Clap" ("Aplaudir") e "Hechizos"
tinham sido gravados por páginas que nunca os escreviam em minúscula.

Nomes que o dicionário não conhece ("Komona", "Shichimi") já são mantidos como escritos por `ProtectedTerms` e
já saem iguais em todas as páginas. A memória cobre a falha que sobra: nome que é palavra comum.

Escritas sem maiúsculas (japonês, chinês, coreano) não têm esse sinal. Para elas, a memória fica para a camada
de linguagem (Gemini), que reconhece nomes e pode ler e gravar o mesmo glossário.

## Fluxo na tradução (`ChapterMemoryService`)

1. Ler os termos já decididos do capítulo.
2. Traduzir sozinhos, numa chamada pequena ao provedor, os candidatos da página que ainda não estão na memória
   (no máximo 32) e gravá-los.
3. Traduzir a página com os termos decididos enviados como literais: dentro de `<span translate="no">`, já com a
   tradução decidida. Em letreiramento todo em maiúsculas, a tradução também sai em maiúsculas
   ("CORIANDER" → "COENTRO"). O substantivo comum em minúscula ("coriander") continua com o tradutor.

Qualquer erro na memória deixa a página sem termos decididos, como se não tivesse capítulo. A memória pode deixar
a página mais consistente, nunca fazê-la falhar.

## Ordem das páginas

A primeira decisão vale, então uma página traduzida ao mesmo tempo que a que decide um nome não o vê. No primeiro
lote real, o testador mandava 3 páginas do mesmo capítulo em paralelo. O p05, onde "Coriander" só abre frases (e
portanto não é candidato ali), saiu "Coentro". O p04 saiu "Coriander's", por causa do possessivo, já corrigido.

O servidor não ordena páginas. Os clientes devem traduzir as páginas de um capítulo em ordem de leitura, uma
depois da outra. Capítulos diferentes podem ir em paralelo.

## Clientes

- **gateway-tester:** um `contextRef` por capítulo e por lote. As páginas de um capítulo vão em ordem; a opção
  `concurrency` conta capítulos em paralelo.
- **Mobile:** na v1 ainda submete uma única página por projeto, então não há outra página para compartilhar
  memória. Quando o app enviar várias páginas, cada projeto precisa de um UUID sorteado e guardado com ele, e não
  de um identificador derivado do projeto.
