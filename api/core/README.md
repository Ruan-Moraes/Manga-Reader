# API principal — `api/core`

Aplicação Spring Boot responsável pelos endpoints REST e pelas escritas de
negócio do Manga Reader. Usa Clean Architecture, persistência poliglota e
publica eventos para os jobs auxiliares.

## Responsabilidades

- autenticação, usuários e perfis;
- catálogo, capítulos, biblioteca e histórico;
- avaliações, comentários, fórum, grupos, eventos e notícias;
- autores, editoras, lojas, assinaturas e pagamentos;
- grafo social em Neo4j;
- leitura das projeções de avaliações e tendências mantidas pelos jobs.

A referência dos endpoints é gerada pelo próprio código:

- Swagger UI: `http://localhost:8080/swagger-ui`
- OpenAPI JSON: `http://localhost:8080/api-docs`

## Arquitetura

```text
presentation  -> controllers, DTOs e mappers
application   -> use cases, ports e serviços de aplicação
domain        -> entidades, value objects e regras de negócio
infrastructure-> adapters de persistência, segurança, mensageria, e-mail e seeds
shared        -> contratos e componentes transversais
```

A dependência flui para o domínio. Consulte
[`../../docs/architecture.md`](../../docs/architecture.md) antes de criar ou
mover componentes.

## Profiles

| Profile | Uso |
|---|---|
| padrão | Desenvolvimento local sem seeds; o Spring gerencia `docker-compose.yml` |
| `dev` | Desenvolvimento local com os seeds anotados com `@Profile("dev")` |
| `prod` | Conexões e secrets por variáveis de ambiente; Docker Compose do Spring desativado |
| `test` | Testes automatizados |
| `jwt-test` | Teste manual com expiração curta dos tokens |

## Execução local

Requisitos: Java 23 e Docker.

```bash
cd api/core
./mvnw spring-boot:run
```

Com dados de demonstração:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Na primeira execução, o Spring Boot inicia PostgreSQL, MongoDB, Neo4j,
RabbitMQ e Redis a partir de [`docker-compose.yml`](docker-compose.yml).

Se parte do Compose já estiver ativa e um serviço tiver sido acrescentado
depois, suba a infraestrutura completa antes de iniciar a API:

```bash
docker compose up -d
```

## Configuração

O desenvolvimento usa defaults seguros apenas para a máquina local. O profile
`prod` lê as seguintes variáveis:

| Variável | Finalidade |
|---|---|
| `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | PostgreSQL |
| `MONGODB_URI` | MongoDB |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` | Redis |
| `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` | Neo4j |
| `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD` | RabbitMQ |
| `JWT_SECRET` | Assinatura dos tokens JWT |
| `AUTH_COOKIE_SECURE` | Flag `Secure` do cookie de refresh |
| `CORS_ALLOWED_ORIGINS` | Origens permitidas |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP |
| `MAIL_FROM`, `MAIL_ADMIN`, `APP_BASE_URL` | Remetente, destinatário administrativo e links enviados |

[`.env.example`](.env.example) documenta valores esperados pelo core, mas não
substitui a matriz completa da stack em
[`../docker-compose.prod.yml`](../docker-compose.prod.yml).

## Contrato de resposta

Resposta simples:

```json
{
  "data": {},
  "success": true,
  "message": "...",
  "statusCode": 200
}
```

Listagens paginadas retornam `ApiResponse<PageResponse<T>>`:

```json
{
  "data": {
    "content": [],
    "page": 0,
    "size": 20,
    "totalElements": 0,
    "totalPages": 0,
    "last": true
  },
  "success": true
}
```

Filtros, rotas e schemas específicos devem ser consultados no Swagger, evitando
duplicar uma lista de endpoints neste arquivo.

## Testes e build

```bash
./mvnw test                                         # suíte completa
./mvnw test -Dtest.excludedGroups=testcontainers   # exclui grupos marcados
./mvnw test -Dtest=UserTest                         # classe
./mvnw test -Dtest=UserTest#nomeDoMetodo            # método
./mvnw test -Dtest=**/domain/**/*Test               # recorte por pacote
./mvnw package -DskipTests                          # JAR
```

A suíte completa requer Docker para PostgreSQL, MongoDB e Neo4j via
Testcontainers. Convenções e limitações:
[`../../docs/testing.md`](../../docs/testing.md).

## Persistência e integrações

- Flyway gerencia o schema PostgreSQL.
- Mongock gerencia coleções e índices MongoDB.
- O schema mínimo do Neo4j é inicializado no startup.
- RabbitMQ publica eventos consumidos por projeções e pelo feed de atividades.
- Redis armazena caches temporários.
- Escritas entre tecnologias não formam uma transação distribuída.

Antes de qualquer alteração nessa área, leia
[`../../docs/orm-persistence.md`](../../docs/orm-persistence.md) e
[`../../docs/database-modeling.md`](../../docs/database-modeling.md).

## Links relacionados

- [Visão do backend](../README.md)
- [Rating Aggregator](../jobs/rating-aggregator/README.md)
- [Orphan Cleaner](../jobs/orphan-cleaner/README.md)
- [Trending Aggregator](../jobs/trending-aggregator/README.md)
- [Documentação do projeto](../../docs/README.md)
