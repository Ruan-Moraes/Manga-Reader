# Backend — `api/`

O backend é composto por quatro aplicações Spring Boot independentes. Elas não
compartilham JARs: contratos mínimos necessários aos jobs são replicados ou
estabelecidos por banco e mensageria.

## Serviços

| Serviço | Porta | Responsabilidade |
|---|---:|---|
| [`core/`](core/README.md) | 8080 | API REST principal e escrita dos dados de negócio |
| [`jobs/rating-aggregator/`](jobs/rating-aggregator/README.md) | 8081 | Projeção `reviews_aggregate` por eventos e reconciliação |
| [`jobs/orphan-cleaner/`](jobs/orphan-cleaner/README.md) | 8082 | Reconciliação de contadores e limpeza de referências órfãs |
| [`jobs/trending-aggregator/`](jobs/trending-aggregator/README.md) | 8083 | Projeção diária `title_trend_daily` |

## Infraestrutura compartilhada

O arquivo [`core/docker-compose.yml`](core/docker-compose.yml) define o ambiente
local:

| Serviço | Porta local | Uso |
|---|---:|---|
| PostgreSQL 17 | 5432 | Dados relacionais |
| MongoDB 8.0 | 27017 | Catálogo, conteúdo e projeções |
| Neo4j 5.26 | 7474 / 7687 | Grafo social |
| RabbitMQ 4 | 5672 / 15672 | Eventos assíncronos |
| Redis 7 | 6379 | Cache |

O `spring-boot-docker-compose` do core inicia e encerra essa infraestrutura no
desenvolvimento. Os jobs mantêm `spring.docker.compose.enabled=false` e apenas se
conectam aos serviços já disponíveis.

## Execução local

### API principal

```bash
cd api/core
./mvnw spring-boot:run
```

Use `-Dspring-boot.run.profiles=dev` quando quiser executar os seeds de
demonstração. Mais detalhes em [`core/README.md`](core/README.md).

### Jobs

Os jobs não possuem Maven Wrapper próprio. Com Maven 3.9.x instalado, execute o
comando na pasta do serviço:

```bash
cd api/jobs/rating-aggregator
mvn spring-boot:run
```

Substitua a pasta pelo job desejado. PostgreSQL, MongoDB e/ou RabbitMQ devem
estar acessíveis antes da inicialização; consulte o README de cada serviço.

## Testes e build

```bash
# Core
cd api/core
./mvnw test
./mvnw package -DskipTests

# Um job
cd ../jobs/trending-aggregator
mvn test
mvn package -DskipTests
```

A suíte completa do core usa Testcontainers. As convenções por camada ficam em
[`../docs/testing.md`](../docs/testing.md).

## Produção

[`docker-compose.prod.yml`](docker-compose.prod.yml) constrói e executa o core,
os três jobs e a infraestrutura:

```bash
cd api
docker compose -f docker-compose.prod.yml up -d
```

Variáveis exigidas ou aceitas pelo Compose:

- bancos e mensageria: `DATABASE_PASSWORD`, `RABBITMQ_PASSWORD`,
  `REDIS_PASSWORD`, `NEO4J_PASSWORD`;
- autenticação: `JWT_SECRET`;
- CORS e URLs: `CORS_ALLOWED_ORIGINS`, `APP_BASE_URL`;
- e-mail: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`,
  `MAIL_FROM`;
- endpoints administrativos: `AGGREGATOR_ADMIN_TOKEN`,
  `RECONCILER_ADMIN_TOKEN`, `TRENDING_ADMIN_TOKEN`;
- tendências: `TRENDING_RETENTION_DAYS`.

O `.env.example` em `core/` cobre apenas parte da configuração do core e não é
um template completo da stack. O Compose de produção é uma base: antes de
exposição real, devem ser tratados secrets, TLS, restrição de portas,
autenticação dos bancos, replica set do MongoDB, backups e observabilidade.

Plano de implantação: [`../docs/deployment-plan.md`](../docs/deployment-plan.md).

## Regras arquiteturais

- A API principal é dona das escritas de negócio.
- `rating-aggregator` é dono da projeção `reviews_aggregate`.
- `trending-aggregator` é dono da projeção `title_trend_daily`.
- `orphan-cleaner` corrige deriva; não substitui a consistência no caminho
  principal dos use cases.
- Mudanças de persistência devem seguir
  [`../docs/orm-persistence.md`](../docs/orm-persistence.md) e
  [`../docs/database-modeling.md`](../docs/database-modeling.md).

[Voltar ao README principal](../README.md)
