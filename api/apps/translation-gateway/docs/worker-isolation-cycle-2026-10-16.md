# Ensaio integrado do ciclo mínimo — 2026-10-16

## Resultado e limites

Continuação da [retirada integrada](worker-isolation-teardown-2026-10-15.md).
Ligados os adapters existentes de criação, observação de operações, retirada da
rota, vinculação de captura e cleanup. O ensaio completo usa HTTP falso, metadados
de origem sintéticos, marcadores seriais sintéticos e journals reais de arquivo.
**Não executou COS, montagem, OCR, tradução ou renderer.**

Tooling privado ignorado: `.local/worker-isolation/mount-cycle.KFUw2o/`. Não usa
credenciais reais, instala pacotes, envia arquivos, consulta recursos Google ou
consome nova reserva. Não altera runtime, migrations, defaults, mobile ou arquivos
de performance. 020 permanece `in-progress/open`; 021 bloqueada.

## Sequência efetivamente composta

`runMountCycle` exige bundle canônico, journals vinculados, portas explícitas e
dois sinais de cancelamento independentes. Não oferece SDK, fetch, ADC ou
admissão implícitos. Sem `admit`, a criação fica negada antes da credencial.
As portas de cleanup são conferidas antes de qualquer criação.

1. Confere journal inicial sem tentativas anteriores e inicia a rede pelo driver
   HTTP existente. Só quem recebe a concessão dessa criação continua o ciclo;
   concorrente ou reexecução não avança a criação alheia.
2. Observa a operação por handle/UUID até DONE sem erro, sem repetir POST. Os
   GETs são limitados a 120 observações por etapa, pausa explícita de um segundo
   e janela original do bundle. Falha ambígua exige reconciliação, não replay.
3. Adquire contexto de rota pela porta explícita `prepareRoute`. Plano/journal
   devem corresponder ao bundle e ao network ID observado. Retira a rota pelo
   adapter anterior, com consultas frescas; só então cria os demais recursos.
4. Cria sub-rede, firewalls, imagem e discos, assentando cada operação antes de
   avançar. A VM usa outro driver com a barreira de rota já vinculada; mantém
   todas as verificações frescas do transporte de criação.
5. Deriva a identidade esperada da captura exclusivamente do journal. Reutiliza
   `collectEvidence`: snapshots anterior/posterior e páginas seriais limitadas,
   validados contra a configuração e os IDs observados.
6. Fecha os clientes de criação/observação e tenta a retirada integrada com um
   sinal independente. Falha ou cancelamento de captura não dispensa cleanup.
   Captura válida sem retirada confirmada retorna `cleanup-unconfirmed`, não
   ciclo concluído.

A retirada da default route agora ocorre logo após confirmar a rede, antes das
demais criações. Isso preserva a exigência anterior à VM; a rota automática de
sub-rede continua submetida à validação existente. Não relaxa rede/firewalls.

Uma reexecução com journal anterior retorna `cycle-already-attempted`, sem novas
consultas autenticadas, criação ou captura. Recuperação de rodada interrompida
usa a entrada explícita de retirada anterior, não reinício automático do ciclo.

## Captura e identidade

`bindingFromJournal` exige oito recursos canônicos, intenções correspondentes,
handles/terminais consistentes, DONE sem erro e IDs distintos. Recusa journal
selado, delete iniciado, identidade inventada, duplicada ou operação incompatível.
O hash esperado de user-data vem do bundle canônico, não da captura recebida.
O resultado é imutável e não contém texto OCR, resposta bruta ou credenciais.

Na primeira execução, o binding foi aceito, mas a captura falsa foi recusada:
faltavam os índices de discos presentes na projeção esperada do provider. A
fixture foi corrigida; nenhum validador ou request de produção foi relaxado.

Dois outros testes vermelhos localizaram falhas do novo coordenador: porta de
cleanup incompleta só detectada depois da criação e ACK cancelado depois de
gravar claim sem sinalização de recuperação. Corrigidas a validação antecipada
das portas e a indicação `requiresRecovery` após releitura do journal local.
Um retorno bloqueado não prova ausência de intenção durável.

## Falhas e propriedade da rodada

Uma resposta de criação perdida é reconciliada com GET por UUID/handle; não
dispara segundo POST. Operação pendente impede dependentes. Rota não confirmada
impede VM e captura. Falha ou drift da captura não impede a retirada de recursos
com ownership válido, mas tampouco autoriza apagar recursos de identidade incerta.

Se não houver contexto de rota confiável, não o inventa para conseguir limpar:
deixa `route-context-required` e exige recuperação explícita. Se a limpeza ficar
pendente, `requiresRecovery=true`; não anuncia ausência de recursos. Cancelamento
de ACK local também exige inspeção do journal, pois o commit pode já ter ocorrido.

As portas de preparação/observação têm limites e sinais propagados. Clientes
de criação são fechados antes de cleanup; callbacks tardios não avançam etapas.
Erros recebem somente códigos internos fixos. Texto de captura não entra no
relatório do ciclo, apenas contagem/hash serial e indicação de vinculação.

O coordenador fecha os clientes que constrói. O ciclo de vida de clientes
eventualmente usados pelas portas externas `prepareRoute`/`mountRead` continua
pertencendo ao chamador; não fecha arbitrariamente portas compartilhadas.

## Ensaio reproduzível salvo

```bash
node --test .local/worker-isolation/mount-cycle.KFUw2o/cycle.test.mjs
node .local/worker-isolation/mount-cycle.KFUw2o/rehearse.mjs
```

O segundo comando é **exclusivamente simulado**, importa fixtures de teste e
recusa sobrescrever `cycle-rehearsal.json`. Não aceita modo cloud, credencial ou
URL por argumento; não deve ser confundido com executor operacional.

Observado no ensaio: oito POSTs falsos, onze DELETEs falsos, retirada da rota
antes da VM, três leituras falsas de captura e zero recursos/origem ativos ao
final da simulação. Esses números não são chamadas Google nem custos observados.
O `1..0` emitido pela inicialização do helper Node não conta como suíte aprovada;
os testes são executados separadamente pelo verificador.

| Artefato privado       | SHA-256                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `cycle.mjs`            | `3ef7e12d4882b79046cb924dfb8b8e22286e30cfbbcd749261553125c3fabab0` |
| `cycle-rehearsal.json` | `0a442cce2ae3e00fe7241c69085e554acf0714f960de03e8a2ffbd756654f03f` |

Os testes cobrem também reexecução/concorrência, expiração/negação de admissão,
operação pendente, contexto de rota incompatível, reaparecimento da rota,
captura inválida/drift, cancelamento e cleanup incompleto. Compilam somente o
helper Java anterior em diretório temporário próprio; sem cópia de RAW/JRE.

## O que ainda não foi entregue

O input Storage já existe na fixture; não houve aquisição/upload real. As portas
`prepareRoute` e `mountRead` continuam injetadas: seus adapters operacionais de
aquisição de contexto e captura ainda precisam ser ligados e validados. O ensaio
prova composição e validação, não que dados recebidos por essas portas sejam
atestação real. Mantém `sourceGenerationSelectionVerified=false` e
`operationalApproved=false`.

O reader HTTP de configuração/serial anterior já existe em
`.local/worker-isolation/mount-transport.XgBcjD/reader.mjs`, com contrato de
identidades completas. A pendência é vinculá-lo ao novo binding do journal e
adquirir o contexto inicial da rota sem presumir ausência. Os flags de adapter
real neste fechamento descrevem a composição atual, não a inexistência de todos
os helpers HTTP anteriores; não é necessário reimplementá-los silenciosamente.

Admissão operacional com identidade, provas de segurança COS, cotação completa,
reserva e autorização final continuam pendentes. O teto total de US$ 5 não foi
alterado ou consumido por esta parcela. O worker completo ainda exige sua prova
de isolamento; a prova mínima de montagem não a substituirá.

O fechamento local revalidará suíte conjunta, recibos/fontes anteriores, ledger,
links, sintaxe, formatação e diff direcionados. A falha agregada não localizada
da parcela anterior permanece registrada, sem ser reclassificada como resolvida.
Maven/web/mobile/SDD não serão redatados sem execução dessas superfícies.

## Fechamento observado

Suíte conjunta: **590 testes aprovados**, zero falhas, cancelamentos ou skips;
20 casos novos. Inclui as duas regressões do coordenador e os testes de vínculo,
cancelamento, concorrência e encerramento. O ensaio salvo revalida os arquivos
do próprio ciclo e distingue todos os metadados/markers sintéticos.

Conferidos 149 links relativos, sintaxe, Prettier e diff direcionados. Recibos
anteriores, repetição anterior e ledger de duas reservas preservados por hash.
A fotografia dos 419 paths/bytes do gateway permanece
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Não cobre Dockerfile, mobile, documentação, tooling privado ou aprovação do host.
Não houve consulta de fatura, nova reserva, instalação ou credencial real.

O diff global conserva somente o finding alheio em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, linha vazia no EOF;
esse arquivo não foi alterado. A falha agregada não localizada da parcela anterior
continua em aberto, sem ser apagada pelo resultado verde atual. Não foram
reexecutados Maven/web/mobile/SDD ou testes operacionais Google.

`verification.json`:
`960190ac6ed5ace0dc4e7cb9989890f4c823d430dc880515a7d6247433e17a9a`.
Fechamento acrescentado depois do recibo, sem sobrescrever capturas, relatórios
ou fontes anteriores; links/formatação/diff conferidos novamente em escopo
direcionado. A 020 não foi promovida e a 021 permanece bloqueada.
