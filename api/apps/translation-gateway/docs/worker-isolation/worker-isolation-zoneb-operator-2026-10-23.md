# Operador B: execução e diagnóstico CRM — 2026-10-23 UTC

Continuação do [grafo candidato B](worker-isolation-zoneb-graph-2026-10-23.md).
**A integração foi executada em contexto novo. A prova parou em um GET 429 do
Resource Manager antes de criar a VM; cinco recursos Compute, rota e staging
foram retirados. Não há boot ou montagem aprovados.**
A 020 permanece `in-progress/open`; a 021 permanece `approved/blocked`.

## Integração e gates

Operador privado: `.local/worker-isolation/mount-zoneb-operator.nosZNJ/`.
Seleciona o runtime B e confere seu gate por hash; os históricos A continuam com
seus leitores/pins originais. O snapshot passivo permanece sem autoridade.
Não houve instalação, alteração Java/mobile, migration ou mudança de defaults.
O plano `database-design` preservou contexto/plano/recurso e registros financeiros
append-only, sem criar banco, índice, contador ou cache de aprovação.

A guarda da nona retirada vincula onze capturas/recibos fixados, fonte, erro
terminal da VM anterior, envio único, exclusões e ausência do lock. Não inventa
`NOT_SENT`, sucesso ou recuperação. O scanner copia o escopo antes de obter a
identidade e faz onze GETs exatos com validade de 60 s.

A composição confere **86 referências**: os 75 alvos anteriores e onze da nona
retirada. Mantém dois ramos: 64 alvos antigos em um; oitava e nona sequenciais
no outro. Falha aguarda os irmãos iniciados, sem retry/cache/ampliação de prazo.
A guarda da primeira retirada continua separada no launcher. Com metadados e
quota, a preparação propõe 93 GETs, não autorização de criação.

Gate do núcleo: **165/165**, zero falhas/skips/cancelamentos, entre
**19:31:12.115 e 19:34:41.382 UTC**. Fontes inalterados: 291 entradas; ledger
original permaneceu com nove reservas durante o gate. Inclui o coordenador
integral com CAS/admissão/ledger copiado reais locais e transportes sintéticos,
reentrega/ACK perdido, cancelamento, falha de capacidade, escopo/admissão inválidos,
verificação financeira serial e sanitização. Os dez cenários integrais também
passaram na execução preliminar; não são vinte cenários independentes.

Launcher selado depois do núcleo: **3/3**, 205 fontes, zero falhas/skips/
cancelamentos, em **19:35:15.363 UTC**. Ambos os gates bloqueiam rede/credenciais
reais. Antes da prova, preparação local e auditoria conferiram seleção B,
fontes/SDK, 86 referências carregadas, guarda inicial, cotação, ledger e ausência
de contexto/lock de execução no pacote novo.

## Gates globais e cotação

Executados em contexto novo, com dependências/imagens já presentes, sem instalação:

- Maven global offline com Docker, **19:27:58.457–19:30:39.266 UTC**: exit 0,
  sete módulos com sucesso. Gateway: 1.297 testes, zero falhas/erros, 104 skips
  opt-in; os skips não aprovam provas nativas/cloud.
- Web `tsc -b`: exit 0 em **19:28:07.749 UTC**.
- Mobile `pnpm check` integral: exit 0 em **19:28:53.939 UTC**, incluindo SDD,
  tipos, FSD/formatação e 116 suítes / 892 testes Jest.

Os logs foram revalidados depois por hash; não se alegou uma segunda execução
na retomada. Arquivos de performance, dependências, archive e evidências
anteriores foram preservados. Há um aviso global de whitespace preexistente na
landing page, fora deste escopo; não foi corrigido automaticamente.

Financeiro: dois GETs de vínculo/moeda e 14 GETs dos sete SKUs em BRL/USD, com
identidade/SDK existentes. Código e recibos históricos do coletor foram copiados
byte a byte e 143 fontes reconferidos; seus 68 testes **não foram reexecutados**
no pacote financeiro novo. Nenhum vínculo, API ou IAM foi alterado.

Cotação iniciada em **19:33:48.408 UTC**, válida até **20:33:48.408 UTC**.
Estimativa conservadora: **USD 2,11**, não fatura ou hard cap. A décima reserva
de USD 5 deixou o ledger com **dez reservas / USD 50 reservados**, não gastos
comprovados; USD 35 permanecem em slots normais, além das provisões existentes.
Não houve estorno. `billVerified=false` e `providerHardCap=false` permanecem.
Na retomada após 23:16 UTC, a cotação já estava vencida e não foi reutilizada.

## Rodada real e retirada

Rodada `mount-check-20261023-e04f69c8`, iniciada uma vez pelo launcher selecionado.
Metadados B e 86 ausências passaram antes da reserva. O transporte do runtime
registrou **19:36:55.240–19:42:56.048 UTC**:

| Método/status | Quantidade |
| ------------- | ---------: |
| GET 200       |        272 |
| GET 404       |        146 |
| GET 429       |          1 |
| POST 200      |          7 |
| DELETE 200    |          6 |
| DELETE 204    |          2 |

São **434 requisições do transporte**, sem erro de transporte capturado. A
contagem não inclui leituras preparatórias, preços, autenticação SDK ou o
diagnóstico posterior. Sete POSTs correspondem exatamente a dois de staging e
cinco criações Compute: rede, sub-rede, ingress, egress e imagem de dados.
O audit complementar reconstrói cada hash de POST Compute com seu request ID;
não usa a ausência de um hash sem query para inferir que não houve criação.

A intenção de disco de dados foi registrada, mas o journal selado não tem seu
dispatch; não há intenção de boot disk/VM. O trace disponível tem zero eventos
e `rawFetchInvoked=false`, como esperado antes da fronteira VM. Isso não é usado
isoladamente como autoridade de ausência. Não foi observada nem excluída uma
VM, e nenhum terminal de disco/VM foi inventado.

O relatório terminal é `supervisor-failed-and-retired`, com quiescência,
`activeAbsenceConfirmed=true`, `requiresRecovery=false` e lock da rodada ausente.
Na retomada às 23:16 UTC o handle da sessão original já estava indisponível;
a auditoria usou os arquivos terminais, não reiniciou a execução nem alegou
observação contínua desse intervalo.

A auditoria local posterior conferiu cinco deletes Compute `DONE` sem erro,
IDs/alvos vinculados às criações e mutações únicas, rota retirada, deletes GCS
com geração/metageração e onze últimos GETs 404 do escopo. São evidências da
**ausência ativa na captura**, não uma nova consulta de estado às 23 h. Soft
delete de sete dias pode reter bytes recuperáveis/faturáveis; destruição física
não foi comprovada. Ledger, fontes e logs globais foram reconferidos sem nova
credencial, consulta cloud ou reserva durante essa auditoria.

## GET recusado e comparação posterior

O hash da requisição que recebeu 429 identifica exatamente
`GET https://cloudresourcemanager.googleapis.com/v1/projects/toonlira-rm`, sem
query, em **19:40:53.673 UTC**, na fase `dataDisk / metadata`. Houve apenas seis
chamadas desse endpoint na captura: cinco 200 e a sexta 429. O corpo e os
detalhes da resposta histórica não foram retidos: **a causa específica de quota
não está comprovada**.

Os [limites publicados do Resource Manager](https://docs.cloud.google.com/resource-manager/docs/limits)
incluem limites por consumidor e recomendam avaliar limitação no cliente. Não
informam o limite efetivo deste projeto/credencial, nem o uso de outros clientes.
A [documentação do token gcloud](https://docs.cloud.google.com/sdk/gcloud/reference/auth/print-access-token)
orienta usar `x-goog-user-project` quando for necessário explicitar o projeto de
cota e exige `serviceusage.services.use`. A [visão geral de quota project](https://docs.cloud.google.com/docs/quotas/quota-project)
explica que credenciais de usuário via gcloud às vezes usam seu projeto compartilhado.
Isso é uma hipótese técnica relevante, **não reconstrução da resposta perdida**.

Preparou-se um leitor separado com 13/13 testes sintéticos, projeção fechada de
erro e limite de corpo/prazo, sem retry. Uma única comparação real, com a mesma
identidade e o SDK fixado, consultou o mesmo endpoint duas vezes:

| Consulta                           | Horário UTC  | Resultado                             |
| ---------------------------------- | ------------ | ------------------------------------- |
| Sem quota project explícito        | 23:23:36.779 | 200, projeto ativo e número conferido |
| `x-goog-user-project: toonlira-rm` | 23:23:37.006 | 200, mesmo corpo por hash             |

Ambas foram aceitas; não se reproduziu o 429. Não houve grant, API habilitada,
alteração de ADC/configuração ou criação/repetição de recurso. Token e corpos
ficaram em memória; só hashes/status e projeção sanitizada foram salvos. O
resultado atual não demonstra resolução definitiva do erro anterior nem admite
uma nova prova de montagem. Providers e imagens de mangá não foram envolvidos.

## Rastreabilidade

| Artefato               | SHA-256                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| Núcleo 165             | `51a2fba43a8d823ab705a66f1d5be510fb213905cce96c78cbbc0e1ff40577e2` |
| Launcher 3             | `39a122eccf7b0d5556ae955ff0dff21a5bf404927417516de1c76f930f291e35` |
| Relatório da rodada    | `df7237a2066a1da5aa98dd466f29cd9260416a4e19bb7e0758eb60994cda3d43` |
| Transporte             | `76dce20e7a07bba98d860f05440cde8c6d73a6102081b80047723680dd83511b` |
| Auditoria pós-retirada | `b83a574dc4eb8fbe0426ad4f6c936ec6fbe28f91ea394473d97b678de8149d83` |
| Cobertura dos POSTs    | `954cedf16caa6d6d8a66778f4fe0216ab851711ff9e8610fa5368cd290446427` |
| Gates globais          | `c862b57030e37356a74582ee41ca38a57835d2e97999f9df86e5ce0eaefcec72` |
| Gate do leitor CRM     | `a5aecc094173a66da2289b125b598a4b0cfd9b39683f786607553d19382d2de2` |
| Comparação CRM real    | `5c1c275a52671431800c8abcdda68f8ed3a55db1d4bf549e6c132d8a5cbf18cb` |

Leitor privado: `.local/worker-isolation/mount-crm-quota-diagnosis.SJvX7H/`.
Fontes técnicos do gateway permanecem 419, checksum
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Não apresentar checksum mobile como cobertura Java nem atualizar conclusões
históricas. Contextos, recibos, journals e reservas encerrados são imutáveis;
não repetir scripts de escrita exclusiva ou reutilizar esta rodada.

## Próximo trabalho

Preparar o consumidor de cota explícito no I/O nativo, derivado do projeto fixo,
sem permitir headers arbitrários do chamador, retirar verificações, aumentar
prazos ou repetir criações. Tratar isso como redução de ambiguidade de roteamento,
não causa histórica provada. Registrar detalhes de quota sanitizados se houver
nova recusa, sem copiar mensagens ou IDs de consumidores para logs.

Depois integrar a décima retirada aos guards e obter pré-flights/cotação frescos
em novo contexto antes de outra prova autorizada. Continuam abertos montagem,
boot/segurança, memória total, falhas/recuperação, worker privado, qualidade e
retenção operacional. Não habilitar uploads, providers, produção ou a 021.

Continuação: o [candidato local de cota explícita](worker-isolation-crm-quota-native-2026-10-23.md)
implementa essa mudança delimitada e uma checagem final de cancelamento. O
operador desta fotografia e seus recibos permanecem intactos; integrar o novo
candidato exige outro contexto com os guards atualizados.
