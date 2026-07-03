# Backend — `api/`

Três serviços Spring Boot independentes que compartilham a mesma infraestrutura
(PostgreSQL, MongoDB, RabbitMQ, Redis):

| Serviço | Porta | Papel |
|---------|-------|-------|
| [`core/`](core) | 8080 | API principal — Clean Architecture, dual-DB, dona de toda escrita de negócio |
| [`jobs/rating-aggregator/`](jobs/rating-aggregator/README.md) | 8081 | Dono da coleção `reviews_aggregate` — recompute por eventos RabbitMQ + reconciliação diária |
| [`jobs/orphan-cleaner/`](jobs/orphan-cleaner/README.md) | 8082 | Reconciliação de contadores desnormalizados (horária) + limpeza de refs órfãs cross-DB (diária) |

Não há jar compartilhado entre os serviços: os jobs replicam o mínimo necessário
(ex.: `RatingEvent` no mesmo FQN) e conversam com a API só via banco/fila.

## `core/` — API principal

Clean Architecture em 4 camadas (`presentation → application → domain ← infrastructure`),
17 domínios, dual-DB PostgreSQL (Flyway) + MongoDB (Mongock). Padrões normativos em
[`docs/architecture.md`](../docs/architecture.md); persistência em
[`docs/orm-persistence.md`](../docs/orm-persistence.md); modelagem em
[`docs/database-modeling.md`](../docs/database-modeling.md).

**O que o core NÃO faz:** agregação de avaliações (rating-aggregator) e
reconciliação/limpeza no caminho frio (orphan-cleaner) — o core mantém contadores e
refs apenas no caminho quente dos use cases.

### Executar

```bash
cd core
./mvnw spring-boot:run        # docker compose sobe sozinho (spring-boot-docker-compose)
```

> **Serviço novo no compose?** O spring-boot-docker-compose **pula** o startup se
> já houver serviços do compose no ar — containers antigos não ganham os novos
> (ex.: `neo4j`, DT-48) e o boot falha na conexão. Rodar uma vez
> `docker compose up -d <serviço>` (ou `docker compose up -d` para todos).

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- Infra dev: `core/docker-compose.yml` (Postgres 17, Mongo 8 replica-set de nó único, RabbitMQ 4, Redis 7)
- `DataSeeder` popula dados de demonstração (profile != prod)

### Testar

```bash
cd core
./mvnw test                                       # completa (Docker p/ TestContainers)
./mvnw test -Dtest.excludedGroups=testcontainers  # leve, sem Docker
./mvnw test -Dtest=UserTest                       # classe específica
./mvnw test -Dtest=**/domain/**/*Test             # por camada
```

Anotações por camada e limitações conhecidas: [`docs/testing.md`](../docs/testing.md).

## `jobs/` — serviços auxiliares

Mesmo padrão nos dois: `@Scheduled` + gatilho manual `POST /admin/reconcile`
protegido por token (comparação em tempo constante), operações idempotentes,
infra subida pelo `core` (`spring.docker.compose.enabled=false` nos jobs).
Cada um tem README próprio com configuração, endpoints e agendamento.

## Produção

`docker-compose.prod.yml` nesta pasta sobe os 3 serviços (`app` em `./core`,
`rating-aggregator` e `orphan-cleaner` em `./jobs/*`). Plano completo de deploy:
[`docs/deployment-plan.md`](../docs/deployment-plan.md).

## Convenções

- Java 23 (`java.version=23`), Spring Boot 3.4.3, Maven wrapper (`./mvnw`).
- Nunca criar `buildPageable`/`extractUserId` em controller — usar `@PageParams`/`@CurrentUserId` (DT-23).
- Enums de request usam `fromValue(String)` no domínio (DT-39).
- Toda mudança de persistência passa pelo checklist de [`docs/orm-persistence.md`](../docs/orm-persistence.md).
- Dívidas técnicas do backend: [`TECHNICAL_DEBT.md`](../TECHNICAL_DEBT.md) + [`docs/tech-debt.md`](../docs/tech-debt.md).
