# Infraestrutura do Translation Gateway

Terraform declarativo do marco server-side de `MOB-FEAT-017`. O código mantém
`gateway_enabled = false` por padrão. O primeiro `terraform apply` deve manter
esse valor até que billing, credenciais, imagem imutável e worker estejam
disponíveis e tenham sido conferidos.

O arquivo [`terraform.tfvars.example`](terraform.tfvars.example) documenta o
operador e o contato reais e usa as URLs públicas de
`toonlira-rm.firebaseapp.com`. O disclosure operacional `2026-09-07.v1` e a
política pública do provider estão preenchidos. A configuração continua
fail-closed porque `gateway_enabled` permanece `false`; copiar o exemplo não
habilita uploads.

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

Antes de habilitar o gateway, as rotas `/legal/terms` e `/legal/privacy` precisam
continuar respondendo `200` publicamente, sem autenticação e também por acesso
direto. A aprovação final do operador, a revisão da configuração implantada e o
worker continuam gates independentes.

## Sequência de implantação

1. instalar e autenticar o Google Cloud CLI no projeto `toonlira-rm` e confirmar
   que billing está ativo;
2. construir a imagem do gateway, publicá-la no Artifact Registry e resolver a
   referência imutável por digest;
3. copiar `terraform.tfvars.example` para um arquivo local não versionado e
   substituir somente `container_image`;
4. executar `terraform plan` e revisar recursos, regiões, IAM e custos;
5. aplicar primeiro com `gateway_enabled = false`;
6. implementar e implantar o worker de `MOB-FEAT-018..020`, preencher
   `worker_url` e somente então avaliar a ativação em mudança separada.

O bucket possui lifecycle diário como segunda rede de segurança. A garantia de
uma hora é executada pelo Cloud Run Job `cleanup`, porque lifecycle do Cloud
Storage não oferece granularidade horária. O job `dispatch` reconcilia a outbox;
Cloud Tasks usa uma única tentativa, pois retry de processamento cobrado pertence
a features posteriores.
