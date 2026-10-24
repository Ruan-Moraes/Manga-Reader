# Verificação serial de reserva — 2026-10-22 UTC

Continuação da [sexta prova restrita](worker-isolation-api-operator-native-2026-10-22.md).
Foi corrigida uma contenção local entre verificações financeiras concorrentes,
sem alterar ledger, reservas, valores ou o produto Java. Isso ainda não é prova
de montagem, admissão do worker completo ou encerramento da 020.

## Defeito reproduzido e correção

O helper financeiro selado usa lock exclusivo inclusive para leitura. Em uma
cópia temporária privada do ledger, 16 verificações simultâneas sem serialização
produziram uma confirmação e 15 recusas. O teste RED foi preservado.

O módulo novo serializa a verificação inteira por reserva do operador, em FIFO
limitada a 16 chamadas incluindo a ativa. Cada chamada aceita relê os dados uma
única vez e compara os hashes da reserva e autorização. Não há cache, singleflight,
retry de lock externo, remoção de locks ou relaxamento financeiro. Cancelamento
não libera capacidade nem devolve a chamada ativa antes de terminar a operação
privada; chamada cancelada na fila não consulta o ledger.

O plano de integridade foi registrado antes do código conforme `database-design`.
Sem banco, migration, índice ou contador persistido novo. Dinheiro continua em
centavos inteiros/USD. Os seis registros originais e a autorização permaneceram
byte a byte iguais.

## Evidência offline selada

Pacote privado `mount-ledger-verification.A0lBky`, executado de 16:41:14.555 a
16:42:22.298 UTC: **15/15 testes**, sem falhas, skips ou cancelamentos; 156 fontes
reconferidas, bloqueio de rede/credenciais ativo, zero chamadas cloud ou reservas.

O teste composto usa engine/admissão/wrapper nativos, CAS Java real e o leitor
financeiro real sobre cópia temporária. HTTP, identidade, preços e observações
são sintéticos. Cobre sucesso com retirada, HTTP 400, confirmação perdida de
upload e o controle sem serialização. Esse controle reproduz a recusa em
`network / metadata` sem POST de VM, exigindo recuperação e preservação do lock.
Não prova retrospectivamente a causa exclusiva da execução histórica.

Também foram testados FIFO, limite da fila, cancelamento antes/durante a leitura,
ausência de cache/retry, adulteração de hash/autorização, lock externo e erros
sanitizados. As 16 verificações concorrentes corrigidas passaram.

Recibo `verification.json`, SHA-256
`19617b65282393be790896f2c47ba0be20664eed0ffeed8dfb800fc44a523056`;
TAP `692b206dada492b4af007c6782f0dee269a3caceb4ac6277fd86c43e76d7d4b3`.

## Integração selada e preparo

Novo operador privado `mount-n1-serial-operator.XclJhd`, sem adotar o contexto
da sexta rodada. Acrescenta as dez referências retiradas dessa rodada às 43
anteriores: 53 ausências atuais, mais cinco metadados e duas quotas, antes de
qualquer reserva. Não inventa route quando nenhum POST Compute foi enviado.
Mantém a guarda histórica da primeira rodada e os prazos de ticket/I/O/cleanup.

A suíte integrada foi selada de 16:46:05.207 a 16:47:15.382 UTC: **143/143**,
zero falhas/skips/cancelamentos e 182 fontes reconferidas. O launcher passou
separadamente em três testes, com 141 fontes. Os recibos preservam os gates
históricos do dispatch, API e correção serial. O preparo passou às 16:47:45 UTC,
com 60 GETs previstos, zero credenciais, chamadas cloud ou novas reservas.

| Recibo privado   | SHA-256                                                            |
| ---------------- | ------------------------------------------------------------------ |
| Núcleo integrado | `8accec336ebfb720937dbfc66d620c50021d489be07e9c5fe255646172aeffa3` |
| Launcher         | `877c0aca0b61ed5e7fa2ed61b764a945eb8580ad047bb6641118a8004a6ce49f` |
| Preparo local    | `c335753f29ad4bc2388d3ae8827d40eb7940485411bcbd35860862dc7b37d6f3` |

Os 419 fontes do gateway continuam iguais. Maven global offline, type-check web
e `pnpm check` da [auditoria anterior](worker-isolation-api-operator-native-2026-10-22.md)
permanecem evidência daquela execução, não novas execuções neste marco local.
O ledger no fechamento offline tinha seis reservas, USD 30 reservados e USD 55
em slots normais não reservados; não é fatura observada nem teto do provider.

## Sétima prova restrita e retirada

Após auditoria local de pins, orçamento e validade financeira, houve uma única
prova nativa sob a autorização total de USD 100: `mount-check-20261022-9b775b31`.
Os 60 GETs prévios passaram e houve a sétima reserva de USD 5. A captura do runtime
registra 473 requests: 454 GETs, nove POSTs e dez DELETEs. Os sete POSTs Compute
e dois Storage retornaram 200. Isso não inclui os 60 GETs dos pré-requisitos.

Rede, sub-rede, regras de ingresso/egresso, imagem e dois discos receberam
operações terminais. A criação da VM foi barrada em `instance / route-barrier`,
com `ticketAgeMs=null`: a barreira ocorre antes de criar o ticket. O CAS5 selado
contém intenção da VM, sem dispatch ou operação correspondente. Não houve POST
de VM ou prova de montagem. Não atribuir esta recusa à validade do ticket.

O coordenador retirou os recursos automaticamente, com oito DELETEs Compute
(incluindo a rota default) e dois DELETEs Storage. As sete criações Compute e
suas exclusões têm recibos terminais `DONE`, sem erro; a rota também terminou
retirada. Resultado `supervisor-failed-and-retired`, ausência ativa confirmada,
quiescência confirmada, `requiresRecovery=false`, `safeToUnlock=true`; o dono
removeu seu próprio lock. Não foi necessária recuperação manual ou nova criação.
Soft delete de sete dias continua possível no GCS; não é exclusão física imediata.

A auditoria local posterior reconferiu 323 entradas de fontes dos dois gates e
os 419 fontes do produto. Autorização e seis reservas anteriores permanecem
byte a byte iguais. O ledger agora contém **sete reservas, USD 35 reservados**
e USD 50 em slots normais ainda não reservados. Não há estorno automático;
reserva não é fatura ou gasto observado.

| Recibo privado          | SHA-256                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| Resultado nativo        | `6a418d2ffaa79a402d5e2daa8d6dad50ed365d77d9ed5d0ee817dfe54c77bf7f` |
| Captura HTTP sanitizada | `d3d9068b39ebcc4e15d001a91d090eeebcb078be2e3384ea0d61950005ab54e5` |
| Auditoria após retirada | `c8ff3ce3e245be90841f5c49c6f592a2fd593c7e1da19f45804c0e4a95770b79` |

## Finding seguinte: barreira de rotas

A captura contém um único erro de transporte, em GET da rota já removida,
na confirmação final anterior ao envio da VM. O hash dessa URL foi recomposto
localmente a partir do recibo da rota, sem nova chamada. GETs anteriores e
posteriores da mesma referência retornaram 404.

A preparação HTTP possui orçamento compartilhado de dez segundos para
metadados, snapshots e barreira de rotas, dentro do driver de 30 segundos.
Essa é uma hipótese de contenção de prazo a reproduzir offline com latência
controlada; a captura não conserva causa bruta ou instante final suficiente
para declarar timeout como causa exclusiva. Não ampliar timers, remover a
barreira ou repetir a criação para obter resultado verde.

## Limites e sequência

Próximo trabalho: reproduzir e isolar a recusa da barreira com HTTP falso,
preservando as verificações de rede/rota/escopo antes e depois, cancelamento e
quiescência. Uma futura prova exige novo contexto, reconferência também desta
sétima rodada retirada e dados financeiros válidos. Não executar novamente
este operador ou seus verificadores selados. Recibo financeiro expirado não
pode ser redatado ou reutilizado fora da validade. Nenhum retry automático.

020 permanece `in-progress/open`; 021 `approved/blocked`. Boot, CVEs/runtime,
memória, isolamento, renderização/qualidade, retenção e operação do worker
completo continuam pendentes. Não houve provider OCR/tradução, upload público,
alteração IAM/API, instalação, deploy ou mudança nos arquivos de performance.

A [continuação offline da barreira de rotas](worker-isolation-route-barrier-offline-2026-10-23.md)
reproduz a recusa com latência sintética e prepara leituras pareadas, preservando
as duas fronteiras, o escopo integral e os prazos. Não é uma nova prova cloud.
