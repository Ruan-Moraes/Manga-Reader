# Infraestrutura do Translation Gateway

Terraform declarativo do marco server-side de `MOB-FEAT-017`. O código mantém
`gateway_enabled = false` por padrão e não deve receber `terraform apply` antes
da aprovação explícita de billing, operador, contato, URLs legais e worker.

Validação local, sem consultar ou alterar o projeto cloud:

```bash
terraform init -backend=false
terraform fmt -check -recursive
terraform validate
```

O bucket possui lifecycle diário como segunda rede de segurança. A garantia de
uma hora é executada pelo Cloud Run Job `cleanup`, porque lifecycle do Cloud
Storage não oferece granularidade horária. O job `dispatch` reconcilia a outbox;
Cloud Tasks usa uma única tentativa, pois retry de processamento cobrado pertence
a features posteriores.
