# Contrato N1 e admissão offline — 2026-10-20

Continuação da [investigação de metadados/preços](worker-isolation-n1-investigation-2026-10-20.md).
O contrato e sua integração local estão implementados, mas **não há operador
operacional N1 admitido ou VM nova**. A 020 permanece `in-progress/open`, a 021
bloqueada e os defaults desabilitados. Não há mudança no produto, banco,
migration, infraestrutura publicada ou arquivos de performance.

## Contrato explícito, sem fallback

O candidato privado `mount-n1-contract.zRTKsc` aceita somente
`n1-custom-1-1024-mount-v1`: STANDARD, um vCPU não compartilhado, 1024 MiB.
Requests exigem `TERMINATE`, `automaticRestart=false`, término `DELETE` e
`maxRunDuration=600`. Preserva sem SA/IP público/NAT/PGA, deny-all, retirada
da rota padrão, Secure Boot e disco de dados read-only/não autoexcluído.

A [CPU mínima](https://docs.cloud.google.com/compute/docs/instances/specify-min-cpu-platform)
é fixada em Intel Broadwell. A configuração efetiva deve confirmar a escolha
e CPU Broadwell ou Skylake, ambas observadas na zona. O tipo de máquina não
informou arquitetura no GET anterior: não foi preenchida uma arquitetura por
omissão; a prova futura depende também da imagem pinada e da plataforma efetiva.
E2, Spot, MIGRATE, CPU antiga/desconhecida ou campos ausentes são recusados.

O binding tem formato próprio `mount-binding-n1-1`. Journals continuam CAS5,
com hash do bundle e dos bodies; formato CAS5 sozinho não autoriza adotar contexto
Spot/E2. Testes conferem rejeição nos dois sentidos sem mudar bytes prévios.
Contextos CAS4 também permanecem incompatíveis, sem migração in-place.

Foram copiados 35 módulos/fixtures/testes com proveniência registrada. Cinco
módulos de lógica têm alterações semânticas revisadas: perfil, requests,
binding, validador do formato e emissor desse formato. Os outros **16 módulos
de lógica** copiados correspondem aos pais após somente imports/Prettier.
O grafo de composição possui 42 módulos e recusa backlinks para o perfil Spot.

O gate selado passou em **136 testes**, sem falhas, skips ou cancelamentos:
requests, configuração efetiva, ownership, rede/discos, CAS concorrente,
confirmação perdida, HTTP400/403, ambiguidades e composição completa. O RED
anterior preserva três falhas específicas do contrato N1. A exclusão automática
é simulada para conferir recuperação; não é observação de preempção ou timer
real do Google. Permanecem separados mount-only e worker completo.

## Quota STANDARD: dois GETs reais

O candidato `mount-n1-quota.j7GXcb` passou em **28 testes** antes de usar a
identidade existente pinada. Leu somente projeto/região com `fields` entre
**22:59:15.162 e 22:59:18.035 UTC**, ambos HTTP200 e correspondentes ao escopo.
SDK permaneceu inalterado; não houve mudança de quota ou recurso. A reexecução
posterior dos 28 testes não alterou o recibo nativo e não usou Google.

| Métrica observada       | Limite | Uso |
| ----------------------- | -----: | --: |
| CPUS_ALL_REGIONS        |     32 |   0 |
| CPUS regional           |    200 |   0 |
| INSTANCES regional      |     24 |   0 |
| DISKS_TOTAL_GB regional |   4096 |   0 |
| NETWORKS                |      5 |   1 |
| SUBNETWORKS             |    100 |   0 |
| FIREWALLS               |    100 |   4 |
| IMAGES                  |    100 |   0 |

Há folga observada para o plano restrito. O reader N1 não usa
`PREEMPTIBLE_CPUS`/`E2_CPUS` para autorizar ou bloquear STANDARD N1, não rebatiza
o recibo Spot e não pressupõe reserva de capacidade. Warning, duplicata,
tipo/bytes inválidos ou leitura antiga continuam falhando. A fotografia já
precisará de renovação para uma execução: não é concessão ou garantia física.

## Admissão concreta e transporte

O candidato `mount-n1-admission.UhYCO3` vincula perfil/bundle N1 canônicos,
preços N1, billing BRL, observação recente de quota, reserva revogável e source
com hash. Exige um **novo preflight N1 de cinco leituras**, com projeto, metadata
vazia, COS pinado, tipo exato e zona/CPU. O preflight legado E2 de quatro
leituras não é aceito; a implementação real desse novo preflight é trabalho
subsequente nesse snapshot, não substituído pelas fixtures. A
[continuação do preflight](worker-isolation-n1-preflight-2026-10-20.md) registra
sua implementação posterior e o bloqueio real da imagem COS depreciada.

O corte de criação continua independente da autoridade de cleanup, sem
reabrir criação. Os limites de chamadas/bytes/prazo, uma criação por hash e
resolução de confirmação perdida são preservados. O transporte nativo mantém
a lógica anterior; sua allowlist troca somente o GET de tipo E2 pelo N1 exato.
SDK e identidade não ganham permissões ou credenciais novas.

A suíte da admissão passou em **60 testes**. A integração posterior passou em
**102 testes**: 60 de admissão, 14 de integração, 23 de transporte, dois do
caminho N1 e três do bloqueador offline. As duas primeiras suítes incluem oito
regressões herdadas cada; as contagens não são cenários novos independentes.
O teste integrado usa admissão concreta, ports nativos, CAS Java e archive local
reais, com HTTP e identidade sintéticos. Exercita fluxo completo, HTTP400,
upload com confirmação perdida, revogação e inicialização lazy.

### Falha preservada do bloqueador de testes

A primeira consolidação adicional terminou com **99 testes, seis falhas**:
o bloqueador de rede/CLI envolveu `execFile` sem preservar `promisify.custom`.
Isso mudou o resultado assíncrono e removeu o acesso à propriedade `child`
usada pelo helper CAS. O contrato/runtime havia passado sem esse bloqueador;
essa nova execução não foi considerada aprovada.

A revisão V2 mantém proibidos HTTP padrão e `gcloud`, preservando o retorno
customizado do subprocesso permitido. Três regressões verificam `stdout`,
`stderr`, `Promise.child`, recusa de CLI real nos dois estilos e recusa de
`fetch` padrão. O gate integral foi reexecutado com esse bloqueador ativo.
Fontes/recibo/TAP da falha permanecem intactos; o campo otimista de integração
do recibo antigo não sobrepõe seu exit 1/seis falhas. A V2 deriva esse campo
do resultado efetivo. Não é um mecanismo de isolamento de rede de produção.

## Recibos sanitizados

| Evidência privada                   | SHA-256                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| Contrato/grafo N1, 136 testes       | `a83525769981a13c76846c1595d1a75a0e6f442729b3134b0d0bf7fad314bbc8` |
| RED do contrato, três falhas        | `f5a2d283440993b510d30f6d69d859ed4d9af9791c7de69d7b0b274520b519d7` |
| Reader de quota, 28 testes          | `610c851aa9b364620a6bf11cda53cb10bc7dce03200bdc71ad9baf10e49e5683` |
| Resultado real dos dois GETs        | `a987a42d49004be75c696e0e6ed72bff9a9c8689faa4d878cd2a7c15857e7a2c` |
| Quota: reexecução offline após GETs | `5cbea86759ae1f0ed536b0e07668096dde85539472f605a12dd0bfc997313d41` |
| Admissão isolada, 60 testes         | `56a2ed108abfc371b39e24e3aae9691a9125a74b9076a18c1bf5acc5e81dd3f5` |
| Gate com falha do bloqueador        | `6ffea0a36b3c949811ac4d41800cb7f97f1137e73a1fb53058bfdb50d8491fc7` |
| Integração V2, 102 testes           | `d3692d7b4d10c52e544d5d5230c4d6478bc1a6927af89302fcc00d2de4207ce9` |

O snapshot técnico de 419 fontes foi conferido sem divergência. O ledger
permanece com quatro reservas de USD 5, nenhuma nova; não é gasto faturado nem
hard cap do Google. Não houve instalação, chamada de provider ou upload real.

Type-check web e `pnpm specs:check` foram reexecutados e aprovados. Links locais,
formatação direcionada e diff restrito dos documentos passaram. O diff global
continua acusando somente a linha em branco preexistente de `PlatformBadge.tsx:44`,
preservada fora do escopo. Maven global não foi reexecutado neste incremento
sem mudanças Java; sua evidência anterior não é apresentada como execução nova.

## Próximo trabalho

1. Resolver a revisão explícita da imagem COS apontada pela
   [continuação real do preflight](worker-isolation-n1-preflight-2026-10-20.md),
   que preserva o contrato antigo recusado, antes de admitir nova prova.
2. Preparar operador com este grafo e seus recibos, sem adotar o executor E2.
3. Renovar preços/billing/quota/preflight e ausência dos escopos anteriores para
   a janela inteira, rever escopo e só então reservar novo ID para prova curta.

Não basta o preço estimado de USD 2,11 para admitir execução. A cotação da
investigação expira em **23:40:10.140 UTC de 2026-10-20**; não será redatada.
Boot seguro, runtime/CVEs, orçamento do worker completo, renderer, retenção,
qualidade e operação continuam gates separados. Nenhuma task da 020 foi fechada.
