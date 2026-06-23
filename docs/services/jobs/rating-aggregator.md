# Rating Aggregator

Serviço dedicado de **agregação de avaliações** da plataforma Manga Reader. Roda fora
da API principal: mantém a coleção `reviews_aggregate` sempre atualizada por dois
caminhos — **eventos em tempo real** (RabbitMQ) e **job de reconciliação periódica**
(rede de segurança contra eventos perdidos).

---

## Propósito

Exibir nota e distribuição por estrela de uma obra *ao vivo* via agregação direta em
`reviews` seria caro (full-collection scan por request). O aggregator resolve isso
mantendo um documento pré-computado por título na coleção `reviews_aggregate`.

Esse documento é recalculado em dois momentos:

1. **Evento `rating.*`** — toda vez que uma avaliação é criada, editada ou removida, a
   API principal publica um `RatingEvent` no exchange `manga.events`. O aggregator
   consome e recalcula na hora, sem polling.
2. **Job periódico (03:00)** — rede de segurança: reconstrói o agregado de todos os
   títulos avaliados a partir da fonte real, corrigindo qualquer divergência acumulada
   por eventos perdidos, reprocessamentos ou dados de seed.

Por que um serviço separado (e não dentro da API):

- **Isolamento de carga** — agregações sobre `reviews` não competem com o tráfego de
  request da API.
- **Responsabilidade única** — a API persiste as avaliações individuais; este serviço
  consolida a visão agregada.
- Espelha o serviço irmão [`orphan-cleaner`](orphan-cleaner) (mesmo padrão
  de agendamento + endpoint manual).

---

## O que é agregado

| Fonte   | Destino (`reviews_aggregate`)      | Campo calculado                          |
|---------|------------------------------------|------------------------------------------|
| MongoDB | `reviews_aggregate.ratingAverage`  | Média de `reviews.overallRating` (1 casa decimal) |
| MongoDB | `reviews_aggregate.totalRatings`   | `COUNT(reviews)` por `titleId`           |
| MongoDB | `reviews_aggregate.star1`–`star5`  | `COUNT` por nota arredondada (1–5)       |

Um título sem avaliações recebe um agregado zerado (`ratingAverage=0`, `totalRatings=0`)
em vez de documento ausente, para que a leitura nunca retorne `null`.

Toda operação é **idempotente**: recalcular duas vezes seguidas produz o mesmo resultado.

---

## Arquitetura

Dois disparadores para um único use case. O use case é o único lugar com lógica de
negócio; disparadores (consumer + job) apenas o invocam.

```
RatingAggregateConsumer     messaging/     ouve rating.# no RabbitMQ (tempo real)
TitleRatingReconciliationJob scheduling/   varredura de todos os títulos (@Scheduled)
 └─ RecalculateTitleRatingUseCase  application/  computa + faz upsert do agregado
     ├─ RatingAggregationDao       infrastructure/  $facet em reviews (Mongo)
     └─ TitleRatingAggregateRepository infrastructure/  upsert em reviews_aggregate
AdminReconcileController    web/           gatilho manual POST /admin/reconcile
```

### Como o use case funciona

`RecalculateTitleRatingUseCase.execute(titleId)`:

1. Roda uma agregação `$facet` na coleção `reviews` — dois sub-pipelines sobre o mesmo
   `$match(titleId)`: um para média + contagem total, outro para distribuição por estrela
   (arredondamento via `$round`).
2. Monta o documento `TitleRatingAggregate` (ou `empty()` se sem avaliações).
3. Faz `save()` (= upsert por `titleId`, que é o `@Id` da coleção).

### Como o consumer funciona

`RatingAggregateConsumer` escuta a fila `manga.rating.aggregate`, ligada ao exchange
`manga.events` com routing `rating.#`. Como é uma fila distinta da do monolito, ambos
recebem cópia dos eventos sem competir. A desserialização usa `TypePrecedence.INFERRED`
(parâmetro do `@RabbitListener`) para desacoplar do FQN do publicador.

### Como o job funciona

`TitleRatingReconciliationJob.reconcile()` lista todos os `titleId` distintos em
`reviews` (`RatingAggregationDao.distinctRatedTitleIds()`) e invoca o use case para cada
um. O método `@Scheduled scheduledReconcile()` apenas o chama e loga o total processado.
A lógica fica em `reconcile()` — **testável sem o agendador**.

---

## Dependências

- **MongoDB 8.0** — fonte (`reviews`) e destino (`reviews_aggregate`). Migrations via
  Mongock (scan em `infrastructure/migration`).
- **RabbitMQ 4** — recebe eventos `rating.*` do exchange `manga.events`.
- A infra é **subida pela API principal** (`api/core`, via `spring-boot-docker-compose`);
  este serviço apenas se conecta. Por isso `spring.docker.compose.enabled=false`.
- Os documentos em `reviews` são **escritos** pelos use cases do `api/core`; este
  serviço apenas os lê para calcular o agregado.

Stack: Spring Boot 3.4.3, Java 23, Spring Data MongoDB, Spring AMQP, Mongock, Actuator,
Lombok. Testes: JUnit 5, Mockito, Testcontainers (Mongo).

---

## Configuração

Definida em `src/main/resources/application.yml`; sobrescrita por env (relaxed binding)
ou por `.env` local em produção.

| Propriedade                      | Env                          | Default                                 |
|----------------------------------|------------------------------|-----------------------------------------|
| `server.port`                    | `SERVER_PORT`                | `8081`                                  |
| `spring.data.mongodb.uri`        | `SPRING_DATA_MONGODB_URI`    | `mongodb://localhost:27017/mangareader` |
| `spring.rabbitmq.host`           | `SPRING_RABBITMQ_HOST`       | `localhost`                             |
| `spring.rabbitmq.port`           | `SPRING_RABBITMQ_PORT`       | `5672`                                  |
| `spring.rabbitmq.username`       | `SPRING_RABBITMQ_USERNAME`   | `manga`                                 |
| `spring.rabbitmq.password`       | `SPRING_RABBITMQ_PASSWORD`   | `manga_secret`                          |
| `aggregator.reconciliation.cron` | —                            | `0 0 3 * * *` (diário às 03:00)        |
| `aggregator.admin.token`         | `AGGREGATOR_ADMIN_TOKEN`     | *(vazio → endpoint manual desativado)*  |

---

## Execução

Pré-requisito: MongoDB + RabbitMQ no ar (suba a infra pelo `api/core`:
`cd ../../core && mvn spring-boot:run`, ou só os containers do compose).

```bash
# Local (dev)
mvn spring-boot:run

# Build do JAR
mvn package -DskipTests
java -jar target/rating-aggregator-0.0.1-SNAPSHOT.jar

# Docker (produção) — sobe junto da stack
cd ../../core && docker compose -f docker-compose.prod.yml up -d rating-aggregator
```

### Testes

```bash
mvn test -Dtest=RecalculateTitleRatingUseCaseTest,TitleRatingReconciliationJobTest,AdminReconcileControllerTest  # unit (sem Docker)
mvn test                                                                                                         # + integração Mongo (Testcontainers, requer Docker)
```

---

## Endpoints

| Método | Rota               | Descrição                                                                    |
|--------|--------------------|------------------------------------------------------------------------------|
| `POST` | `/admin/reconcile` | Gatilho **manual** de reconciliação total. Exige header `X-Admin-Token` = `aggregator.admin.token`. Sem token configurado → `503`; token inválido → `401`. Responde `200` com `{"reconciled": N}`. |
| `GET`  | `/actuator/health` | Health check.                                                                |
| `GET`  | `/actuator/info\|metrics` | Info e métricas.                                                        |

A comparação do token é feita em **tempo constante** (`MessageDigest.isEqual`) para
evitar *timing attack*.

```bash
curl -X POST http://localhost:8081/admin/reconcile -H "X-Admin-Token: $AGGREGATOR_ADMIN_TOKEN"
```

---

## Agendamento

`TitleRatingReconciliationJob.scheduledReconcile()` roda no cron
`aggregator.reconciliation.cron` (padrão **diário às 03:00**) e loga quantos títulos
foram recalculados. Sendo idempotente, a frequência é segura de ajustar conforme a
tolerância a divergências e o tamanho da coleção `reviews`.
