# Protocolo local de criação não enviada — 2026-10-18

Continuação dos findings da [segunda rodada nativa](worker-isolation-second-native-attempt-2026-10-18.md).
A 020 continua `in-progress/open`, a 021 bloqueada. A implementação desta
parcela é offline; não comprova montagem na VM nem admite o worker completo.

## Modelo e integridade

O novo protocolo `mount-progressive-journal-cas-4` distingue intenção de
autorização de envio. **v4 é uma versão do tooling privado, não uma migration
Flyway.** Não há alteração no banco, HTTP, task, contratos Java ou defaults do
gateway. A skill `database-design` orientou o plano anterior ao código e a
exceção explícita para o store CAS local, sem alegar FKs SQL ou BCNF para arquivos.

O contexto vincula plano e bundle; a intenção conserva requestId e payload hash.
Um registro `insert.dispatch` contém somente versão e hash da intenção. O grant
é persistido atomicamente, uma única vez, depois das validações e antes do POST
privado. O caller confere sinal e prazo novamente após o CAS. O store Compute
reconhece somente suas 58 posições possíveis, recusando chaves Storage,
delete-dispatch ou flags de desfecho arbitrárias. O helper Java existente não muda.

| Fotografia CAS                                 | Interpretação e retirada                                                                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Aberto, intenção sem dispatch                  | Ainda não há classificação de desfecho; o criador pode disputar o grant.                                                               |
| Selado, intenção sem dispatch/handle/resultado | `insertNotSent=true`, derivado da mesma fotografia. Exige recurso 404 e lista de operações vazia pelo requestId, em duas conferências. |
| Dispatch sem handle                            | Ambíguo. GET da operação exata pode reconciliar; ausência de evidência não autoriza retry nem classificar como não enviado.            |
| Dispatch com operação terminal                 | Preservar status/erro e conferir identidade real do recurso antes de retirar.                                                          |
| Dispatch com HTTP 403 observado                | Rejeição distinta de operação terminal e de NOT_SENT; jamais fabricar essa resposta para encerrar uma intenção.                        |

Selar e gastar disputam o mesmo CAS. Se selar vencer, um gasto tardio não pode
autorizar POST. Se gastar vencer, selar não converte a chamada potencialmente
iniciada em NOT_SENT. Cancelamento, expiração ou confirmação perdida depois do
grant podem continuar ambíguos, mesmo quando um teste sabe que seu servidor
falso não recebeu a chamada. Nenhum desses casos concede um segundo POST.

Contextos v2/v3 são recusados sem reescrita. A ausência de um marker que não
existia no protocolo antigo **não prova** ausência de envio. Os registros e
locks da rodada anterior permanecem preservados; sua retirada explícita não
é reclassificada como execução v4.

## Integração implementada

O grafo privado em `.local/worker-isolation/mount-unsent.2evCJk/` liga journal,
factory de diretórios, HTTP de criação, ciclo/readers, retirada, handoff,
cleanup de staging verificado, supervisor, composição e wrapper nativo.
Os consumidores exigem v4 e capturam a nova porta `spendInsert`.

A retirada conserva identidade/ownership, dependências e espera GET-only.
NOT_SENT não aceita targetId ou operação inventados. Lista incoerente ou
recurso encontrado mantém o bloqueio; não se ignora evidência para obter verde.
Resposta de POST perdida pode ser reconciliada por GET e permitir o avanço
anterior, mas somente com a operação válida e sem repetir a criação.

A normalização de `Disk.users` já testada é reutilizada: ausência ou array vazio
indicam nenhum anexo; `null`, tipo inválido e anexos continuam rejeitados.
Não foi adicionado comando de execução real a esta revisão.

## Verificação concluída desta parcela

O journal passou a bateria inicial de 13 testes CAS. Oito integrações passaram
com HTTP/identidade Google sintéticos, incluindo ciclo completo, falha antes do
envio, confirmação perdida, 403 retornado pelo fake, cancelamento, cleanup sem
criação e recusa de lista incoerente. Os testes privados de transporte também
confirmaram ausência de POST após grant negado, ACK perdido, cancelamento ou
expiração. Esses resultados focais não são o gate consolidado.

A consolidação passou **87/87**, zero falhas, skips ou cancelamentos, em sete
arquivos, às **23:17:49 UTC**, em aproximadamente 352 segundos. A execução foi
serial entre arquivos, preservando os cenários concorrentes internos.

| Cobertura                                               | Testes |
| ------------------------------------------------------- | -----: |
| Journal v4, corrupção, concorrência e contextos legados |     15 |
| Transporte privado e interrupção após grant             |      5 |
| Supervisor, NOT_SENT e confirmação ambígua              |      8 |
| Regressões de rejeição                                  |     11 |
| Portas nativas e operações assíncronas                  |     10 |
| Fronteiras de Disk.users                                |     18 |
| Espera GET-only                                         |     20 |

O recibo confere 22 fontes/documentos locais, sete recibos prévios, os 17
artefatos da política de disco e o snapshot técnico inalterado de 419 caminhos.
O ledger permaneceu com duas reservas anteriores; nenhuma foi criada nos testes.
O red semântico anterior ao protocolo foi preservado, sem reescrever históricos.

| Evidência privada                    | SHA-256                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| `verification.json`                  | `0187ec58dca8c49a33207aea0659347ffe267a6cde69cddc2189de082412c184` |
| TAP consolidado                      | `4aa7e223cfabc699869cc1d9795ee3a0478f9e180ca066a183049a224157b523` |
| Reprodução anterior sem marker, 0/13 | `ccf5973fd93d1819888b789c489cd39958b4e87be7acbbf39759c0070084216e` |

Comando executado na raiz: `node .local/worker-isolation/mount-unsent.2evCJk/verify.mjs`.
O recibo é exclusivo; nova revisão exige novo registro, não sobrescrita.

Uma fixture histórica retornava todas as operações sem respeitar o filtro.
Ela foi corrigida, não o validador. Um caso separado exige recusa quando a
listagem é incoerente. A expectativa de falha após resposta perdida foi ajustada
para exigir reconciliação válida e prova simulada, preservando o comportamento
anterior em vez de mudar runtime para satisfazer uma expectativa errada.

## Limites e sequência

Nenhum install, download, credencial real, chamada Google, reserva, alteração
de IAM, deploy ou mídia real faz parte desta parcela. As duas reservas anteriores
continuam registradas, sem refund ou conciliação de cobrança. Arquivos de
performance não foram alterados. Maven, web, mobile e SDD não foram reexecutados
nesta parcela privada; não houve promoção de status ou liberação da 021.

Próximo: revisar o operador que ligará o novo runtime, os recibos
de retirada anteriores, a segurança da prova restrita e preços ainda vigentes.
Exigir que a validade da tabela cubra a janela inteira da rodada e da limpeza;
estar válida somente no instante inicial não é suficiente. Não reutilizar
tabela expirada, lock ou ID antigo para criar recursos. Nova
rodada exigirá novo ID/reserva dentro da autorização financeira existente.
Montagem nativa, isolamento/recursos do worker e qualidade do renderer permanecem
gates distintos; estes testes não substituem nenhum deles.
