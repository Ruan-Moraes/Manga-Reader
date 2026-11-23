# Operador API e sexta prova restrita — 2026-10-22 UTC

Continuação do [contrato de cotação API](worker-isolation-api-pricing-2026-10-22.md).
O novo operador foi integrado e passou nos gates locais/globais. Houve **uma**
prova nativa, interrompida em metadados antes de qualquer POST Compute. O staging
privado foi retirado por recuperação explícita. Não houve montagem comprovada,
worker admitido ou promoção da 020/021.

## Integração entregue

O diretório privado `mount-n1-api-operator.VSGdSz` preserva o operador anterior.
A configuração `cos73916-api-financial-inputs-1` exige referências arquivo/SHA
para observação, billing e `captureEvidence`. Observação e evidência API devem
estar no mesmo diretório privado. O recibo deve vincular os dados ao gate API
selecionado, 14 GETs e resultado/estimativa recalculados; a identidade de billing
deve corresponder semanticamente, sem depender da ordem das propriedades JSON.

Guard e admissão usam o contrato UTC API. Não há fallback para o Console,
cotação anterior ou valores fictícios. Foram preservados o ledger em centavos,
reserva de USD 5, TTL de uma hora/janela de 15 minutos, metadata/quotas/43 ausências
frescas, readback, CAS5, cancelamento e retirada conservadora. O runtime de
dispatch selecionado continua o já verificado, com ticket de 1000 ms e prazos
de I/O/driver intactos. Nenhum schema, migration, índice, contador ou cache novo;
o plano de integridade antecedeu o código conforme `database-design`.

## Gates antes da execução

| Gate                                                          | Resultado observado                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| Núcleo novo, incluindo CAS/admissão/composição com HTTP falso | 113/113, zero falhas/skips/cancelamentos, 171 fontes reconferidas  |
| Launcher com guarda histórica adicional                       | 3/3, fontes inalteradas                                            |
| Maven global offline com Docker/JDKs existentes               | `BUILD SUCCESS`, zero falhas/erros; gateway 1297 testes, 104 skips |
| Web `tsc -b`                                                  | Exit 0                                                             |
| Mobile `pnpm check` integral                                  | Exit 0; 116 suítes/892 testes Jest, inclui SDD e links             |

Os gates não são aprovação operacional. A integração sintética cobre sucesso,
HTTP 400, upload com ACK perdido e retirada, com CAS Java concreto, mas verificação
de reserva injetada. Essa diferença importa para o finding posterior.

O núcleo foi selado de 16:17:51.317 a 16:18:58.259 UTC. O Maven terminou às
16:19:47.382 UTC. Não houve instalação ou alteração de Java, mobile, performance,
manifesto, rotas ou defaults. Os 419 fontes do gateway continuaram iguais.

A captura anterior havia expirado. Um diretório novo, `mount-n1-price-refresh.r4CjPi`,
recebeu o mesmo pacote imutável, com todos os bytes/hashes do gate API reconferidos.
Os recibos/TAPs copiados mantêm suas datas históricas, sem alegar nova execução
dos testes. Apenas a captura foi nova: 14 GETs 200, mais dois GETs de billing,
com identidade existente e sem chave/permissão nova. O cenário estimou USD 2,11;
isso não é gasto observado ou teto imposto pelo Google.

O `prepare` real passou às 16:21:20 UTC, sem credencial, arquivos de rodada ou
reserva. Os dados estavam válidos para toda a janela futura exigida.

## Resultado nativo e retirada

Rodada técnica `mount-check-20261022-8aa77056`, executada sob a autorização total
de USD 100. Os 50 GETs prévios passaram e houve a sexta reserva de USD 5. A captura
do runtime contém 57 requests: dois POSTs Storage 200 e somente GETs restantes.
**Nenhum POST Compute foi enviado.** O diagnóstico novo localizou a recusa em
`network / metadata`, antes da criação de ticket (`ticketAgeMs=null`). Não há
base para atribuir esta recusa ao prazo do ticket.

O processo terminou com exit 2, `quiescenceConfirmed=true`, `requiresRecovery=true`
e `safeToUnlock=false`. O journal Compute ficou selado, somente com contexto,
intenção de network e seal. O protocolo CAS5 confirmou `insertNotSent` sem inventar
operação terminal. O lock original foi preservado; não houve retry de criação.

A recuperação privada `mount-n1-api-recovery.KcEZFL` reutilizou o protocolo de
partial storage, passando antes em 21 testes. Reconferiu oito nomes Compute 404,
listas filtradas de operações vazias, projeto/labels/gerações e bucket sem outros
objetos. Fez 52 requests: **50 GETs e dois DELETEs condicionais**, zero POSTs ou
novas reservas. Confirmou ausência ativa de objeto/bucket e nomes Compute.
Source/Compute e lock originais permaneceram inalterados. Soft delete de sete
dias continua possível; não se alega exclusão física imediata.

O ledger agora possui **seis reservas, USD 30 reservados**, sem estorno automático.
Há USD 55 em slots normais ainda não reservados, além das parcelas anteriores
de allowance/contingência. Isso não confirma fatura nem gasto efetivo.

## Finding local posterior: concorrência do ledger

A captura mostra o GET Resource Manager durante a preparação, mas não o GET
Compute do mesmo lote de metadados. A investigação identificou que o helper real
`readReservation` adquire um lock exclusivo, também para leitura. Os GETs
independentes usam admissão concorrente, que chama esse helper.

Em cópia privada e temporária do ledger, **sem criar reserva**, duas leituras
simultâneas da mesma reserva produziram uma confirmação e uma recusa
`evaluation-budget-unconfirmed`. O original permaneceu intocado. A integração
anterior usava `verifyReservation` falso e não exercitava essa contenção real.

É um defeito local reproduzido e compatível com a recusa observada, **não prova
exclusiva da causa histórica**, pois a captura sanitizada não preserva o detalhe
interno daquela verificação. Não remover o lock, cachear aprovação ou relaxar
budget/metadata para obter verde.

Próximo trabalho: serializar de forma limitada as verificações de reserva do
mesmo operador, preservando leitura fresca de cada chamada e a recusa a locks
externos. Testar com ledger real temporário e lote completo de metadados antes
de considerar outra criação. Incorporar a retirada desta rodada aos pré-requisitos
futuros; não reutilizar este contexto ou apagar seu lock.

## Recibos privados

| Recibo                   | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| Núcleo, 113 testes       | `ee4cecd091836223ec846d18d873b314dccb43c71d3bd110d64cb7997ff2ceec` |
| Launcher, três testes    | `90cd35713032ffe5845cfb477188761d6ec20260ec8bf653bfe5d254f706014b` |
| `local-prepare.json`     | `56327c910917d35cba1895d7aaa34659a6c2db58ab8af330b275d65666d0459d` |
| Falha da prova nativa    | `6422f017c40aae3d1483ae95b5014638dd86c801f2f5a8e25076eefb05e1ced3` |
| Captura wire do runtime  | `e3ca5f1e0a0ab6ebd5ca46ba894356832be17eb68c08286b52343d36003575c2` |
| Resultado da recuperação | `82f9954bde639d43943666656864dbf955f9b29598f13042f0653869f207eb59` |
| Retirada comprovada      | `389cc8d29447a233c20bf917236470678cadc35a458fd73d1e7bdd6f9a622428` |

A 020 permanece `in-progress/open`, e a 021 `approved/blocked`. Nenhum provider
de OCR/tradução, mídia real, upload público, IAM/API ou deploy foi acionado.
Montagem, boot, runtime/CVEs, memória, isolamento, renderização/qualidade e retenção
operacional do worker completo continuam abertos. Não substituir esse objetivo
pelo sucesso dos testes do operador.

A [continuação com verificação serial](worker-isolation-serial-reservation-2026-10-22.md)
corrigiu e testou posteriormente a contenção usando o leitor real em cópia
temporária do ledger. Preserva este resultado histórico e não afirma que a
montagem ou o worker completo tenham sido validados.
