# Validação técnica prioritária da 020 — 2026-10-30

Estado: **rodada executada e recursos retirados**. TASK-006/008 e a 020 continuam abertas; a 021 permanece
`implemented`. Este registro não admite deploy ou o orçamento de produção.

## Autorização, ambiente e preservação

Ruan autorizou recursos temporários privados em `toonlira-rm`, região
`southamerica-east1`, com teto total US$ 20 e interrupção preventiva de novas
execuções na previsão de US$ 15. Dados sintéticos e providers falsos; nenhuma
chamada OCR/Translation paga ou ativação pública da feature.

Recibos exclusivos em `.local/mob020-validation-20261029/`. A fotografia inicial
registrou hashes de 204 arquivos regulares alterados/não rastreados; o inventário
complementar recursivo registra 333 arquivos efetivos, com sua data própria.
Nenhum arquivo inicial foi removido. Código, capturas e evidências anteriores
foram preservados; não houve reset, descarte ou limpeza abrangente do workspace.

Preflight confirmou projeto ativo, billing habilitado, APIs necessárias já
habilitadas, quota E2 disponível e permissões do operador. O bucket novo tem
acesso uniforme, prevenção de acesso público, versionamento, soft delete zero
e nenhum hold/retention lock. Identidades sem chave têm permissões restritas
ao bucket, registry e conta assinadora criados nesta rodada.

VM principal: `e2-highmem-2`, x86_64, 16 GiB, disco `pd-standard` de 20 GiB,
sem IP externo, sem ingresso permitido, SSH, IAP, NAT ou Cloud SQL. COS
`cos-125-19216-760-20`, ID `2384932116280116826`, kernel `6.12.113+`, Docker
`27.5.1`, cgroup v2. Reinício automático desabilitado; parada absoluta em
2026-10-30T13:10:24.242Z, quatro horas após criação, preservada na retomada.

A VM curta de diagnóstico reutiliza rede, bucket e identidades e possui limite
de 20 minutos. Sua finalidade é localizar a asserção de entrega sem interromper
a observação real de uma hora na VM principal. Não é uma matriz adicional.

## Correção reproduzida e integridade da evidência

O primeiro contexto GCS na VM falhou por seleção de construtor do
`GoogleCloudStorageAdapter`: havia dois construtores e nenhum era indicado ao
Spring. `ApplicationContextRunner`, com SDK simulado e sem rede, reproduziu
`NoSuchMethodException: GoogleCloudStorageAdapter.<init>()`. A indicação
`@Autowired` no construtor configurado corrigiu o defeito; os 26 testes focados
do storage e do harness passaram. Não há migration, alteração de contrato ou
mudança de defaults.

- Red: `gcs-spring-constructor-red.log`, SHA-256
  `7cd1b8de67a292773446743086d0932eb575aad3f426088b832cf38233cae5f8`.
- Green: `gcs-spring-constructor-green.log`, SHA-256
  `8460bcc51272008cb2ed05357d2c192d16e0aad60d39b01da2c253b14f63ab78`.
- JAR corrigido: SHA-256
  `74e9a9b3cd0f9f2dce1e9e0e153eb77bcb8fe2ee3b5cf4c0308ea4dbca9ba57f`.

Dois problemas do harness foram distinguidos do produto: faltavam os JARs de
Spring Test no classpath dos probes standalone; e mensagens do sistema
intercalaram frames longos da serial. A carga foi reproduzida localmente com
rede desabilitada. O classpath corrigido alcança o guard explícito de opt-in;
frames fragmentados agora verificam SHA-256 por trecho e do arquivo completo,
com limites e três regressões de corrupção, repetição e interleaving. Os
recibos anteriores foram conservados e a coleta reinicia seu cursor após o boot.

## Resultados comprovados

| Prova                            | Resultado observado                                                                                                                                                                           | Limite                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Máxima multicolor 10.000 × 8.000 | Três jobs `READY`, pico agregado 1.533.161.472 bytes, zero OOM; limite efetivo 8 GiB, swap zero, PIDs 64, scratch 512 MiB e caps de endereço de 3 GiB                                         | Somente o candidato x86/VM testado; não admite Cloud Run ou o baseline de 1 GiB                  |
| Falha controlada de memória      | `FAILED` sem artefatos, filha encerrada, capacidade recuperada e página seguinte `READY`; pico 883.757.056 bytes, zero OOM                                                                    | Injeção existente de teto de endereço, não OOM global do host                                    |
| Entrega e ACK GCS                | READY, consulta autenticada, downloads HTTPS íntegros, dois 202 para uma intenção; gerações ausentes antes de manutenção explícita; URLs anteriores negadas ainda válidas; vizinho preservado | Renderer/SQL/GCS reais, providers falsos; consulta por MockMvc com filtros, sem endpoint público |
| Retenção real                    | Seis gerações presentes após 3.600 s; exclusão confirmada 966 ms após o deadline e zero restantes                                                                                             | Sweep real do adapter, sem SQL/scheduler; não comprova pontualidade                              |

A aprovação de Ruan da aparência das sete fixtures de 28/10 e o profiling
Android emulado foram reaproveitados, com os limites da review: PSS pontual de
556.788/552.261 KiB não é pico; APK debug e fixture pequena não representam
release, aparelho físico ou imagem máxima. A prova de disco anterior permanece
histórica, com arquitetura/ambiente identificados; não foi repetida nesta VM.

O teste existente `uninterruptibleOriginalReadKeepsOwnershipUntilItReturns`
continua demonstrando que um I/O que ignora interrupção conserva stream e
snapshot até retornar. O sinal cooperativo não é exclusão física pontual.
O [lifecycle do GCS](https://docs.cloud.google.com/storage/docs/lifecycle)
é assíncrono e também não oferece essa garantia. Não houve mudança da spec
para acomodar esses limites.

## Gates, custo e retirada

Maven global final: sete módulos aprovados, gateway com 1.361 testes,
zero falhas/erros e 109 opt-ins ignorados. Log `maven-global-acceptance.log`, SHA-256
`7d215bbcb7d22cbdc27c46bbdf48e926d9ec5d61178a017cccc45e9c59fba77c`.
Node: 153 aprovados/um skip; web `tsc -b` e FSD passaram; mobile `pnpm check`
passou com 121 suítes/953 testes antes desta atualização documental. O resultado do gate
documental final após os checksums está registrado na review corrente.

Catálogo oficial em USD: E2 CPU US$ 0,0346242/vCPU-h e RAM
US$ 0,00464025/GiB-h, total US$ 0,1434924/h para a VM candidata; disco padrão
US$ 0,06/GiB-mês; GCS Standard São Paulo US$ 0,035/GiB-mês; registry
US$ 0,10/GiB-mês, sem presumir faixa gratuita. Operações e transferência estão
no catálogo preservado, com provisões conservadoras. Fontes:
[Compute](https://cloud.google.com/products/compute/pricing/general-purpose),
[GCS](https://cloud.google.com/storage/pricing) e
[registry](https://cloud.google.com/artifact-registry/pricing).

Reserva conservadora acumulada: US$ 6, incluindo US$ 0,50 para tentativas
anteriores e US$ 0,50 para a VM curta. Isso não é gasto faturado. O push de
PostgreSQL perdeu confirmação local por timeout; a API confirmou o digest
publicado antes de qualquer repetição. A espera não manteve VM ativa.

As duas primeiras preparações foram retiradas e o inventário confirmou zero
recursos remanescentes dos seus nomes. Uma parou por visibilidade inicial de
IAM; outra foi recusada pela política `TERMINATE`, incompatível com E2
on-demand, corrigida para `MIGRATE` sem reinício automático. Os recursos da
rodada atual também foram retirados: em 2026-10-30T11:54:40.231970Z, novas
listagens retornaram zero VMs, discos, imagens, contas, buckets, redes/subnets e
registries. O IAM do projeto permaneceu igual ao preflight. Um retorno imediato
de IAM ainda mostrava a conta excluída; a nova leitura confirmou sua ausência.

## Fechamento da recuperação e da observação temporal

A última manutenção agregada e o verificador separado terminaram com sucesso.
Após um ACK 503 com intenção incompleta e o retry real de um minuto, outro
processo JVM concluiu duas intenções; um terceiro processo confirmou zero
pendentes, oito referências ausentes e o vizinho preservado. A assinatura
alterada em um dígito, com comprimento preservado, recebeu 403; a URL sem
assinatura foi negada. Downloads validaram SHA-256, bytes, MIME, dimensões,
manifesto/imagem/job, e os dois ACKs registraram somente uma intenção por job.

Dois diagnósticos do harness foram conservados: acrescentar um caractere à
URL retornou 200 e não comprovava a alteração criptográfica pretendida; a
prova final muda um dígito e exige 403. O vizinho inicial possuía locator de
retenção inválido, fazendo o sweep agregado falhar após recuperar os ACKs.
A regressão reproduziu esse locator; o controle final usa outro UUID na mesma
pasta e deadline canônicos. Os sete controles antigos de três bytes foram
removidos por geração/hash; a última manutenção agregada passou. Não houve
relaxamento do parser, da exclusão ou da política de retenção do produto.

A observação temporal utilizou 3.600 segundos reais:

- criação: 2026-10-30T09:28:25.663600118Z;
- deadline: 2026-10-30T10:28:25.663600118Z;
- seis gerações presentes dois segundos antes e no início do delete;
- dois deletes de original e quatro de resultado/manifesto;
- confirmação: 2026-10-30T10:28:26.629839344Z, 966 ms após o deadline;
- zero gerações restantes nos três nomes observados.

Não é um teste de prazo reduzido, nem prova de scheduler ou de exclusão
pontual em uma hora. As falhas anteriores e seus limites não foram apagados
ou convertidos em aprovação. A imagem final contém o mesmo JAR de produção
corrigido; as revisões seguintes alteraram somente os probes.

## Comandos, custo final e pendências

Comandos executados, nas raízes correspondentes:

```bash
cd api
./mvnw -o -pl apps/translation-gateway -am test -Dtest=MediaInspectionServiceTest,IsolatedRenderAdapterTest,CloudPrivateDeliveryProbeTest -Dsurefire.failIfNoSpecifiedTests=false
./mvnw -o -pl apps/translation-gateway -am test -Dtest=GoogleCloudStorageAdapterTest,CloudPrivateDeliveryProbeTest -Dsurefire.failIfNoSpecifiedTests=false
./mvnw -o -pl apps/translation-gateway -am package -DskipTests
./mvnw -o test
node --test apps/translation-gateway/scripts/*.test.mjs
```

Imagens montadas pelo preparador existente com codec/fontes/licenças fixados,
`docker build --pull=false --network=none`, publicadas apenas no registry novo
e resolvidas por digest. Startup, admission, comandos cloud, hashes e intents
estão nos recibos da rodada. Não foi aplicado o Terraform da stack nem repetido
Cloud Run. Os recursos cloud preexistentes não foram alterados ou removidos.

Duração e bytes observados dão limite superior estimado arredondado de
**US$ 0,46** para compute/discos/registry, incluindo intervalos parados e sem
presumir deduplicação ou créditos. Com US$ 2,50 de provisão para rodadas
anteriores, operações e transferência, a projeção conservadora é **US$ 2,96**,
dentro da reserva US$ 6 e do teto US$ 20. Não é fatura confirmada: o registro
não dispõe de confirmação contábil em tempo real.

Pendências concretas, sem alterar requisitos ou promover a 020:

- **TASK-006:** garantia operacional de retenção absoluta e I/O não cooperativo. Estimativa: 1–2 dias para desenho/correção/regressões após definir uma garantia executável; nova prova temporal requer ao menos uma hora.
- **TASK-008:** pico Android/pipeline máximo e admissão operacional além do candidato medido. A medição Android existente não é pico. Medição pontual adicional: cerca de 30–60 minutos; admissão depende do alvo e limites escolhidos.

A contagem permanece **6/8 tasks**, sem medir esforço restante. A 021 continua
`implemented`; não houve mudança de spec, gate ou defaults.

## Recibos imutáveis

- `cloud-results/acceptancegcs/resource-metrics.json` — SHA-256 `248598ed8784796541e129e730a905411c11917bdd0cb7f81f26d57a47a212c8`.
- `cloud-results/acceptancedeferred/resource-metrics.json` — SHA-256 `c70939c4bf04e9c779860c7e7314a4a7b26e70ff7381e035aa86d6c6b5e8f6b5`.
- `cloud-results/acceptancerecovery/cleanup-recovery-result.json` — SHA-256 `8430ef9fa3ddf4c2710fcb51bca26b9daa64b82c601bc60b2fdcb582f0519282`.
- `cloud-results/fixedretention/retention-result.json` — SHA-256 `53774975ea00c167614f99edae4d15992fa7368f9ea3f49bffda4b461981ed8a`.
- `cloud-results/fixedmaximum/resource-metrics.json` — SHA-256 `27f7c565384ff121070e85f93916b6709a02146113a07838eb87f79d7be39784`.
- `cloud-results/fixedmemory/resource-metrics.json` — SHA-256 `4b3c887c6f63ca5e51b66fff5577ea217093ca62aeb4164f1447a51901b4e152`.
- `final-cloud-audit.json` — SHA-256 `87af01479fc6d0f3943ff34223a27bfdf18c1e780fa897e72a474b04ac6ceee6`.
- `cost-final.json` — SHA-256 `b87a4a9262423178630a4074b6c9a4c67cb1756a6fe37e7a1f355c8d25d81bc8`.
- `maven-global-acceptance.log` — SHA-256 `7d215bbcb7d22cbdc27c46bbdf48e926d9ec5d61178a017cccc45e9c59fba77c`.
