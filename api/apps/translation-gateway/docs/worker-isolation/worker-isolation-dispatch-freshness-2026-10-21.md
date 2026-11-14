# Ticket de dispatch: correção local e janelas preservadas — 2026-10-21

Continuação da [primeira rodada N1](worker-isolation-n1-first-execution-2026-10-21.md).
Trabalho iniciado em 21/10, com gates finais em 22/10 UTC. A composição candidata
foi corrigida e testada localmente. **Não houve nova VM, upload, reserva, instalação,
OCR ou tradução.** A 020 continua `in-progress/open`; a 021 permanece bloqueada.

## Fatos e limite do diagnóstico

Na rodada anterior, o staging foi entregue, mas o Compute não recebeu POST.
Seus journals, lock e recibos de retirada permanecem preservados. A causa exata
daquela recusa não pode ser recuperada somente do código de erro sanitizado.

Dois GETs novos, de 23:49:16.841 a 23:49:18.554 UTC de 21/10, consultaram somente
os campos necessários do Resource Manager e do projeto Compute. O próprio
`projectIdentity` aceitou os dados: projeto, estado, hash do número, nome Compute
e metadata vazia corresponderam. Nenhum número, key, valor de metadata, token ou
resposta bruta foi persistido. SDK e 419 fontes do gateway permaneceram iguais.
É observação **atual**, não prova de que esses predicados passaram na rodada anterior.

Separadamente, houve um defeito reproduzível: o ticket de um segundo era criado
antes de duas leituras locais de estado. O atraso acumulado podia vencê-lo antes
do grant. Além disso, o transporte não reconferia esse prazo depois de persistir
o grant CAS. Os testes RED reproduziram a recusa indevida e o envio falso após
um grant artificialmente atrasado. Não foram usados dados de OCR ou rede Google.

## Correção selecionada

O candidato privado `mount-n1-dispatch-diagnostic.ZJAbHM` preserva os predecessores.
O entry point da revisão final é **`runtime-v3.mjs`**, com:

- `driver-v4`: mantém o preparo no claim, fora do prazo de I/O do POST. O último
  state guard externo foi movido para imediatamente antes do preparo;
- `http-v8`: conserva o state guard interno após o preparo, revalida o mesmo
  ticket antes **e depois** do grant CAS e não envia POST se estiver vencido;
- composição, supervisor, handoff, readers, ciclo e cleanup correspondentes:
  selecionam a cadeia nova, sem caminho de criação antigo/intermediário alcançável;
- diagnóstico privado com allowlist de recurso técnico, fase, idade do ticket
  e código fixo. Não inclui job/run ID, URL, token, corpo ou causa bruta.

São preservados os mesmos guards e snapshots: corpo/hash, recurso, claim,
predecessores, estado, identidade, metadata, admissão, barreira de rota,
cancelamento e grant único. O ticket continua em **1000 ms**; preparo e POST
mantêm as janelas separadas de **10 segundos**, dentro dos **30 segundos** do driver.
Não foi aumentado timer para obter aprovação.

A primeira candidata passou em 51 testes, mas uma revisão detectou que ela
colocava o preparo dentro do prazo de I/O do POST. Dois testes de observação de
timers falharam com esse escopo compartilhado. Essa versão foi preservada, mas
**não é a selecionada**. A revisão final restabelece a separação e repete aqueles
51 casos, acrescentando os dois testes de janela. Os testes observam os timers;
não os aceleram, suprimem ou substituem por prazos maiores.

Se o grant já foi persistido e o prazo vence, não há POST ou segunda tentativa,
mas o grant continua registrado. Não se inventa `NOT_SENT`, terminal Google ou
permissão de cleanup a partir dessa situação ambígua. Rejeição, cancelamento,
concorrência e confirmação perdida continuam conservadores.

## Evidências locais

O gate final passou em **53 testes**, sem falhas, skips ou cancelamentos, sob
bloqueador de HTTP/CLI reais. Inclui fronteiras de 1000/1001 ms, atraso durante
grant, cancelamento, seal, concorrência, ausência de retry, representação
sanitizada e regressões do transporte. A integração exercita CAS Java, archive,
staging, admissão e wrapper nativo concretos, com HTTP/identidade/finanças falsos;
cobre sucesso, HTTP 400, upload com confirmação perdida e retirada.

Esses 53 casos incluem regressões e oito testes de admissão reutilizados, não
53 cenários inéditos. O verificador reconferiu **159 fontes**, o grafo de produção
de **50 módulos**, os predecessores e, separadamente, os 419 fontes do gateway.
Não se apresenta checksum mobile ou resultado de tooling como cobertura Java.

O comparativo com relógio por tempo transcorrido e CAS Java real usa metadata,
HTTP e atraso de 550 ms por snapshot **sintéticos**. Ele não executa providers e
não comprova a causa histórica da rodada cloud. Seus recibos ficam em
`mount-n1-elapsed-proof.r02JTn`, preservando as comparações anteriores.

A comparação da revisão final passou em dois testes: com os mesmos oito
snapshots e atraso de 550 ms, o predecessor terminou sem grant/POST; o candidato
concluiu com um grant e um POST falso. O limite continuou em um segundo. Tempo
transcorrido observado: aproximadamente 5,37 s e 5,74 s no fluxo completo,
respectivamente; não é benchmark do provider nem de performance do aplicativo.

| Gate adicional                               | Resultado observado                                                           |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| Maven global offline, JDKs/Docker existentes | Todos os módulos `SUCCESS`, zero falhas/erros; gateway 1297 testes, 104 skips |
| Type-check web `tsc -b`                      | Exit 0                                                                        |
| Mobile `pnpm check` integral                 | Exit 0; 116 suítes/892 testes Jest, sem reinstalação                          |
| SDD                                          | Validado na cadeia integral do mobile, sem alterar estados de features        |

Os skips Maven e os avisos `act(...)` existentes não foram removidos ou tratados
como verificação operacional. Não houve alteração Java, mobile, performance,
migration, manifesto, rota pública ou default de runtime.

## Recibos privados

| Recibo                                  | SHA-256                                                            |
| --------------------------------------- | ------------------------------------------------------------------ |
| Dois GETs de predicados                 | `17f81ae62c37bb4fca6887c7426a4fc565fc6fedd9bab40f335f2f0836ed2f92` |
| Candidata intermediária, 51 testes      | `dbe4ee9c3cd9b2ebbfaec5e5a727e1ed2d41ffb7f906e3ec1444ff4224e024d2` |
| Revisão final, 53 testes                | `704c09a5add90908c17ebbb9064349d2aee67f10862a58dcdfaaaeacad0a2f59` |
| Comparação final por tempo transcorrido | `eaff7037d5ede4ec4dad821fedf26ccb2ad1bd2495c86e38e01069ba2192ed1b` |
| Maven global offline                    | `5fa7fb603ea3680a95a50e4b8055a10ab1b0690e19d9f41c46f09ed4f440ea0f` |

Os verificadores gravam saídas exclusivas; não sobrescrever seus recibos ao
reexecutar. Testes podem ser repetidos diretamente com `node --import` do
blocker existente e `--test`, selecionando os arquivos da revisão final.
O factory não constitui um comando de deploy ou autorização implícita de execução.

Conforme `database-design`, os dados adicionais são recibos privados imutáveis.
Não há banco, schema CAS5, FK, índice, contador, cache ou migration novos. O ledger
permanece com **cinco reservas, USD 25 reservados**, sem estorno automático;
isso não corresponde a gasto faturado nem hard cap do provider.

## Próxima etapa e limites

Promover a factory verificada para um operador novo, com hashes próprios e
reconferência do escopo retirado da quinta rodada. Não apagar o lock antigo,
adotar journals anteriores ou repetir a criação encerrada. Renovar os insumos
financeiros expirados e os pré-requisitos antes de qualquer nova reserva/execução.

O contrato documentado de duração de VM foi relido, sem alterar o request:
`maxRunDuration` e ação de término são campos explícitos; sua documentação não
substitui o aceite da configuração N1 pela API nem prova o isolamento do guest.
Fonte: [limite de duração da VM](https://docs.cloud.google.com/compute/docs/instances/limit-vm-runtime).

Depois da prova restrita ainda faltam boot, runtime/CVEs, memória e isolamento
do processo nativo no worker completo, renderização, qualidade e retenção no
ambiente alvo. Mount-only não encerra a 020; a aprovação do leitor local da 021
também não é antecipada por estes testes.

Continuação posterior: o [operador de 22/10](worker-isolation-fixed-operator-2026-10-22.md)
integra a revisão final e a retirada da quinta rodada. Não renova esta fotografia
histórica nem transforma os testes offline em admissão operacional.
