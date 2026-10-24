# Operador com cota explícita — 24/10/2026

Continuação da [guarda da décima retirada](worker-isolation-tenth-retirement-2026-10-23.md).
Novo contexto privado: `.local/worker-isolation/mount-quota-operator.1zdPhk/`.
Seleciona o runtime com projeto de cota derivado internamente e o coordenador de
97 URLs, preservando SDK, primeira retirada histórica, plano B/COS7608, perfil de
montagem, reserva, grants, cancelamento e cleanup. Não habilita o worker completo.

## Gates e seleção

O core executou **102/102 testes offline**, entre 00:05:08.606 e 00:09:01.807 UTC,
sem falhas, skips ou cancelamentos. Seu recibo tem SHA-256
`9d35ad5933eba84974eabbede31ef4303f2836b3b362868ce081529203379591` e confere
473 entradas de fontes/insumos. Inclui os 75 testes do coordenador selecionado,
15 de diagnóstico, quatro de gravador/transporte e oito de entrada/seleção/trace.

O launcher executou quatro testes e confere 479 entradas; recibo
`2d94497846ed55a8e42e06e0ea5661f27f2c47118de2f7a489516a52f802f978`.
Ele fixa o hash do core, preserva a primeira retirada e rejeita prepare/execute
com loaders ou variáveis de injeção. A recusa foi conferida também depois dos
recibos completos, sem criar diretórios de execução. Status não retoma trabalho.

O novo gate tem formato próprio; os validadores históricos permanecem intactos.
A seleção anterior é revalidada pelos hashes dos gates de 61/75 testes e seus
fontes; os 75 casos foram reexecutados nesta suíte, enquanto o gate histórico
de 61 testes não é apresentado como uma nova execução integral.

## Diagnóstico de HTTP 429

O gravador acrescenta uma projeção sanitizada somente para HTTP 429 no GET exato
do projeto no Resource Manager. Lê até 32 KiB usando o sinal/prazo existentes,
cancela e aguarda o corpo antes de liberar capacidade. Não usa tee, clone, retry
ou requisição adicional. Retorna o mesmo status/headers com corpo vazio ao fluxo
que já rejeita não-200; respostas de sucesso e outros métodos/APIs não têm seu
corpo consumido.

São retidos apenas códigos allowlisted de ErrorInfo, métrica/limite conhecidos,
hash do consumidor e indicação de correspondência ao projeto. Não são retidos
mensagem, número bruto, credencial ou resposta bruta. Falha da projeção tem código
sanitizado e preserva a recusa. O diagnóstico não é autoridade de operação nem
prova retroativa da causa do 429 da décima rodada.

## Gates globais e acesso ao Docker

A primeira execução, às 00:08 UTC, foi iniciada mesmo após a pré-checagem de acesso
ao socket do Docker ter sido negada pelo sandbox. Esse erro de execução foi
registrado, sem tratar o Maven incompleto como aprovação. Web e mobile passaram;
somente o Maven foi repetido com acesso autorizado ao OrbStack e imagens locais
conferidas. Não houve downloads ou instalações.

O Maven offline com Docker encerrou com código zero, entre 00:10:53.974 e
00:13:07.919 UTC: os sete módulos passaram; gateway com 1.297 testes, zero falhas,
zero erros e 104 skips previstos. Containers PostgreSQL foram efetivamente
iniciados. O log Maven tem SHA-256
`e0e7155651b5717029eb259f881c274a100b76bede4e8aabfddaa28a09c96092`.

O type-check web passou às 00:08:52.860 UTC. `pnpm check` mobile passou às
00:09:35.619 UTC, incluindo 116 suítes/892 testes Jest. Esses dois comandos não
foram repetidos depois do primeiro resultado aprovado. O recibo agregado
`combined-global-gates.json`, SHA-256
`e23cd3c7e476a26c7679e85624dd43a74485ad860165df101ea25bb9f68d010f`, preserva
as referências aos três resultados e à tentativa bloqueada pelo sandbox.

## Captura financeira e preparação

Coletor novo: `.local/worker-isolation/mount-quota-finance.gcHVtb/`. Seus 143
fontes/insumos e recibo de 68 testes foram copiados byte a byte e revalidados;
não foi reexecutado o verificador histórico que contém fotografia de cinco
reservas. O ledger atual foi conferido separadamente antes das consultas.

Dois GETs reais confirmaram billing ativo, conta aberta e BRL; quatorze GETs reais
observaram os sete SKUs em BRL/USD. SDK e fontes permaneceram iguais; nenhum
provider, mídia, instalação ou alteração de billing/IAM/API fez parte da captura.
A estimativa conservadora é **USD 2,11**, válida até
**2026-10-24T01:14:49.946Z**. Não é fatura nem hard cap.

O comando local `prepare` passou, sem credencial, consulta ou reserva, propondo
104 GETs (cinco metadados, duas quotas e 97 ausências). A captura está ligada ao
snapshot financeiro
`e97e0fd1e56eb307bebf261a6459724cba2fe6e2f828dded9360f867d43fadf4`.
A auditoria prévia verificou contexto novo, gates, fontes/SDK, primeira retirada,
ledger com dez reservas, cotação e o arquivo de 62.359.506 bytes, SHA-256
`f8b8009f1684e29050a5472c2dc3077e6177ef322c667000e532c8bc2dd6135c`.
Recibo prévio: `78e2151c067ab79f18ceea63fbdaf341000d526558ec3194a71c6f2684e02627`.

## Rodada real

Foi iniciada uma única execução autorizada, por
`node .local/worker-isolation/mount-quota-operator.1zdPhk/launch.mjs execute`,
com contexto `mount-check-20261024-03c57856`. A reserva prevista é USD 5 dentro do
limite de USD 100. Não repetir esse comando no contexto; uma falha ambígua exige
reconciliação, nunca reenvio automático.

A execução encerrou com código **2**, `supervisor-failed-and-retired`, sem prova
de montagem ou boot. O runtime registrou 506 chamadas entre **00:19:01.661 e
00:26:25.359 UTC**, além dos 104 GETs prévios à reserva. Houve exatamente oito
POSTs Compute e dois POSTs Storage, sem reenvio de mutação. O pedido de VM teve
uma resposta HTTP 200 para a operação, seguida de terminal `DONE` com erro;
HTTP 200 não foi interpretado como VM operacional.

| Resposta no runtime | Quantidade |
| ------------------- | ---------: |
| GET 200             |        330 |
| GET 404             |        156 |
| POST 200            |         10 |
| DELETE 200          |          8 |
| DELETE 204          |          2 |

As oito leituras Resource Manager capturadas retornaram 200; nenhuma gerou
diagnóstico 429. Isso valida somente o comportamento desta rodada, não a causa
histórica da recusa anterior ou disponibilidade permanente de quota.

Após a retirada, um reader separado, com 17 testes offline e 484 entradas
conferidas, fez **um único GET** da operação VM já registrada. Confirmou
`ZONE_RESOURCE_POOL_EXHAUSTED`, identidade da operação, nenhum código desconhecido
e SDK/fontes intactos, entre 00:30:22.366 e 00:30:23.505 UTC. Não houve reserva,
POST ou retry nessa leitura. Recibo do reader:
`f7de2f124fa330cf98a9bd23caa31035aeb6982c269ef77b5b84581fc6f79a20`;
captura sanitizada:
`15eb3675501cdfa1f14fdd3f47a714fbcbb63cf79931b6a79697a03b0979fd20`.

A documentação do Google classifica esse código como indisponibilidade de
recursos para a configuração solicitada, separada da quota Compute. Não implica
que todos os tipos estejam indisponíveis na zona.
[Referência primária](https://docs.cloud.google.com/compute/docs/troubleshooting/troubleshooting-resource-availability).

## Auditoria de retirada e orçamento

`post-retirement-audit.json` confere os sete deletes Compute terminais, seus IDs,
alvos e requestIds; rota retirada; objeto/bucket com deletes condicionais 204; e
onze últimas respostas 404. O conjunto completo dos oito POSTs Compute coincide
com os intents, incluindo a única criação de VM solicitada. Não foi inventado
delete de VM ou recibo de sucesso. Journals estão selados, o processo terminou
quiescente e o lock do contexto foi removido. Não há recuperação requerida pelo
supervisor nem recursos ativos observados na captura final.

Isso não é nova consulta de inventário após a captura, nem prova de remoção física
dos objetos: soft delete de sete dias continua explícito. As 97 ausências foram
revalidadas quanto ao frescor **no início da rodada**, sem reclassificá-las como
ausência atual para uma próxima criação.

Recibo da auditoria:
`5f1fa9d24402f70fad10071050d52c89e8cbe920129fb89d2c195ca9b3a0fc69`.
Capturas principais:

| Artefato                 | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `failure.json`           | `4e5b53722fbd5bf803939c245ee947e8b2eb9b285d9844dceb221db10cc1cd64` |
| `wire-events.json`       | `11742d3459431b54c406280e557fe6dd4b25e7b97ef6e64e0d1e811923d56989` |
| `native-boundary.json`   | `a79d9f86631d47afe84f81ef3866e72734641680ba611e33b8d04619a7a5f787` |
| `vm-dispatch-trace.json` | `78a72d83a61b1b8c801577c76177e40399efa406b8f1b27031722f98431847ce` |

O ledger avançou de dez para **onze reservas**, USD 55 reservados e USD 70
contabilizados com folgas anteriores, de USD 100 autorizados. Todas as entradas
anteriores foram preservadas; o pedido recusado não gera estorno presumido.
Restam USD 30 de margem normal, sem fatura verificada ou hard cap do provedor.

## Próxima preparação

As solicitações N1 nas zonas A e B tiveram stockout em suas respectivas datas;
isso não prova indisponibilidade atual de toda a família ou região. A próxima
preparação deve avaliar outro perfil compatível, na mesma região, já considerando
o orçamento do worker completo e a memória separada do sistema operacional.

N2 é um candidato a investigar: a documentação lista `n2-highmem-2` com dois
vCPUs/16 GB e plataformas Cascade Lake/Ice Lake. Isso não comprova quota,
capacidade, preço ou compatibilidade do nosso pacote.
[Família e configurações N2](https://docs.cloud.google.com/compute/docs/general-purpose-machines#n2_machines).
Nenhuma configuração N2 foi provisionada ou aprovada nesta entrega.

Antes de nova criação: conferir metadados/quotas do candidato, modelar seu perfil,
verificar ABI/CPU/controles do host, obter cotação própria e testar a seleção
integral offline. A cotação N1 não serve para outro tipo de máquina. A décima
primeira retirada também deve entrar no guard, elevando o conjunto para 108 URLs
antes das novas consultas frescas. Preservar a contenção do worker; memória maior
do host não aprova aumentar seus limites ou relaxar guards.

A próxima entrada também deve impedir uma segunda execução no mesmo contexto
por registro atômico persistente, inclusive após término ou interrupção. Isso
complementa o lock da rodada e não substitui reserva financeira ou reconciliação.
O contexto encerrado desta fotografia não será reutilizado.

Continuação posterior: a
[preparação offline N2](worker-isolation-n2-preparation-2026-10-24.md) implementa
o helper de execução única, o guard de 108 alvos e o perfil separado do host.
Essa preparação não altera os recibos ou a conclusão desta rodada histórica.

### Metadados do candidato N2, sem criação

Uma consulta posterior, entre **00:42:29.223 e 00:42:31.633 UTC**, executou quatro
GETs fixos e retornou 200 para máquina, zona, região e projeto. Captura privada:
`.local/worker-isolation/mount-n2-candidate-read.CvmJGQ/capture/result.json`,
SHA-256 `d26a56ed686a6dd29e6c543c8e6c1951ef27d6bff0f67b9a88fe3f190f5cd5fc`.

- `n2-highmem-2`: dois vCPUs, `memoryMb=16384`, `isSharedCpu=false`.
- Zona B `UP`, com Cascade Lake e Ice Lake na lista de plataformas do candidato.
- Quota regional `N2_CPUS`: limite 200, uso zero naquela consulta; quota global
  `CPUS_ALL_REGIONS`: limite 32, uso zero.
- Metadata herdada do projeto vazia, sem startup herdado detectado.

SDK, fontes e ledger permaneceram iguais, com onze reservas; não houve mutação,
nova credencial, preço consultado ou instalação. Trata-se de script de consulta
pontual com projeção tipada, não verificador de admissão do candidato. Metadados e
quota suficientes não demonstram capacidade disponível ou compatibilidade de
execução. Nenhuma VM N2 foi criada; perfil, cgroups, pacote e cotação próprios
continuam pendentes. O teto experimental do worker permanece separado da memória
total do host, sem alteração dos defaults.

## Limites

O perfil é 1 CPU/1 GiB, destinado à prova de montagem; não admite o worker completo
de 8 GiB. Permanecem necessários boot/segurança, memória total e falhas do worker,
integração privada, retenção e qualidade final. A 020 continua `in-progress/open`
e a 021 `approved/blocked`. Defaults, uploads públicos, providers e produção
permanecem desabilitados.

PostgreSQL, migrations, APIs, task e contratos Java não mudam. Fontes técnicos
do gateway permanecem 419, checksum
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Não apresentar o checksum mobile como cobertura Java. Preservar capturas,
recibos, reservas, locks e arquivos de performance anteriores. O diff global
mantém o alerta preexistente de linha em branco em `PlatformBadge.tsx:44`.
