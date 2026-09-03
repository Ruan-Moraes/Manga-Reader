# Translation Gateway — `api/apps/translation-gateway`

Serviço Spring Boot separado da Core para a fronteira privada entre o aplicativo
mobile e o futuro pipeline de OCR, tradução e renderização. A primeira entrega
implementa somente contrato, identidade anônima, consentimento verificável,
idempotência, submissão de uma página, consulta e cancelamento.

O marco server-side de `MOB-FEAT-017` implementa identidade anônima, sessão
opaca, capabilities, submissão idempotente, consulta, cancelamento, quota,
outbox e cleanup. Nenhum provider é chamado e nenhum upload real deve ser
habilitado antes de políticas públicas, operador, contato, URLs legais, worker
e infraestrutura cloud válidos.

## Contrato

O OpenAPI v1 está em
[`openapi/translation-gateway-v1.yaml`](openapi/translation-gateway-v1.yaml). A
consulta por idempotency key é parte obrigatória do recovery quando o receipt de
um `POST /v1/page-jobs` se perde após timeout.

## Persistência

PostgreSQL é o banco canônico do serviço. Flyway V1 cria:

- instalações anônimas com credencial armazenada somente como hash;
- sessões curtas com apenas o SHA-256 do bearer, expiração e revogação;
- jobs idempotentes por instalação;
- estados por etapa;
- outbox de dispatch para não depender de atomicidade entre PostgreSQL e Cloud
  Tasks.

Imagem e texto nunca são gravados no PostgreSQL. Objetos futuros permanecem em
storage privado efêmero.

## Execução local

```bash
cd api
./mvnw -pl apps/translation-gateway spring-boot:run
```

Configuração mínima:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/manga_translation_gateway
SPRING_DATASOURCE_USERNAME=manga
SPRING_DATASOURCE_PASSWORD=...
```

O serviço usa a porta `8084` por padrão. A configuração local nasce com kill
switch desligado e disclosure incompleto, portanto `GET /v1/capabilities`
retorna `503` e nenhuma operação de escrita é liberada. Para um teste local
explícito, configure valores legais de fixture, `GATEWAY_ENABLED=true` e
`GATEWAY_DISPATCH_MODE=local-ack`; esse modo nunca chama worker ou provider.

A imagem é construída usando `api/` como contexto; o `.dockerignore` exclui
artefatos, logs e arquivos de ambiente:

```bash
docker build -f apps/translation-gateway/Dockerfile -t translation-gateway .
```

Variáveis obrigatórias para habilitação real:

```text
GATEWAY_DISCLOSURE_VERSION
GATEWAY_OPERATOR_NAME
GATEWAY_OPERATOR_CONTACT
GATEWAY_PRIVACY_POLICY_URL
GATEWAY_TERMS_URL
GATEWAY_PROVIDER_TRAINING_POLICY
GATEWAY_STORAGE_MODE=gcs
GATEWAY_STORAGE_BUCKET
GATEWAY_DISPATCH_MODE=cloud-tasks
GATEWAY_GCP_PROJECT_ID
GATEWAY_WORKER_URL
GATEWAY_TASKS_SERVICE_ACCOUNT
```

Credenciais longas usam Argon2id. Bearers de 15 minutos são aleatórios e apenas
seu hash SHA-256 é persistido. Authorization, mídia, filename, path, URL
assinada e referências de job não entram nos logs da aplicação.

## Fluxo de submissão

O gateway valida a configuração, os metadados e a assinatura real de
JPEG/PNG/WebP enquanto copia o corpo para arquivo temporário limitado. A mídia é
enviada ao storage com chave aleatória; depois, uma transação PostgreSQL serializa
quota por instalação/dia, adquire lock global diário e grava `job + outbox`.
Replay com a mesma chave e fingerprint retorna o job existente; payload diferente
com a mesma chave retorna conflito. Objetos perdedores são removidos imediatamente
e o cleanup elimina órfãos após uma hora.

## Infraestrutura

Terraform declarativo fica em [`infra/terraform`](infra/terraform/README.md).
Ele provisiona Cloud Run, Cloud Run Jobs de dispatch/cleanup, Cloud SQL sem IP
público, bucket privado, Cloud Tasks, IAM e Secret Manager, mas permanece com
`gateway_enabled=false`. Não executar `terraform apply` sem as aprovações
externas registradas na spec.

## Testes

```bash
./mvnw test
./mvnw test -Dtest.excludedGroups=testcontainers
```

A validação do schema usa PostgreSQL 17 em Testcontainers; H2 não é aceito para
esta migration.
