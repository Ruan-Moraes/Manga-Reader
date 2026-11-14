# Reconciliação do schema observado — 2026-10-17

Continuação do [pré-flight](worker-isolation-read-preflight-2026-10-17.md) e do
[suplemento de custo](worker-isolation-cost-supplement-2026-10-17.md). Preparação
somente leitura, seguida de correção/testes locais. Não cria recursos, grants,
reservas, instalações, uploads ou chamadas a providers. Não admite COS, renderer
ou worker. 020 permanece `in-progress/open`; 021 bloqueada.

## Observações reais e limites

Recibos privados exclusivos em
`.local/worker-isolation/mount-read-preflight.kgsuJO/`, ignorados pelo Git:

| Observação                                         | Resultado                                                                                                              | O que não comprova                                                                  |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `inspect-control-plane.mjs --authorized-read-only` | Projeto ativo; 34 das 40 permissões consultadas retornadas no teste do projeto                                         | Não comprova acesso a cada recurso futuro nem sucesso de criação/importação         |
| Seis permissões Storage não retornadas             | Consultar bucket/IAM e criar/ler/excluir/listar objetos não retornaram no escopo do projeto                            | Não prova ausência de grants no bucket; não autoriza ampliar IAM                    |
| Imagem COS fixada                                  | GET de metadados teve sucesso; teste de `compute.images.get` e `compute.images.useReadOnly` retornou HTTP 200 com `{}` | O teste não retornou permissão; não é aprovação nem diagnóstico conclusivo da causa |
| Primeira leitura de routers                        | Pré-flight interrompido por schema inesperado                                                                          | A falha permanece registrada, não convertida retroativamente em sucesso             |
| Diagnóstico separado                               | Cinco GETs, sem mutação; identidade/SDK preservados                                                                    | Não executou os leitores do ciclo contra uma rede própria nem criou uma VM          |

O diagnóstico de `routers.aggregatedList` e `packetMirrorings.aggregatedList`,
ambos com `includeAllScopes=true`, observou 43 grupos regionais, 132 zonais e um
global. Todos continham somente warning `NO_RESULTS_ON_PAGE`, sem recursos,
página seguinte ou escopos inacessíveis. Os leitores anteriores aceitavam apenas
nomes `regions/...`, rejeitando uma resposta vazia legítima.

O GET completo, sem projeção `fields`, de `default/getEffectiveFirewalls`
retornou quatro regras e omitiu `firewallPolicys`. O ID da rede permaneceu igual
nos GETs anterior/posterior. Essa rede não pertence à rodada: **não** é evidência
de duas regras deny próprias nem aprovação de sua política. O registro conserva
hashes/bytes e estrutura sanitizada, não respostas brutas ou regras.

Referências de contrato:
[routers agregados](https://docs.cloud.google.com/compute/docs/reference/rest/v1/routers/aggregatedList),
[packet mirroring](https://docs.cloud.google.com/compute/docs/reference/rest/v1/packetMirrorings/aggregatedList),
[firewalls efetivos](https://docs.cloud.google.com/compute/docs/reference/rest/v1/networks/getEffectiveFirewalls),
[teste IAM da imagem](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images/testIamPermissions).
A regra de omissão de coleções vazias é compatível com
[ProtoJSON](https://protobuf.dev/programming-guides/json/); não a generalizar
para respostas parciais, campos desconhecidos ou permissões omitidas.

## Correção local versionada

Fontes históricos e seus recibos permanecem intactos. A revisão local nova usa
`readers-v2.mjs`, que importa `reader-v2.mjs`, `cycle-v2.mjs` e `binding-v2.mjs`
nos respectivos diretórios privados já existentes. Não substituir silenciosamente
os imports dos executores antigos nem tratar seus recibos como cobertura da v2.

- Aceitar nomes de escopo global/zonal **somente** com warning conhecido e sem
  propriedade de recursos. Arrays de recursos nesses escopos, mesmo vazios,
  continuam rejeitados; recursos válidos continuam restritos a regiões.
- Aceitar `firewallPolicys` omitido ou array vazio no GET completo. `null`,
  objeto e lista não vazia continuam rejeitados. As duas regras deny próprias,
  IDs e configuração ainda precisam corresponder exatamente.
- Preservar limites, paginação completa, rejeição de escopos inacessíveis,
  guard antes da criação e releituras antes/depois, lease e cleanup por identidade.
- Não reescrever a resposta para fabricar arrays, IDs, regras ou evidência.

Seis regressões sintéticas foram escritas antes da correção: três falharam com
os leitores antigos e três testes de rejeição passaram. A suíte copiada de 24
casos anteriores permanece integralmente presente, agora também dirigida à v2.
O ensaio `rehearse-v2.mjs` exercita em HTTP falso os dois formatos observados,
incluindo captura serial/configuração e retirada; não procura ADC/rede Google.
Respostas/serial/IDs desse ensaio são sintéticos, não boot COS.

## Integridade e pendências

| Recibo privado              | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `control-plane.json`        | `1092b414e2d6d00b4e9b03f1843752182211b6e30e46deaafab58c6a8f05a851` |
| `aggregate-diagnostic.json` | `96e367d8bc10ce028d4acbb755de6745ac47a08c9d2a5ee7215cef64763c399a` |

O primeiro conserva `control-plane-read-only-preflight-unconfirmed`; o segundo,
`schema-diagnostic-recorded-not-operationally-approved`. Nenhum recibo anterior
foi sobrescrito. A confirmação IAM da imagem pública permanece inconclusiva;
Storage precisa de verificação no recurso correto, não de grant presumido.

Ainda faltam cotação completa, revisão COS delimitada, staging/geração real,
admissão e autorização operacional final. O envelope provisório de US$ 0,66 não
é teto nem fatura; o limite continua US$ 5 total, sem reserva nova nesta parcela.
Prova de montagem de 1 GiB não admite o worker completo validado localmente em
outro envelope. Maven/web/mobile/SDD não são redatados pelos testes de tooling.
Arquivos de performance, runtime, migrations e defaults permanecem preservados.

## Ordem das próximas verificações

Não repetir probes de projeto esperando que comprovem um recurso futuro. O
[teste IAM de bucket](https://docs.cloud.google.com/storage/docs/json_api/v1/buckets/testIamPermissions)
é um GET no bucket específico e não recebe body. Sua documentação distingue as
permissões de projeto das de bucket. Quando houver staging próprio autorizado,
conferir metadados/projeto/proteções e testar ali as permissões necessárias antes
do upload. Não usar o bucket OCR/site como substituto, criar um objeto para
"testar" ou ampliar IAM automaticamente. Ausência de confirmação interrompe o
fluxo e preserva as regras de retirada por identidade.

Para COS, o contrato de
[images.testIamPermissions](https://docs.cloud.google.com/compute/docs/reference/rest/2026-09-01/images/testIamPermissions)
descreve um subconjunto de permissões e lista `compute.images.list` como requisito
adicional. Não explica por si só o `{}` observado, nem permite concluir que o GET
de metadata comprova uso para boot. A
[orientação IAM](https://docs.cloud.google.com/iam/docs/testing-permissions)
recomenda Policy Troubleshooter para diagnóstico de acesso. Usá-lo poderá exigir
API/permissões adicionais, que não serão habilitadas/concedidas silenciosamente.
Não deduzir a causa, tentar outra identidade ou substituir a imagem para tornar
o teste verde.

A próxima decisão operacional deverá declarar essas pendências, o limite total
e o escopo exato. Montagem mínima, worker completo e qualidade do resultado
continuam sendo verificações diferentes; o sucesso de uma não aprova as demais.

## Verificação local desta revisão

Os 30 testes dirigidos (24 casos anteriores copiados e seis regressões de schema)
passaram, sem falhas, cancelamentos ou skips. O ensaio HTTP falso concluiu oito
POSTs sintéticos, retirou a rota antes da instância, conferiu firewall antes do
boot e terminou sem recursos/source ativos no fake. Seu recibo exclusivo
`mount-http-readers.zqZtUf/http-rehearsal-v2.json` tem SHA-256
`d623a1087cb4208085d3a2831fe29581ddf72c742d47e71f92d92dc64d16233d`.
Não é boot real, teste do renderer ou aprovação de custo.

A primeira tentativa do verificador conjunto alcançou o fim dos testes com
exit 0 do subprocesso, mas falhou no registro com `EEXIST`: o nome `tests.tap`
pertencia ao recibo histórico. `wx` impediu sobrescrita; o arquivo anterior
permaneceu intacto. Não houve recibo novo nem publicação de contagem aprovada
por essa tentativa. `verify-schema-v2-final.mjs` usa destino exclusivo e recusa
sua existência antes de iniciar. A execução final estava em andamento ao
registrar esta parcela; o resultado conjunto continua pendente até seu término.

## Fechamento posterior — 12:46:50 UTC

`verify-schema-v2-final.mjs` terminou com exit 0: **669 testes em 54 arquivos**,
zero falhas, cancelamentos, skips ou TODOs; duração 345.047 ms. Os testes usam
somente dependências locais/falsas, sem ADC ou serviços Google. Não confundir as
consultas reais separadas com execução do lifecycle real.

Recibo privado `mount-read-preflight.kgsuJO/verification-schema-v2-final.json`:
`15b3df2c0fa959029eb5e323481649f4d7a54429e730f2ddecd676528d8fab3b`.
TAP exclusivo em `schema-v2-tests.tap`; o `tests.tap` histórico não foi alterado.
Os quatro fontes v2, testes, ensaio, scripts de diagnóstico e verificadores têm
seus hashes no recibo. As duas tentativas de verificação continuam distintas;
o erro de registro anterior não foi apagado ou convertido em sucesso histórico.

Conferidos sintaxe, Prettier dirigido, 161 links relativos e diff do escopo.
Recibos/fontes anteriores pinados, ledger com duas reservas e fotografia do
gateway preservados: 419 paths/bytes, SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Essa fotografia não cobre Dockerfile, mobile, documentos ou tooling privado.
Maven/web/mobile/SDD não foram reexecutados nem redatados por esta revisão.
Diff global continua com a linha vazia alheia no EOF de
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, preservada.

Os diagnósticos intermitentes históricos permanecem abertos. A execução verde
não comprova a causa deles nem dispensa revisão COS, acesso no recurso correto,
cotação completa, staging/geração real e autorização operacional final. Não
houve nova reserva ou mutação cloud. O fechamento foi acrescentado depois do
recibo e reconferido por formatação/diff, sem sobrescrever evidências.
