# Orphan Cleaner — `api/jobs/orphan-cleaner`

Serviço dedicado às **redes de segurança entre Postgres e Mongo** da plataforma Manga
Reader. Roda fora da API principal e cobre duas formas de divergência no *dual-DB*:

1. **Reconciliação de contadores desnormalizados** (de hora em hora) — recalcula cada
   contador a partir de sua fonte de verdade, corrigindo o *drift* acumulado pelos
   incrementos sem risco de *double-count*.
2. **Limpeza de referências órfãs cross-DB** (diária) — apaga as linhas Postgres cujo
   `title_id` aponta para um título que não existe mais no Mongo.

> O nome reflete a responsabilidade mais visível (limpeza de órfãos); a reconciliação de
> contadores é a outra metade do mesmo princípio — *safety net* idempotente no caminho frio.

---

## Propósito

### 1. Contadores desnormalizados

Vários agregados do Manga Reader mantêm **contadores desnormalizados** para evitar
`COUNT(*)` em toda leitura (ex.: total de obras de um grupo, inscritos de um evento,
respostas de um tópico, votos de um comentário). Esses contadores são mantidos por
**incremento** pelos use cases da API principal (`+1` no add, `-1` no remove) e divergem ao
longo do tempo — evento perdido, exceção no meio de uma operação, escrita concorrente,
seed/migração. Este serviço recalcula cada um a partir de sua fonte real
(`SET contador = COUNT(fonte)`).

### 2. Referências órfãs cross-DB

Os títulos vivem no Mongo (coleção `titles`, `_id`); várias tabelas Postgres os referenciam
por `title_id` **sem FK física** (impossível entre bancos). Quando um título é apagado do
Mongo fora do fluxo do use case (script, migração, delete direto, bug), as linhas filhas no
Postgres ficam órfãs. A limpeza síncrona no `DeleteTitleUseCase` da API cobre o caminho
normal; **este job é a rede de segurança** para todo o resto.

Por que um serviço separado (e não dentro da API):

- **Isolamento de carga** — varreduras não competem por CPU/heap com o tráfego de request.
- **Responsabilidade única** — a API mantém contadores/refs no caminho quente; este serviço
  só concilia/limpa no caminho frio.
- Espelha o serviço irmão [`rating-aggregator`](../rating-aggregator/README.md) (mesmo padrão).

---

## O que é reconciliado / limpo

### Contadores (`SET = COUNT`, de hora em hora)

| Fonte    | Contador (alvo)                  | Recalculado a partir de                          |
|----------|----------------------------------|--------------------------------------------------|
| Postgres | `groups.total_titles`            | `COUNT(group_works)` por grupo                   |
| Postgres | `events.participants`            | `COUNT(event_participants)` por evento           |
| Mongo    | `forum_topics.replyCount`        | `COUNT(comments WHERE targetType=FORUM_TOPIC)`   |
| Mongo    | `comments.upvotes/downvotes`     | `COUNT(comments_votes)` por valor UP/DOWN        |
| Mongo    | `reviews.upvotes/downvotes`      | `COUNT(reviews_votes)` por valor UP/DOWN         |
| Mongo    | `forum_topics.upvotes/downvotes` | `COUNT(forum_topics_votes)` por valor UP/DOWN    |

### Órfãos cross-DB (`DELETE` por `title_id` ausente, diário)

Tabelas Postgres varridas (todas com ref `title_id` sem FK física):

`user_libraries`, `group_works`, `store_titles`, `title_authors`, `title_publishers`.

Após limpar `group_works`, `groups.total_titles` é reconciliado na mesma passada.

Toda operação é **idempotente**: rodar duas vezes seguidas dá o mesmo resultado, sem efeito
cumulativo.

---

## Arquitetura

Job orquestrador fino + um *reconciler* por fonte (Responsabilidade Única). O job só
coordena e reporta; cada *reconciler* sabe falar com seu banco.

```
CounterReconciliationJob          scheduling/      orquestra + agenda (@Scheduled)
 ├─ PostgresCounterReconciler     infrastructure/postgres/  SQL nativo (JdbcTemplate)
 ├─ ForumReplyCountReconciler     infrastructure/mongo/     replyCount dos tópicos
 ├─ VoteCounterReconciler         infrastructure/mongo/     upvotes/downvotes (3 pais)
 └─ OrphanTitleRefReconciler      infrastructure/crossdb/   DELETE de title_id órfão (Postgres×Mongo)
AdminReconcileController          web/             gatilho manual POST /admin/reconcile
ReconciliationReport             scheduling/      record com os contadores afetados
```

A lógica de negócio vive em `CounterReconciliationJob.reconcile()` (contadores) e
`reconcileOrphans()` (órfãos) — **testáveis sem o agendador**; os métodos `@Scheduled`
apenas as disparam e logam.

### Como cada reconciler funciona

- **PostgresCounterReconciler** — dois `UPDATE ... SET contador = (SELECT COUNT(*) ...)`
  correlatos via `JdbcTemplate` (SQL nativo, sem entidades JPA — o serviço não precisa do
  grafo de domínio).
- **ForumReplyCountReconciler** — agregação em `comments` agrupando por `targetId`
  (filtrado por `targetType = FORUM_TOPIC`) + *bulk update* em `forum_topics`. Tópicos sem
  resposta voltam a `0`.
- **VoteCounterReconciler** — para cada um dos três pais votáveis (`VOTABLE_PARENTS`), agrega
  `<pai>_votes` somando UP/DOWN condicionalmente e faz *bulk update*. Pais **sem voto algum**
  mas com contador `> 0` são zerados via `$nin`. IDs de pai aceitam `ObjectId` ou `String`
  (seeds/UUIDs migrados do Postgres).
- **OrphanTitleRefReconciler** — coleta os `title_id` distintos das 5 tabelas de ref,
  confere quais ainda existem em `titles` (batch `$in`, tratando `_id` `ObjectId` **ou**
  `String`) e apaga, em lotes, as linhas dos `title_id` ausentes. **Guard anti-wipe:** se há
  refs mas o Mongo não devolve **nenhum** título existente, aborta sem apagar nada (mais
  provável falha de conexão do que 100% de órfãos).

---

## Dependências

- **PostgreSQL 17** — fonte de `groups`/`events` + tabelas de ref `title_id` (leitura das
  fontes + update dos contadores + delete dos órfãos).
- **MongoDB 8.0** — fonte de `comments`/`forum_topics`/`reviews`, coleções de voto e
  `titles` (verificação de existência).
- A infra é **subida pela API principal** (`api/core`, via `spring-boot-docker-compose`);
  este serviço apenas se conecta. Por isso `spring.docker.compose.enabled=false`.
- Contadores e refs são **mantidos** pelos use cases do `api/core`; este serviço só os
  corrige/limpa.

Stack: Spring Boot 3.4.3, Java 23, Spring Data MongoDB, Spring JDBC, Actuator, Lombok.
Testes: JUnit 5, Mockito, Testcontainers (Postgres + Mongo).

---

## Configuração

Definida em [`src/main/resources/application.yml`](src/main/resources/application.yml)
e sobrescrita por variáveis de ambiente via relaxed binding. Um arquivo `.env`
opcional no diretório de execução também é carregado como properties.

| Propriedade                       | Env                          | Default                                         |
|-----------------------------------|------------------------------|-------------------------------------------------|
| `server.port`                     | `SERVER_PORT`                | `8082`                                          |
| `spring.datasource.url`           | `SPRING_DATASOURCE_URL`      | `jdbc:postgresql://localhost:5432/mangareader`  |
| `spring.datasource.username`      | `SPRING_DATASOURCE_USERNAME` | `manga`                                         |
| `spring.datasource.password`      | `SPRING_DATASOURCE_PASSWORD` | `manga_secret`                                  |
| `spring.data.mongodb.uri`         | `SPRING_DATA_MONGODB_URI`    | `mongodb://localhost:27017/mangareader`         |
| `reconciler.reconciliation.cron`  | `RECONCILER_RECONCILIATION_CRON` | `0 0 * * * *` (contadores, de hora em hora) |
| `reconciler.orphan.cron`          | `RECONCILER_ORPHAN_CRON`     | `0 30 3 * * *` (órfãos, diária às 03:30)        |
| `reconciler.admin.token`          | `RECONCILER_ADMIN_TOKEN`     | *(vazio → endpoint manual desativado)*          |

> O namespace de propriedades (`reconciler.*`) e o env `RECONCILER_ADMIN_TOKEN` foram mantidos
> na renomeação do serviço para não quebrar configs de produção existentes.

---

## Execução

Pré-requisitos: Java 23, Maven 3.9.x, PostgreSQL e MongoDB. Para subir a
infraestrutura pelo core, execute em outro terminal:

```bash
cd api/core
./mvnw spring-boot:run
```

A partir da raiz do repositório:

```bash
# Local (dev)
cd api/jobs/orphan-cleaner
mvn spring-boot:run

# Build do JAR
mvn package -DskipTests
java -jar target/orphan-cleaner-0.0.1-SNAPSHOT.jar

# Docker (produção) — sobe junto da stack
cd ../..
docker compose -f docker-compose.prod.yml up -d orphan-cleaner
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
| `POST` | `/admin/reconcile`    | Gatilho **manual** de reconciliação **+ limpeza de órfãos**. Exige header `X-Admin-Token` = `reconciler.admin.token`. Sem token configurado → `503`; token inválido → `401`. Responde `200` com o resumo (`groups`, `events`, `forumReplies`, `votes`, `orphanRefs`). |
| `GET`  | `/actuator/health`    | Health check.                                                       |
| `GET`  | `/actuator/info`         | Informações do serviço.                                          |
| `GET`  | `/actuator/metrics`      | Métricas do Actuator.                                            |

A comparação do token é feita em **tempo constante** (`MessageDigest.isEqual`) para evitar
*timing attack*.

```bash
curl -X POST http://localhost:8082/admin/reconcile -H "X-Admin-Token: $RECONCILER_ADMIN_TOKEN"
```

---

## Agendamento

- **Contadores** — `CounterReconciliationJob.scheduledReconcile()` no cron
  `reconciler.reconciliation.cron` (padrão **de hora em hora**, minuto 0) e loga o relatório
  (`groups`, `events`, `forum_topics(replyCount)`, `votos`).
- **Órfãos cross-DB** — `scheduledOrphanCleanup()` no cron `reconciler.orphan.cron` (padrão
  **diário às 03:30**). Mais pesado (full-scan por `title_id`) e sem urgência — daí separado e
  noturno.

Sendo idempotentes, ambas as frequências são seguras de ajustar conforme a tolerância a
*drift*/órfãos e o custo das varreduras.

## Links relacionados

- [Visão do backend](../../README.md)
- [API principal](../../core/README.md)
- [Rating Aggregator](../rating-aggregator/README.md)
- [Trending Aggregator](../trending-aggregator/README.md)
- [Arquitetura](../../../docs/architecture.md)
