# Infraestrutura do Translation Gateway

Terraform declarativo do marco server-side de `MOB-FEAT-017`. O código mantém
`gateway_enabled = false` e `worker_enabled = false` por padrão. O primeiro `terraform apply` deve manter
esses valores até que billing, credenciais, imagem imutável e OCR real estejam
disponíveis e tenham sido conferidos.

O arquivo [`terraform.tfvars.example`](terraform.tfvars.example) documenta o
operador e o contato reais e usa as URLs públicas de
`toonlira-rm.firebaseapp.com`. A versão anterior do disclosure
(`2026-09-07.v1`) não cobre a tradução pelo endpoint global; por isso o exemplo
deixa `disclosure.version` vazio. Copiá-lo mantém capabilities indisponíveis,
mesmo com `gateway_enabled = false`. Revisão e publicação da nova versão são
pré-condições independentes para ativar uploads.

O alpha usa `db-f1-micro`, 10 GiB iniciais e limite de crescimento automático de
20 GiB. É um tier compartilhado de desenvolvimento, sem SLA, escolhido para
evitar o custo permanente do antigo `db-custom-1-3840`. Promover o serviço para
produção exige revisar capacidade, SLA e tier em uma mudança separada.

Validação local, sem consultar ou alterar o projeto cloud:

```bash
terraform init -backend=false
terraform fmt -check -recursive
terraform validate
```

Se os plugins já estiverem cacheados, não executar `init` novamente. `validate`
verifica sintaxe e schemas locais; não comprova compatibilidade operacional nem
exercita valores de arquivos `.tfvars.example`. Nenhum `plan`/`apply` faz parte
da preparação abaixo.

## Perfil candidato nativo — somente arquivos locais

Ruan autorizou a preparação local em 2026-10-10, não implantação ou cobrança.
`worker_resource_profile` aceita exatamente `baseline` (default) e
`native-candidate-8g`. O baseline conserva 1 vCPU/1 GiB e a concorrência padrão
do provider; não altera os recursos do gateway ou dos jobs de manutenção.

O [exemplo complementar](native-worker-candidate.tfvars.example) seleciona
2 vCPU/8 GiB, concorrência 1, mínimo 0 e máximo 1 instância. Cloud Run exige
ao menos 2 vCPUs para 8 GiB conforme a
[tabela oficial de memória](https://docs.cloud.google.com/run/docs/configuring/services/memory-limits).
Os diagnósticos Docker usaram CPU 1; isso não mede a combinação cloud proposta.
Custos de execução futura continuam sujeitos a decisão separada.

O candidato é **não implantável**: preconditions fatais nos recursos gateway
(sempre presente) e worker recusam o perfil candidato numa implantação normal
do módulo, inclusive com worker desabilitado. Não é um `check` que apenas avisa.
Isso não é controle IAM nem proteção contra editar/remover guards ou usar
`-target`; não executar nenhum desses caminhos para contornar o gate.
Default e exemplos mantêm `gateway_enabled=false` e `worker_enabled=false`;
OCR, tradução, layout, render e download ficam explicitamente `disabled` no worker.

`worker_container_image` permite referência independente por digest de registry;
`null` mantém a referência compartilhada anterior. Não usar o ID do cache Docker
como digest publicado. A candidata worker não substitui automaticamente a imagem
do gateway público. Nenhuma imagem foi publicada ou assinada nesta preparação.

O arquivo `.tfvars.example` não é auto-carregado. Ele complementa entradas de
projeto/imagem, não é instrução de copiá-lo para habilitar produção. Antes de
revisar o bloqueio, ainda é necessário comprovar PID 1/namespace/cgroup, swap
zero, PIDs até 64, tmpfs limitado/noexec, AS pai/filha, rootfs/capabilities,
IAM/SQL/storage privados, imagem segura, retenção e isolamento de falhas.
Selecionar 8 GiB não resolve nem afrouxa esses guards do Java.

Antes de uma prova no alvo, usar o [diagnóstico Java independente](../../docs/worker-isolation-probe.md)
para preparar a leitura sanitizada dos controles. Não inicia worker ou provider,
não altera limites e não aprova operação mesmo com observações coincidentes.
Segunda geração e volume temporário limitado ainda não estão declarados neste
candidato; valores exatos de cgroup/PIDs/OOM/flags de mount exigem comprovação.
Não remover as preconditions para executar esse diagnóstico em cloud.

Testes estruturais offline: `node --test scripts/worker-resource-profile.test.mjs`
no módulo gateway. Eles conferem texto/ligação do HCL e proteção dos defaults;
não são execução de plano Terraform ou validação Cloud Run. `terraform fmt -check`
e `terraform validate` são os gates locais. Para conferir os exemplos, usar
`terraform fmt -check - < native-worker-candidate.tfvars.example` e a mesma
forma para `terraform.tfvars.example`, pois `fmt` não aceita o sufixo `.example`
como arquivo de entrada nomeado.

Antes de habilitar o gateway, as rotas `/legal/terms` e `/legal/privacy` precisam
continuar respondendo `200` publicamente, sem autenticação e também por acesso
direto. A aprovação final do operador, a revisão da configuração implantada e o
worker com OCR real continuam gates independentes.

## Sequência de implantação

1. instalar e autenticar o Google Cloud CLI no projeto `toonlira-rm` e confirmar
   que billing está ativo;
2. construir a imagem do gateway, publicá-la no Artifact Registry e resolver a
   referência imutável por digest;
3. copiar `terraform.tfvars.example` para um arquivo local não versionado e
   substituir somente `container_image`;
4. executar `terraform plan` e revisar recursos, regiões, IAM e custos;
5. aplicar primeiro com `gateway_enabled = false`;
6. integrar e validar o Vision no worker de `MOB-FEAT-018`, conferir IAM e
   ativar `worker_enabled` somente em mudança operacional separada;
7. concluir as etapas `MOB-FEAT-019..020` e somente então avaliar
   `gateway_enabled=true` em outra mudança operacional.

O worker condicional usa a mesma imagem com perfil Spring `worker`, sem rotas
`/v1`. Sua URL é derivada do recurso Cloud Run e só entra no ambiente de
dispatch quando ambos os switches estiverem habilitados, evitando referência
circular. O serviço não permite invocação pública: o binding `run.invoker`
inclui apenas a service account do Cloud Tasks. Nesta entrega não houve
`terraform apply` nem deploy.

O código declara também a API Vision e `roles/serviceusage.serviceUsageConsumer`
para a identidade do worker, reaproveitando o acesso ao bucket privado. Não são
concedidos papéis administrativos de Vision nem criadas chaves de service account.
O ambiente do worker recebe o projeto, mas mantém `GATEWAY_OCR_MODE=disabled`;
ativar o recurso Cloud Run por si só não liga chamadas ao provider. O adapter
foi validado somente contra um servidor gRPC local com fixtures sintéticas.

O bucket possui lifecycle diário como segunda rede de segurança. A garantia de
uma hora é executada pelo Cloud Run Job `cleanup`, porque lifecycle do Cloud
Storage não oferece granularidade horária. O job `dispatch` reconcilia a outbox;
Cloud Tasks usa uma única tentativa, pois retry de processamento cobrado pertence
a features posteriores.
