# Infraestrutura do Translation Gateway

Terraform declarativo do marco server-side de `MOB-FEAT-017`. O código mantém
`gateway_enabled = false` por padrão e não deve receber `terraform apply` antes
da aprovação explícita de billing, publicação/revisão das URLs legais,
disclosure versionado e worker.

O arquivo [`terraform.tfvars.example`](terraform.tfvars.example) documenta o
operador e o contato reais e reserva as URLs canônicas de
`app.toonlira.com`. Ele mantém versão e política do provider vazias de
propósito: enquanto DNS, HTTPS, conteúdo vinculante e revisão jurídica estiverem
pendentes, `/v1/capabilities` deve continuar fail-closed. Copiar o exemplo não é
autorização para `plan` ou `apply`.

Validação local, sem consultar ou alterar o projeto cloud:

```bash
terraform init -backend=false
terraform fmt -check -recursive
terraform validate
```

Antes de habilitar o gateway, as rotas `/legal/terms` e `/legal/privacy` precisam
responder `200` publicamente, sem autenticação e também por acesso direto. A
versão do disclosure só pode ser preenchida depois dessa publicação e da revisão
do conteúdo; o worker continua sendo um gate independente.

O bucket possui lifecycle diário como segunda rede de segurança. A garantia de
uma hora é executada pelo Cloud Run Job `cleanup`, porque lifecycle do Cloud
Storage não oferece granularidade horária. O job `dispatch` reconcilia a outbox;
Cloud Tasks usa uma única tentativa, pois retry de processamento cobrado pertence
a features posteriores.
