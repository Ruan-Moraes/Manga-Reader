# Diagnóstico e candidato para o gate pré-VM — 2026-10-19

Continuação da [terceira prova real](worker-isolation-third-native-attempt-2026-10-19.md).
A 020 permanece `in-progress/open`, a 021 bloqueada. Esta revisão é offline:
não cria VM, reserva, credencial, instalação ou chamada de provider.

## Reprodução local, não nova observação cloud

O diagnóstico preservou os fontes da rodada real e usou o mesmo runtime v4
com journals CAS reais e HTTP/identidade sintéticos. O controle sem atraso
concluiu a prova e retirou recursos falsos. Com **500 ms por GET** antes da VM,
o fluxo parou sem grant/POST da VM e retirou seus predecessores.

A instrumentação registrou o disparo do timer de **10.000 ms** em
`createOnce.io`, antes de `insert.dispatch`. Os callbacks dos timers foram
observados, não alterados. O driver também possui um orçamento total de
30 segundos; portas internas acumulam admissão e verificações de rota dentro
do IO destinado ao envio. Isso reproduz um defeito estrutural compatível com
o bloqueio real, mas não recupera um código de erro específico que a execução
real não registrou. Nova prova cloud continua necessária.

| Trace privado da reprodução                 | SHA-256                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| Controle sem atraso                         | `48fb39b45693fed12c087743657a2d4c9f58d0dc70f564974f00f29b8c06e184` |
| Serial com 500 ms por GET                   | `2db55af36e4ecfb16def63505278bfbf05bb9204c7442696f7995147c27326df` |
| Red do aceite desejado com o caminho serial | `6631189b3410bd2815781260b08eac0c021a2a0b7569d776b326cc251944fd3c` |

O diagnóstico está em `.local/worker-isolation/mount-prevm-diagnostic.OXi2ll/`.
A primeira fixture consultava o estado de um produtor que já tinha entregue
o staging e não filtrava operações por requestId. Os traces e fonte inicial
foram preservados; corrigiu-se a fixture, não a validação de cleanup. A
comparação corrigida passou seus dois casos e manteve a reprodução do timer.

## Candidato implementado

A revisão em `.local/worker-isolation/mount-prevm-parallel.4iO6yq/` não
aumenta os limites de dez/trinta segundos ou as janelas financeira/raiz.

- GETs independentes de projeto, predecessores e COS usam lote com até quatro
  leituras em voo. Todas as respostas continuam obrigatoriamente validadas.
- Listagens independentes de rotas/routers/mirrors também usam lote limitado;
  a paginação continua serial dentro de cada coleção.
- Falha/cancelamento para a fila, mas o lote espera os irmãos já iniciados
  terminarem. Não há retry, cache ou paralelização de mutações.
- Preparação pós-claim conserva admissão e route guards, mas acontece antes
  de entrar no IO de envio, sempre sob o prazo total do driver.
- Um vínculo privado por requestId/hash/expiração só é publicado após os
  guards. Não é grant CAS nem ticket aceito pela CLI.
- O envio consome esse vínculo uma vez, exige idade máxima de um segundo
  **na admissão de dispatch**, relê estado/sinal/relógio e gasta o grant v4.
  A conferência de escopo imediatamente anterior ao fetch permanece; não
  se promete atomicidade entre observação do control plane e o POST.
- Falha após gastar o grant continua ambígua, nunca NOT_SENT ou autorização
  para repetir o POST. Intenção, grant e operação permanecem distintos.

O primeiro candidato, somente com lote de GETs, ainda falhou no mesmo limite;
seu código e trace foram preservados. A separação entre preparação e envio
foi acrescentada depois, não ocultada como se o primeiro ajuste tivesse passado.

Não mudam journal CAS v4, helper Java, banco, migrations, HTTP do produto,
manifestos, task, defaults, limite de memória do worker ou autorização financeira.
A skill `database-design` orientou o plano anterior ao código: novos registros
são apenas recibos privados exclusivos por hash, sem tabela/índice/cache ou
alteração do ledger.

## Verificações focais e limites

O candidato com preparação separada passou o cenário completo de 500 ms por
GET e continuou rejeitando predecessor adulterado, sem grant/POST de VM.
O trace focal positivo tem SHA-256
`504e8bb39d0cfd6bbd9e47ef9bfcb8ca67936d39bace8753852804d6bf5409f8`.
Ele é anterior às últimas validações auxiliares; não substitui a bateria
consolidada do source final.

Dez testes puros passaram: seis de concorrência/ordem/falha/cancelamento do
lote e quatro de fronteira/sanitização da validade do vínculo preparado.

No cancelamento, a retirada dos recursos falsos terminou, mas o observador raiz
cancelado conserva `activeAbsenceConfirmed=false/requiresRecovery=true`.
A expectativa focal foi corrigida para preservar esse contrato conservador,
já existente: não se mudou o runtime para inventar confirmação de ausência.
Retirada do fake e confirmação recebida pelo observador são evidências distintas.

A primeira consolidação foi interrompida, sem footer terminal: seu TAP
preservado contém **76 casos aprovados**, zero `not ok`, e SHA-256
`90599ffe6b68ef75cd783b0fb21416a92ff637ae106d1c8c013ec3abc9ef8afa`.
Não é aceite integral. O teste de grants concorrentes, na fronteira da
interrupção, passou isolado; o grupo inteiro de journal/rejeição passou
**26/26** em aproximadamente 19,7 segundos, sem alteração desses fontes.
Essas verificações não confirmam a causa da interrupção anterior.

O verificador inicial foi preservado. A revisão acrescenta somente progresso
incremental e envelope sanitizado de falha; conserva a bateria, os asserts e
o watchdog de 900 segundos. A segunda consolidação terminou com **100/100**,
zero falhas, cancelamentos ou skips, em aproximadamente 465,6 segundos. Os
hashes anteriores, os 419 fontes do produto e o ledger foram revalidados sem
mudança ou nova reserva. O recibo inclui os fontes, diagnósticos, histórico da
interrupção e TAP finais:

- Recibo: `6576ddad73bec5c2f48c9217bd8df286388e9f594ef2c3a48e1f654019a26550`.
- TAP: `b6867e72f5eb546e3efa6e8f5f0b045a5bc95ba166e69cecbe0b93685e451439`.

O resultado integral não confirma retrospectivamente a causa da interrupção.

Esses recibos, por si só, não constituem admissão nativa. Montagem real,
segurança/recursos do worker completo e qualidade visual continuam abertos;
não há promoção da 020.

## Preparação do operador seguinte

A revisão privada `mount-prepared-operator.LoQ9fO` foi preparada offline.
Conserva o operador anterior e
acrescenta o vínculo ao candidato integral e a conferência fresca das duas
rodadas precedentes: 22 referências somente leitura, todas exigindo `404`.
Uma observação recente da terceira rodada não mascara a expiração da segunda.

Os grupos focais de ausência passaram 12/12 e 6/6; cinco casos focais do operador
passaram, incluindo janela financeira e compilação do helper Java já instalado.
O teste da nova CLI `prepare` foi corretamente recusado enquanto o pin do
candidato estava pendente. Após o aceite integral do runtime, o pin foi definido
e a bateria própria passou **53/53**, sem reserva, credencial real ou rede Google:

- Recibo: `e3884374ba8e12035be7a5f78d1fc5933242ac2e95beb7b4d0926b630e6d2a0d`.
- Review técnica de escopo: `5e38aa9d9f270e398c0a82cee6812ada9522e4994c36901ec8ffd08fa4bf5303`.

O comando local de preparação conserva o resumo histórico `runtimeTests=87`;
os gates adicionais são os recibos separados de 100 e 53 casos. Não se trata
de uma nova aprovação global do produto. A execução cloud posterior deve ser
registrada separadamente, incluindo retirada e custos não reconciliados.
