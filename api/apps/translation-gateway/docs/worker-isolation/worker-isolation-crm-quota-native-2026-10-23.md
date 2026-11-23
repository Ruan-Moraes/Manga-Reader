# Projeto de cota no transporte nativo — 23/10/2026

Continuação da [décima rodada e do diagnóstico CRM](worker-isolation-zoneb-operator-2026-10-23.md).
**Candidato local, ainda sem seleção em operador cloud.** Nenhuma nova chamada
Google, reserva, instalação ou criação de recursos integra esta alteração.

## Problema e limite da conclusão

A décima rodada recebeu HTTP 429 ao consultar o Resource Manager antes da criação
do disco de dados. O corpo não foi retido; sua causa permanece desconhecida. No
diagnóstico posterior, as duas consultas, com e sem projeto de cota explícito,
retornaram HTTP 200. Isso não reproduziu a falha nem prova sua resolução.

O candidato remove uma ambiguidade de roteamento: informa explicitamente o
projeto de cota somente no GET admitido de
`https://cloudresourcemanager.googleapis.com/v1/projects/toonlira-rm`. A
[documentação REST](https://docs.cloud.google.com/docs/authentication/rest)
descreve o header `x-goog-user-project`; não houve alteração de ADC, IAM ou
configuração do SDK. Não se deduz disponibilidade contínua de quota ou capacidade
da VM a partir da aceitação anterior desse header.

## Alteração e regressão de cancelamento

Pacote privado: `.local/worker-isolation/mount-crm-quota-native.tN4CSY/`.
Somente `native.mjs` e seu ancestral `runtime.mjs` foram transplantados do grafo
B; os demais 51 módulos continuam compartilhados, com hashes conferidos. O
runtime candidato não é automaticamente utilizado pelos operadores anteriores.

Depois de validar política, admissão, identidade e sinal, o transporte deriva o
header do projeto do plano. Não aceita valor do chamador, nem mesmo quando for
igual ao projeto permitido. Compute, Storage, POST e DELETE preservam seus headers.
Os objetos de entrada são copiados, sem mutar opções ou headers congelados.
Não há retry, fallback, nova aquisição de credencial, mudança de prazo ou remoção
das verificações de escopo.

O teste RED encontrou também um cancelamento ocorrido durante a espera da
admissão: o transporte injetado era chamado com sinal já abortado. Isso não é
prova de envio real na rede. Foi adicionada a checagem final desse sinal antes do
transporte. Identidade da operação, trace, limites de resposta e retenção da
capacidade até conclusão/cancelamento do corpo permanecem preservados.

## Evidência local

Antes da implementação, `quota.test.mjs` produziu 19 testes, 14 aprovados e cinco
falhas esperadas: quatro relativas ao header ausente e uma ao cancelamento. A
captura RED, entre 23:33:16.257 e 23:33:16.350 UTC, tem SHA-256
`1f818037436f0d10b7dd3059fa647591d3a94472bd5467671f3d7a90d4f73036`.

A verificação integral ocorreu entre **23:37:47.259 e 23:41:34.120 UTC**:
**61/61 testes**, sem falhas, cancelamentos ou skips; processo encerrado com código
zero. O recibo `verification.json` tem SHA-256
`619d58c4157930c1fb90b4163b5501ed29bc5dd133a0f3fbb094a08aa7602653`, e o TAP
`9e20e83805d9a47bfc35cff948283c134558c2b5e3dfbd48887559e2bdab79d4`.
Foram conferidas 416 entradas de fontes/insumos, além do produto auditado.
O grafo selecionado pelo teste tem SHA-256
`ceb825a4d1c4169a4997d6d391883dd1e2bb3f2c67ee9413b19471402deead8b`.

A suíte cobre 19 casos de cota/escopo/cancelamento, 23 regressões de native/SDK,
seis fronteiras do trace, dois casos de grafo/importação inerte e 11 cenários
integrais do coordenador CAS/admissão. Todos usam transporte sintético. O cenário
de HTTP 429 confirmou retirada dos recursos conhecidos e ausência de intenção de
VM; a ausência de dispatch não foi convertida em terminal ou NOT_SENT fictício.

Os testes usam identidade/HTTP/financeiro sintéticos, journals CAS reais e cópia
privada do ledger. O original tem dez reservas; somente a décima entrada da cópia
é substituída pela reserva sintética. Hashes do original foram comparados antes e
depois, e a cópia foi removida ao fim de cada cenário. Os horários operacionais
modelados nas fixtures são explicitamente sintéticos e posteriores à décima
retirada; timestamps históricos copiados não são apresentados como novas
observações. Nenhuma captura real foi redatada.

O cenário de HTTP 429 injeta uma única recusa depois da imagem de dados e antes
do dispatch do disco. A expectativa é limpeza dos recursos conhecidos, ausência
de intenção de VM e nenhuma segunda tentativa da chamada recusada pelo I/O.
Isso é regressão simulada do fluxo, não nova observação do Google Cloud.

Comando focal, executado na raiz do repositório:

```bash
node --import ./.local/worker-isolation/mount-n1-cos-admission.y8ogL1/offline-network-v2.mjs \
  --test --test-concurrency=1 \
  .local/worker-isolation/mount-crm-quota-native.tN4CSY/quota.test.mjs \
  .local/worker-isolation/mount-crm-quota-native.tN4CSY/native-regression.test.mjs \
  .local/worker-isolation/mount-crm-quota-native.tN4CSY/native-phase.test.mjs \
  .local/worker-isolation/mount-crm-quota-native.tN4CSY/graph.test.mjs \
  .local/worker-isolation/mount-crm-quota-native.tN4CSY/integration.test.mjs
```

O guard bloqueia rede e comandos de credenciais reais. `verify.mjs` adiciona
conferência dos fontes, produto e registros históricos e grava recibos exclusivos;
não repetir seu comando em contexto já selado. O helper de ledger desta fotografia
exige dez reservas e deve falhar se esse estado mudar, sem alterar o original.

## Persistência, orçamento e próxima etapa

Os gates globais anteriores, entre 19:27 e 19:30 UTC, passaram: Maven offline
com Docker, type-check web e `pnpm check` mobile. Seus logs e o recibo
`c862b57030e37356a74582ee41ca38a57835d2e97999f9df86e5ce0eaefcec72` foram
conferidos novamente, **sem repetir esses comandos neste incremento**. Os 419
fontes técnicos do gateway foram revalidados com o mesmo checksum
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.

Não houve mudança de schema, migrations, contratos Java, APIs ou defaults. O
PostgreSQL da aplicação permanece intacto; registros operacionais são arquivos
privados locais. O checksum técnico do gateway continua sendo uma fotografia
separada do checksum mobile/SDD e do grafo operacional.

As dez reservas representam USD 50 reservados, não fatura verificada. O total
contabilizado com folgas anteriores permanece USD 65 do limite autorizado de
USD 100. Este candidato não adiciona reserva nem libera folgas de contextos
anteriores. A cotação da décima rodada expirou e não pode ser reutilizada.

Antes de nova criação: incorporar a décima retirada ao guard, incluir suas onze
referências no conjunto anterior, conferir o ledger e obter cotação e consultas
frescas em novo operador auditado. Os testes deste candidato preservam o
coordenador anterior; não representam essa futura ampliação do guard.

Continuam pendentes montagem/boot, segurança, memória total e falhas do worker,
integração privada, retenção operacional e qualidade final. A 020 permanece
`in-progress/open`, a 021 `approved/blocked`; uploads, providers e produção
continuam desabilitados.
