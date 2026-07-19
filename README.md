# Manga Reader

Plataforma para leitura de mangás, manhwas e manhuas, com catálogo, leitor,
biblioteca, avaliações, notícias, grupos, fórum, eventos, assinaturas e loja.

O projeto é um monorepo composto por uma API Spring Boot, três jobs auxiliares,
duas aplicações web e um aplicativo mobile em Expo.

## Arquitetura

- **Backend:** Clean Architecture em quatro camadas, com ports and adapters.
- **Persistência:** PostgreSQL para dados relacionais, MongoDB para catálogo e
  conteúdo, Neo4j para o grafo social e Redis para cache.
- **Mensageria:** RabbitMQ integra a API principal e projeções assíncronas.
- **Web e mobile:** organização modular inspirada em Feature-Sliced Design
  (FSD); a landing page usa uma estrutura simplificada própria.

Visão detalhada: [`docs/architecture.md`](docs/architecture.md).

## Estrutura do repositório

```text
Manga-Reader/
├── api/
│   ├── core/                         # API principal — porta 8080
│   ├── jobs/
│   │   ├── rating-aggregator/        # Agregados de avaliações — porta 8081
│   │   ├── orphan-cleaner/           # Reconciliação e limpeza — porta 8082
│   │   └── trending-aggregator/      # Rankings de tendência — porta 8083
│   └── docker-compose.prod.yml       # Base da stack de produção
├── web/
│   ├── manga-reader/                 # Aplicação React principal
│   ├── landing-page/                 # Landing page
│   ├── packages/                     # Pacotes compartilhados
│   └── scripts/                      # Ferramentas do workspace
├── mobile/                           # React Native + Expo
└── docs/                             # Guias normativos e documentos de apoio
```

Documentação por área:

- [Backend](api/README.md)
- [Workspace web](web/README.md)
- [Aplicativo mobile](mobile/README.md)
- [Índice completo da documentação](docs/README.md)

## Pré-requisitos

| Ferramenta | Uso |
|---|---|
| Java 23 | API e jobs Spring Boot |
| Docker e Docker Compose | Bancos, mensageria, cache e testes de integração |
| Node.js 20 ou superior | Aplicações web |
| pnpm 9 ou superior | Workspace web e aplicativo mobile |
| Maven 3.9.x | Jobs auxiliares; o core possui Maven Wrapper |

## Configuração inicial

### Backend

O profile padrão conecta-se à infraestrutura definida em
`api/core/docker-compose.yml`. O Spring Boot gerencia esse Compose durante a
execução local.

```bash
cd api/core
./mvnw spring-boot:run
```

Para carregar os dados de demonstração, ative explicitamente o profile `dev`:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui`
- OpenAPI JSON: `http://localhost:8080/api-docs`

Configuração, profiles e variáveis: [`api/core/README.md`](api/core/README.md).

### Web

```bash
cd web
pnpm install
pnpm dev:app       # aplicação principal em http://localhost:5173
pnpm dev:landing   # landing page em http://localhost:5174
```

Durante o desenvolvimento, as duas aplicações encaminham `/api` para
`http://localhost:8080`.

### Mobile

```bash
cd mobile
pnpm install
pnpm dev
```

Em dispositivo físico, configure `EXPO_PUBLIC_API_URL` com um endereço da API
acessível pelo dispositivo. Consulte [`mobile/README.md`](mobile/README.md).

## Testes e verificações

### API principal

```bash
cd api/core
./mvnw test                                      # suíte completa; requer Docker
./mvnw test -Dtest.excludedGroups=testcontainers # suíte sem grupos de containers
```

### Web

```bash
cd web/manga-reader
npx tsc -b
npm run lint:fsd
npx vitest run --pool=forks

cd ../landing-page
npx vitest run
```

### Mobile

```bash
cd mobile
pnpm check
```

As convenções e limitações conhecidas estão em
[`docs/testing.md`](docs/testing.md). Resultados de uma execução são evidência
pontual e não são mantidos como contagens fixas neste README.

## Produção

`api/docker-compose.prod.yml` é uma base para a stack backend, não uma receita
de produção pronta. Segurança de rede, autenticação dos bancos, replica set do
MongoDB, secrets, TLS, observabilidade, backups e CI/CD precisam ser definidos
para o ambiente de destino.

Consulte [`docs/deployment-plan.md`](docs/deployment-plan.md) e as pendências em
[`docs/tech-debt.md`](docs/tech-debt.md).

## Documentação

Os guias em `docs/` são normativos. Antes de modificar uma área, consulte o
[índice da documentação](docs/README.md) e o README do módulo correspondente.

A auditoria de 2 de julho de 2026 está preservada em
[`docs/audits/2026-07-02-project-audit.md`](docs/audits/2026-07-02-project-audit.md)
como registro histórico; não deve ser usada como fonte do estado operacional
atual.

---

Projeto pessoal de estudo — Ruan.
