# Transporte de criação vinculado ao journal — 2026-10-15

## Resultado e escopo

Continuação do [driver com barreira da rota](worker-isolation-guarded-driver-2026-10-15.md).
Acrescentado transporte HTTP privado de criação, composto internamente com o
driver e os journals existentes. A validação usa exclusivamente uma API falsa,
IDs sintéticos e relógio lógico. Nenhuma chamada autenticada ao Google ocorreu.

Tooling ignorado pelo Git: `.local/worker-isolation/mount-create-http.obXu17/`.
Sem instalação, recurso cloud, reserva nova, upload, Vision, tradução ou execução
COS/worker. Aplicativo, migrations, defaults e auditoria de performance não foram
alterados. 020 continua `in-progress/open`; 021 segue bloqueada.

## Entrada e envio único

`createHttpMountDriver` expõe somente `create(key, signal)` e `close()`. A factory
não faz I/O, não busca ADC e não tem credencial, fetch ou admissão implícitos.
Não exporta insert, URL livre ou body arbitrário. Reconstrói o bundle canônico e
vincula o journal ao plano. As oito keys usam exclusivamente seus endpoints e
bodies previamente revisados, limitados a 128 KiB.

O bootstrap sem plano de rota permite os primeiros sete recursos, nunca a VM.
O chamador só poderá reconstruir o driver completo depois de observar a rede e
confirmar sua barreira de rota. Não se inventa um ID para liberar o bootstrap.

Cada POST exige a intenção durável concedida pelo journal, seu requestId e hash
do body, ausência de retirada e predecessores terminais sem erro. O requestId é
enviado como query UUID; a resposta deve corresponder à operação, escopo, recurso
e tentativa. O mecanismo local não depende apenas da deduplicação oferecida pelo
Google. Referência: [instances.insert](https://docs.cloud.google.com/compute/docs/reference/rest/v1/instances/insert).

Somente respostas válidas são registradas. User, mensagem bruta e outros campos
do provider são descartados; erros viram apenas uma indicação sanitizada.
`operation-bound` não equivale a recurso pronto: RUNNING/PENDING não libera a
próxima criação. DONE com erro também não libera o predecessor.

403, 429, 500, 503, timeout, resposta perdida, erro de parsing ou confirmação
local perdida não geram retry. A intenção permanece, inclusive quando uma
verificação falha antes do POST. Nova factory consulta o journal e retorna
`already-attempted`; recuperação usa o reader anterior para procurar a operação
por UUID e confirmar seu estado, sem reenviar a criação.

## Verificações anteriores ao POST

- Resource Manager: projeto ACTIVE, projectId e hash do projectNumber esperado.
  Não confunde projectNumber com o ID retornado pela API Compute.
- Compute: metadados herdados do projeto vazios; identidade fresca de todos os
  predecessores, seus IDs terminais, ownership e configuração esperada.
- Rede/sub-rede/firewalls: configuração privada canônica e regras deny-all;
  alterações de identidade, peerings ou políticas incompatíveis interrompem.
- Imagem e discos: READY, arquitetura/tamanho e sourceImageId correspondentes;
  discos sem users/resource policies. COS conferido pelo nome e ID fixados.
- Antes de importar a imagem, metadados do bucket privado e objeto: ownership,
  projeto, localidade, proteção pública, versões e tamanho. Consulta a geração
  fixada e também a versão corrente do objeto, rejeitando divergência.
- Antes da VM, repete a barreira de rota dentro do transporte, depois das
  consultas lentas e da admissão final. Revalida journal e validade da decisão
  imediatamente antes de enviar.

Uma regressão vermelha mostrou que a admissão final poderia alterar o estado da
rota depois da barreira anterior. A barreira interna foi movida para depois
desse callback; o mesmo cenário agora impede o POST.

Os metadados SHA-256 do objeto **não provam seu conteúdo**. Readback da aquisição
e conferência do conteúdo montado continuam gates próprios. Não se afirma que
o importer seleciona uma geração por query no rawDisk.source. Também não se
exige que a resposta da imagem ecoe esse campo, limitação já observada na rodada
histórica. Ver [images.insert](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images/insert)
e [disks.insert](https://docs.cloud.google.com/compute/docs/reference/rest/v1/disks/insert).

## Limites e segurança

Somente origens e paths derivados internamente de Compute, Resource Manager e
Storage; redirects recusados. Credencial injetada, mantida apenas em memória e
descartada no close, sem renovação ou retries implícitos. Conclusão tardia da
aquisição de credencial depois de close não envia nada.

Cada método de transporte tem prazo total de dez segundos, incluindo credencial,
consultas e leitura da resposta; cada resposta JSON tem limite de 256 KiB. Sinais
de abort são propagados. Close cancela chamadas ativas, e verificações após awaits
impedem envio tardio. Há limite de oito chamadas ativas, sem fila ilimitada.

Não existe transação distribuída entre GET, journal local e POST. Mudança por
outro operador após a última consulta continua sendo risco; exige controle
exclusivo da rodada. Esse transporte não é aprovação do host, da rede, do COS ou
da arquitetura de isolamento. O bundle mantém `executable=false` e os resultados
mantêm `operationalApproved=false`.

A admissão continua sendo porta falsa nos testes; nenhum adapter operacional
foi criado para comprovar os gates de custo, autoridade e segurança. Não existe
CLI que escolha credencial ou habilite este transporte automaticamente. O
teardown completo com retirada da rota também não foi integrado nesta parcela.

## Testes e rastreabilidade

```bash
node --test .local/worker-isolation/mount-create-http.obXu17/http.test.mjs
```

O teste inicial foi executado vermelho antes da implementação. Exercita journals
reais de arquivo e o helper Java anterior, compilado em diretório temporário
próprio e removido ao final. Não instala dependências nem copia RAW, archive ou
JRE. A API é falsa mesmo quando recebe objetos URL com hosts oficiais.

Cobertura: oito POSTs canônicos, concorrência/reabertura, resposta perdida,
confirmação perdida, operação pendente/com erro/inválida, colisão de nome,
expiração, cancelamento/close, resposta excessiva, timeout e conclusão tardia,
identidade do projeto, metadados herdados, gerações do objeto, proteção do bucket,
COS/discos alterados e barreira da rota depois de callbacks lentos.

| Artefato privado | SHA-256                                                            |
| ---------------- | ------------------------------------------------------------------ |
| `http.mjs`       | `7b4966794e7679e0ca5ea679bab61fa99d0f8654796930359d654bb762a0e14f` |
| `policy.mjs`     | `9a89f6d7fca8570e3c39a4dc59a9f1351d3d81837fe96b8eab37d103b0d449e4` |

O fechamento local verificará a suíte conjunta, fontes e recibos anteriores,
ledger, links, sintaxe, formatação e diff direcionados. Maven/web/mobile/SDD não
serão redatados nesta parcela de tooling privado e documentação.

## Próxima etapa operacional

Integrar a retirada da rota ao teardown completo, depois preparar admissão real,
revisão COS limitada à montagem e cotação/reserva completas. Somente então
decidir sobre a execução cloud. Nenhum novo slot consumido: o limite total de
US$ 5 continua inalterado e não representa teto imposto pelo provedor.

## Fechamento observado

Suíte conjunta: **545 testes aprovados**, zero falhas, cancelamentos ou skips;
32 casos novos. Inclui timeout efetivo de dez segundos contra API falsa, sem
segunda tentativa nem gravação tardia de operação. Conferidos 145 links relativos,
sintaxe, Prettier direcionado e diff dos documentos afetados.

Fonte técnica preservada: 419 paths/bytes do gateway, SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Esse hash não cobre Dockerfile, mobile, documentação, tooling privado ou aprovação
do host. Recibos anteriores e ledger de duas reservas permanecem íntegros, sem
novo slot ou consulta de fatura. O Mac mantém aproximadamente 23 GiB livres;
a nova parcela ocupa aproximadamente 172 KiB em disco, sem cópias grandes.

O diff-check global continua com o finding alheio em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, linha vazia no EOF.
Esse arquivo não foi alterado. Maven/web/mobile/SDD não foram reexecutados nem
tiveram resultados anteriores redatados. Uma consulta auxiliar de processos via
`ps` foi recusada pelo sandbox; não foi escalada e não afetou os testes.

`verification.json`:
`9d8f396fe56fcf768e6c128fab0e1410d54599fc17320646e56fc3ee6ea0104d`.
Este fechamento foi acrescentado após o recibo, sem sobrescrevê-lo, com nova
conferência de formatação, links e diff direcionados.
