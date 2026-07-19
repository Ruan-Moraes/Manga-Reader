# Trending Aggregator — `api/jobs/trending-aggregator`

Job diário que calcula rankings de crescimento das obras e mantém a projeção
MongoDB `title_trend_daily`. A API principal apenas lê o snapshot mais recente;
não recalcula tendências durante uma request.

## Propósito

O serviço compara janelas consecutivas de 1, 7 e 30 dias usando dias UTC
completos. Para cada obra, combina volume e crescimento de cinco sinais:

| Sinal | Fonte | Peso padrão |
|---|---|---:|
| Leituras | MongoDB `user_chapter_reads.readAt` | 45% |
| Adições à biblioteca | PostgreSQL `user_libraries.saved_at` | 25% |
| Avaliações | MongoDB `reviews.createdAt` | 15% |
| Comentários em títulos | MongoDB `comments.createdAt` com `targetType=TITLE` | 10% |
| Lançamentos | MongoDB `chapters.releaseDate` | 5% |

Os pesos devem ser finitos, não negativos e somar 1. O volume usa escala
logarítmica; o crescimento é limitado e ponderado por uma confiança que aumenta
até 20 interações, reduzindo distorções de amostras pequenas.

## Fluxo

```text
TrendingAggregationJob / POST /admin/reconcile
                    -> RecalculateTrendingUseCase
                       -> TrendSignalReader (PostgreSQL + MongoDB)
                       -> TrendScoreCalculator
                       -> TrendSnapshotAdapter (title_trend_daily)
```

O snapshot usa a data como chave lógica e é substituído de forma idempotente.
Os índices são criados pelo Mongock; um TTL remove snapshots antigos conforme a
retenção configurada.

## Dependências

- Java 23 e Maven 3.9.x;
- PostgreSQL 17;
- MongoDB 8.0;
- infraestrutura iniciada separadamente pelo `api/core`.

Stack: Spring Boot 3.4.3, Spring JDBC, Spring Data MongoDB, Mongock, Actuator e
JUnit 5.

## Configuração

Fonte: `src/main/resources/application.yml`. Todas as propriedades podem ser
sobrescritas por variáveis de ambiente via relaxed binding.

| Propriedade | Variável | Padrão |
|---|---|---|
| `server.port` | `SERVER_PORT` | `8083` |
| `spring.datasource.url` | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/mangareader` |
| `spring.datasource.username` | `SPRING_DATASOURCE_USERNAME` | `manga` |
| `spring.datasource.password` | `SPRING_DATASOURCE_PASSWORD` | `manga_secret` |
| `spring.data.mongodb.uri` | `SPRING_DATA_MONGODB_URI` | `mongodb://localhost:27017/mangareader` |
| `trending.schedule.cron` | `TRENDING_SCHEDULE_CRON` | `0 15 3 * * *` |
| `trending.zone` | `TRENDING_ZONE` | `America/Sao_Paulo` |
| `trending.retention-days` | `TRENDING_RETENTION_DAYS` | `90` |
| `trending.seed.enabled` | `TRENDING_SEED_ENABLED` | `true` |
| `trending.admin.token` | `TRENDING_ADMIN_TOKEN` | vazio; endpoint manual desativado |
| `trending.weights.*` | `TRENDING_WEIGHTS_*` | pesos da tabela anterior |

O seed local cria snapshots para até 12 títulos reais somente quando
`title_trend_daily` está vazia. O Compose de produção força
`TRENDING_SEED_ENABLED=false`.

## Execução

Suba a infraestrutura em outro terminal:

```bash
cd api/core
./mvnw spring-boot:run
```

Depois, a partir da raiz do repositório:

```bash
cd api/jobs/trending-aggregator
mvn spring-boot:run

# Build
mvn package -DskipTests
java -jar target/trending-aggregator-0.0.1-SNAPSHOT.jar

# Serviço isolado na stack de produção
cd ../..
docker compose -f docker-compose.prod.yml up -d trending-aggregator
```

## Testes

```bash
mvn test
mvn test -Dtest=TrendScoreCalculatorTest,RecalculateTrendingUseCaseTest
```

A suíte atual cobre cálculo, use case, persistência por adapter, contratos das
migrations, seed e endpoint administrativo sem depender de Testcontainers.

## Endpoints operacionais

| Método | Rota | Comportamento |
|---|---|---|
| `POST` | `/admin/reconcile` | Recalcula o snapshot. Exige `X-Admin-Token`; retorna `503` sem token configurado, `401` com token inválido e `200` com `{"titlesProcessed": N}` em sucesso. |
| `GET` | `/actuator/health` | Health check |
| `GET` | `/actuator/info` | Informações do serviço |
| `GET` | `/actuator/metrics` | Métricas do Actuator |

```bash
curl -X POST http://localhost:8083/admin/reconcile \
  -H "X-Admin-Token: $TRENDING_ADMIN_TOKEN"
```

O token é comparado em tempo constante.

## Consumo pela API

```http
GET /api/trending?window=DAY|WEEK|MONTH&ranking=SCORE|READS|REVIEWS|LIBRARY_ADDS&limit=30
```

`limit` aceita valores de 1 a 100. Cada item inclui o volume e o crescimento
geral e por sinal. Títulos removidos são filtrados pela API principal.

## Agendamento e retenção

O cálculo roda por padrão todos os dias às 03:15 em `America/Sao_Paulo`. O fuso
define apenas o disparo; as janelas analisadas continuam baseadas em dias UTC
adjacentes. Snapshots expiram após 90 dias por padrão e podem ser reconstruídos
a partir das fontes.

## Links relacionados

- [Visão do backend](../../README.md)
- [API principal](../../core/README.md)
- [Rating Aggregator](../rating-aggregator/README.md)
- [Orphan Cleaner](../orphan-cleaner/README.md)
- [Arquitetura](../../../docs/architecture.md)
