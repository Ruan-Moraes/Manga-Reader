# Counter Reconciler

Serviço dedicado de **reconciliação dos contadores desnormalizados** da plataforma
Manga Reader. Roda fora da API principal: recalcula periodicamente cada contador a
partir de sua fonte de verdade, corrigindo o *drift* acumulado pelos incrementos sem
risco de *double-count*.

---

## Propósito

Vários agregados do Manga Reader mantêm **contadores desnormalizados** para evitar
`COUNT(*)` em toda leitura (ex.: total de obras de um grupo, inscritos de um evento,
respostas de um tópico, votos de um comentário). Esses contadores são mantidos por
**incremento** pelos use cases da API principal (`+1` no add, `-1` no remove).

Incrementos divergem ao longo do tempo — evento perdido, exceção no meio de uma
operação, escrita concorrente, seed/migração. Este serviço é a **rede de segurança**:
periodicamente recalcula cada contador a partir de sua fonte real
(`SET contador = COUNT(fonte)`) e corrige a divergência.

Por que um serviço separado (e não dentro da API):

- **Isolamento de carga** — varreduras de reconciliação não competem por CPU/heap com
  o tráfego de request da API.
- **Responsabilidade única** — a API mantém os contadores no caminho quente; este
  serviço só os concilia no caminho frio.
- Espelha o serviço irmão [`rating-aggregator`](../rating-aggregator) (mesmo padrão).

---

## O que é reconciliado

| Fonte    | Contador (alvo)              | Recalculado a partir de                         |
|----------|------------------------------|-------------------------------------------------|
| Postgres | `groups.total_titles`        | `COUNT(group_works)` por grupo                  |
| Postgres | `events.participants`        | `COUNT(event_participants)` por evento          |
| Mongo    | `forum_topics.replyCount`    | `COUNT(comments WHERE targetType=FORUM_TOPIC)`  |
| Mongo    | `comments.upvotes/downvotes` | `COUNT(comments_votes)` por valor UP/DOWN       |
| Mongo    | `reviews.upvotes/downvotes`  | `COUNT(reviews_votes)` por valor UP/DOWN        |
| Mongo    | `forum_topics.upvotes/downvotes` | `COUNT(forum_topics_votes)` por valor UP/DOWN |

Toda operação é **idempotente** (`SET = COUNT`): rodar duas vezes seguidas dá o mesmo
resultado, sem efeito cumulativo.

---

## Arquitetura

Job orquestrador fino + um *reconciler* por fonte (Responsabilidade Única). O job só
coordena e reporta; cada *reconciler* sabe falar com seu banco.

```
CounterReconciliationJob          scheduling/      orquestra + agenda (@Scheduled)
 ├─ PostgresCounterReconciler     infrastructure/postgres/  SQL nativo (JdbcTemplate)
 ├─ ForumReplyCountReconciler     infrastructure/mongo/     replyCount dos tópicos
 └─ VoteCounterReconciler         infrastructure/mongo/     upvotes/downvotes (3 pais)
AdminReconcileController          web/             gatilho manual POST /admin/reconcile
ReconciliationReport             scheduling/      record com os contadores afetados
```

A lógica de negócio vive em `CounterReconciliationJob.reconcile()` — **testável sem o
agendador**; o método `@Scheduled scheduledReconcile()` apenas a dispara e loga.

### Como cada reconciler funciona

- **PostgresCounterReconciler** — dois `UPDATE ... SET contador = (SELECT COUNT(*) ...)`
  correlatos via `JdbcTemplate` (SQL nativo, sem entidades JPA — o serviço não precisa
  do grafo de domínio).
- **ForumReplyCountReconciler** — uma agregação em `comments` agrupando por `targetId`
  (filtrado por `targetType = FORUM_TOPIC`) + um *bulk update* em `forum_topics`.
  Tópicos sem nenhuma resposta voltam a `0`.
- **VoteCounterReconciler** — para cada um dos três pais votáveis (lista
  `VOTABLE_PARENTS`), agrega a coleção `<pai>_votes` somando UP/DOWN condicionalmente e
  faz *bulk update* nos pais votados. Pais **sem voto algum** mas com contador `> 0` são
  zerados via `$nin` (sem carregar todos os ids do pai em memória — importante para
  `comments`, que é grande). IDs de pai aceitam `ObjectId` ou `String` (seeds/UUIDs
  migrados do Postgres).

---

## Dependências

- **PostgreSQL 17** — fonte de `groups`/`events` (somente leitura das tabelas-fonte +
  update dos contadores).
- **MongoDB 8.0** — fonte de `comments`/`forum_topics`/`reviews` e das coleções de voto.
- A infra é **subida pela API principal** (`api/server`, via `spring-boot-docker-compose`);
  este serviço apenas se conecta. Por isso `spring.docker.compose.enabled=false`.
- Os contadores são **mantidos** pelos use cases do `api/server`; este serviço só os
  corrige.

Stack: Spring Boot 3.4.3, Java 23, Spring Data MongoDB, Spring JDBC, Actuator, Lombok.
Testes: JUnit 5, Mockito, Testcontainers (Postgres + Mongo).

---

## Configuração

Definida em [`src/main/resources/application.yml`]; sobrescrita por env (relaxed
binding) em produção.

| Propriedade                       | Env                          | Default                                   |
|-----------------------------------|------------------------------|-------------------------------------------|
| `server.port`                     | `SERVER_PORT`                | `8082`                                     |
| `spring.datasource.url`           | `SPRING_DATASOURCE_URL`      | `jdbc:postgresql://localhost:5432/mangareader` |
| `spring.datasource.username`      | `SPRING_DATASOURCE_USERNAME` | `manga`                                    |
| `spring.datasource.password`      | `SPRING_DATASOURCE_PASSWORD` | `manga_secret`                             |
| `spring.data.mongodb.uri`         | `SPRING_DATA_MONGODB_URI`    | `mongodb://localhost:27017/mangareader`    |
| `reconciler.reconciliation.cron`  | —                            | `0 0 * * * *` (de hora em hora)            |
| `reconciler.admin.token`          | `RECONCILER_ADMIN_TOKEN`     | *(vazio → endpoint manual desativado)*     |

---

## Execução

Pré-requisito: Postgres + Mongo no ar (suba a infra pelo `api/server`:
`cd ../server && mvn spring-boot:run`, ou só os containers do compose).

```bash
# Local (dev)
mvn spring-boot:run

# Build do JAR
mvn package -DskipTests
java -jar target/counter-reconciler-0.0.1-SNAPSHOT.jar

# Docker (produção) — sobe junto da stack
cd ../server && docker compose -f docker-compose.prod.yml up -d counter-reconciler
```

### Testes

```bash
mvn test -Dtest.excludedGroups=testcontainers   # suíte leve (unit do Job), sem Docker
mvn test                                         # + integração Postgres/Mongo (Testcontainers, requer Docker)
```

---

## Endpoints

| Método | Rota                  | Descrição                                                            |
|--------|-----------------------|---------------------------------------------------------------------|
| `POST` | `/admin/reconcile`    | Gatilho **manual** de reconciliação total. Exige header `X-Admin-Token` = `reconciler.admin.token`. Sem token configurado → `503`; token inválido → `401`. Responde `200` com o resumo (`groups`, `events`, `forumReplies`, `votes`). |
| `GET`  | `/actuator/health`    | Health check.                                                       |
| `GET`  | `/actuator/info\|metrics` | Info e métricas.                                                 |

A comparação do token é feita em **tempo constante** (`MessageDigest.isEqual`) para
evitar *timing attack*.

```bash
curl -X POST http://localhost:8082/admin/reconcile -H "X-Admin-Token: $RECONCILER_ADMIN_TOKEN"
```

---

## Agendamento

`CounterReconciliationJob.scheduledReconcile()` roda no cron
`reconciler.reconciliation.cron` (padrão **de hora em hora**, minuto 0) e loga o
relatório (`groups`, `events`, `forum_topics(replyCount)`, `votos`). Sendo idempotente,
a frequência é segura de ajustar conforme a tolerância a *drift* e o custo das varreduras.
