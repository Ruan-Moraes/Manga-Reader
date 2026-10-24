# Backend — `api/`

O backend é composto por cinco aplicações Spring Boot independentes. Elas não
compartilham JARs de produção: contratos mínimos necessários aos jobs são
replicados ou estabelecidos por banco e mensageria. O módulo interno
`libs/testing-support` é uma exceção deliberada, restrita a utilitários de testes.

## Serviços

| Serviço                                                           | Porta | Responsabilidade                                                              |
| ----------------------------------------------------------------- | ----: | ----------------------------------------------------------------------------- |
| [`apps/core/`](apps/core/README.md)                                         |  8080 | API REST principal e escrita dos dados de negócio                             |
| [`apps/jobs/rating-aggregator/`](apps/jobs/rating-aggregator/README.md)     |  8081 | Projeção `reviews_aggregate` por eventos e reconciliação                      |
| [`apps/jobs/orphan-cleaner/`](apps/jobs/orphan-cleaner/README.md)           |  8082 | Reconciliação de contadores e limpeza de referências órfãs                    |
| [`apps/jobs/trending-aggregator/`](apps/jobs/trending-aggregator/README.md) |  8083 | Projeção diária `title_trend_daily`                                           |
| [`apps/translation-gateway/`](apps/translation-gateway/README.md)           |  8084 | Fronteira privada e idempotente do processamento remoto mobile; em construção |

## Infraestrutura compartilhada

O arquivo [`core/docker-compose.yml`](core/docker-compose.yml) define o ambiente
local:

| Serviço       |  Porta local | Uso                            |
| ------------- | -----------: | ------------------------------ |
| PostgreSQL 17 |         5432 | Dados relacionais              |
| MongoDB 8.0   |        27017 | Catálogo, conteúdo e projeções |
| Neo4j 5.26    |  7474 / 7687 | Grafo social                   |
| RabbitMQ 4    | 5672 / 15672 | Eventos assíncronos            |
| Redis 7       |         6379 | Cache                          |

O `spring-boot-docker-compose` do core inicia e encerra essa infraestrutura no
desenvolvimento. Os jobs mantêm `spring.docker.compose.enabled=false` e apenas se
conectam aos serviços já disponíveis.

## Execução local

Todos os módulos usam **JDK 25**. Execute Maven com `JAVA_HOME` e o Maven Runner
do IntelliJ apontando para essa versão. Core/jobs usam Spring Boot 3.5.16,
compatível com Java 25; o gateway mantém seu parent independente Boot 4.1.1.
As imagens Docker de build e runtime da Core e dos jobs também usam Java 25.
Referências de compatibilidade: [Spring Boot 3.5](https://docs.spring.io/spring-boot/3.5/system-requirements.html)
e [JaCoCo](https://www.jacoco.org/jacoco/trunk/doc/changes.html).

Os comandos da Core e dos jobs incluem `-am test-compile`: o Maven compila
`libs/testing-support` no mesmo reactor antes de iniciar o serviço escolhido.
Isso funciona em um clone novo, sem `mvn install` prévio. O agregador e a
biblioteca pulam o goal `spring-boot:run`; apenas a aplicação selecionada inicia.
Use os mesmos comandos nas configurações Maven pessoais do IntelliJ. As
configurações compartilhadas em [`../.run/`](../.run/README.md) já incluem essa preparação.

### API principal

```bash
cd api
./mvnw -pl apps/core -am test-compile spring-boot:run
```

Use `-Dspring-boot.run.profiles=dev` quando quiser executar os seeds de
demonstração. Mais detalhes em [`core/README.md`](core/README.md).

### Jobs

Os jobs não possuem Maven Wrapper próprio. Com Maven 3.9.x instalado, execute o
comando na pasta do serviço:

```bash
cd api
./mvnw -pl apps/jobs/rating-aggregator -am test-compile spring-boot:run
```

Substitua a pasta pelo job desejado. PostgreSQL, MongoDB e/ou RabbitMQ devem
estar acessíveis antes da inicialização; consulte o README de cada serviço.

### Gateway de tradução

```bash
cd api
./mvnw -pl apps/translation-gateway spring-boot:run
```

O gateway possui banco PostgreSQL próprio e ainda não integra o Compose da Core
nem a stack de produção. Nenhum upload real está habilitado nesta fase.

## Testes e build

```bash
# Todos os módulos (recomendado; resolve testing-support no reactor)
cd api
./mvnw test
./mvnw package -DskipTests

# Apenas core e suas dependências de teste
./mvnw -pl apps/core -am test

# Um job e suas dependências de teste
./mvnw -pl apps/jobs/trending-aggregator -am test
```

A suíte completa do core usa Testcontainers. As convenções por camada ficam em
[`../docs/testing.md`](../docs/testing.md).

Regressão dos cinco fluxos de inicialização do IntelliJ, com build limpo e
repositório Maven sem artefatos `com.toonlira` (não inicia bancos nem serviços):

```bash
python3 api/scripts/tests/test_reactor_run.py # a partir da raiz do monorepo
```

Esse teste usa Java, Python 3 e o cache Maven de dependências externas, previamente
preenchido por um build normal; executa Maven offline e substitui o main por uma
sonda que encerra imediatamente. `MAVEN_TEST_CACHE` permite indicar outro cache.

`libs/testing-support` não é uma aplicação nem é publicado em produção: é um JAR
interno para fixtures e fábricas compartilhadas de Testcontainers. Execute os
testes pelo reactor acima para que o Maven o compile antes dos consumidores.

## Produção

[`docker-compose.prod.yml`](docker-compose.prod.yml) constrói e executa o core,
os três jobs e a infraestrutura. O gateway de tradução ainda não faz parte
deste Compose e não deve ser exposto como serviço disponível:

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
- `translation-gateway` é isolado da Core e será dono de identidade anônima,
  idempotência e jobs privados de tradução; seu contrato permanece fail-closed
  enquanto os gates legais/cloud estiverem abertos.
- Mudanças de persistência devem seguir
  [`../docs/orm-persistence.md`](../docs/orm-persistence.md) e
  [`../docs/database-modeling.md`](../docs/database-modeling.md).

[Voltar ao README principal](../README.md)
