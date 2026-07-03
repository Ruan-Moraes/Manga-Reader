# Manga Reader

> Plataforma de leitura de mangás, manhwas e manhuas com catálogo, comunidade (fórum, grupos, eventos), assinaturas, loja e sistema de avaliações.

Monorepo com backend Spring Boot (Clean Architecture, dual-DB PostgreSQL + MongoDB), frontend React (pnpm workspace, FSD) e app mobile React Native/Expo.

---

## Status do Projeto

| | |
|---|---|
| **Etapa atual** | **Fase 9 — Qualidade e polish** (web) · Fase 1 — Auth (mobile) |
| **Próxima etapa** | Fase 10 — Produção |

```
[✅] Fase 1-5: Backend (domínios, use cases, endpoints, security, infra)
[✅] Fase 6:   Frontend UI (páginas, features, layout, guards)
[✅] Fase 7:   Testes do backend (domain, application, presentation, infra JPA+MongoDB, Security E2E)
[✅] Fase 8:   Integração frontend ↔ backend (features com API real)
[🔄] Fase 9:   Qualidade e polish ← ETAPA ATUAL
[🔲] Fase 10:  Produção (CI/CD, infra cloud, deploy, monitoramento)
```

**Saúde dos gates (medição 2026-07-02):**

| Gate | Estado |
|------|--------|
| Backend `mvn test` | ✅ última suíte completa registrada verde (1198 testes, 2026-06-23) · suíte leve (`-Dtest.excludedGroups=testcontainers`) verde — 1080 testes (DT-54 resolvido em 2026-07-02) |
| Web `tsc -b` (manga-reader) | ✅ 0 erros (gate corrigido em 2026-07-02: `tsc --noEmit` puro era vácuo — tsconfig raiz com `files: []`) |
| Web `lint:fsd` (steiger) | ✅ verde |
| Web testes (manga-reader) | ✅ verde — 923 testes / 137 arquivos (DT-53 resolvido em 2026-07-02) |
| Web testes (landing-page) | ✅ verde |

> Estado geral, riscos e plano de correção: [`PROJECT_AUDIT.md`](PROJECT_AUDIT.md).
> Dívidas técnicas: [`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md) (visão consolidada) e [`docs/tech-debt.md`](docs/tech-debt.md) (log detalhado por item).

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Pré-requisitos](#4-pré-requisitos)
5. [Como Executar](#5-como-executar)
6. [Estrutura do Projeto](#6-estrutura-do-projeto)
7. [Testes](#7-testes)
8. [API — Endpoints](#8-api--endpoints)
9. [Sistema de Avaliações](#9-sistema-de-avaliações)
10. [Convenções](#10-convenções)
11. [Documentação](#11-documentação)

---

## 1. Visão Geral

| Métrica (medição 2026-07-02) | Valor |
|---------|-------|
| Domínios de negócio (backend) | **17 pacotes** — author, category, comment, errorlog, event, forum, group, label, library, manga, news, payment, publisher, review, store, subscription, user (Auth via Security) |
| Use Cases | **154** |
| REST Controllers | **30** |
| Repositórios JPA (PostgreSQL) | **20** |
| Repositórios MongoDB | **13** |
| Migrations Flyway / Mongock | **37 / 20** |
| Serviços backend | **3** (`api/core` + 2 jobs standalone) |
| Apps frontend | **2** web (manga-reader, landing-page) + **1** mobile (Expo) |
| Idiomas suportados | **3** (pt-BR padrão/fallback, en-US, es-ES) |

> Estes números mudam com frequência. Ao citar em outro documento, datar a medição
> (comandos de contagem em [`PROJECT_AUDIT.md`](PROJECT_AUDIT.md)).

---

## 2. Arquitetura

### Backend — Clean Architecture (4 camadas)

```
┌─────────────────────────────────────────────────────────┐
│                    presentation/                         │
│              Controllers · DTOs · Mappers                │
├─────────────────────────────────────────────────────────┤
│                    application/                          │
│              Use Cases · Port Interfaces                 │
├─────────────────────────────────────────────────────────┤
│                     domain/                              │
│         Entities · Value Objects · Enums                 │
├─────────────────────────────────────────────────────────┤
│                  infrastructure/                         │
│  Persistence · Security · Email · Messaging · Seed       │
└─────────────────────────────────────────────────────────┘
```

Dependência flui para dentro: `presentation → application → domain ← infrastructure`.
Detalhes e key patterns: [`docs/architecture.md`](docs/architecture.md).

### Serviços de aplicação

| Serviço | Porta | Responsabilidade |
|---------|-------|------------------|
| [`api/core`](api/README.md) | 8080 | API principal (Clean Architecture) |
| [`api/jobs/rating-aggregator`](api/jobs/rating-aggregator/README.md) | 8081 | Agregação de avaliações (`reviews_aggregate`) — eventos RabbitMQ + reconciliação diária |
| [`api/jobs/orphan-cleaner`](api/jobs/orphan-cleaner/README.md) | 8082 | Reconciliação de contadores desnormalizados (horária) + limpeza de refs órfãs cross-DB (diária) |

### Dual Database

| Banco | Tech | Responsável por |
|-------|------|----------------|
| **PostgreSQL** | JPA/Hibernate + Flyway | users, groups, events, library, stores, tags, subscriptions, payments, authors/publishers, domain labels |
| **MongoDB** | Spring Data Mongo + Mongock | titles, chapters, comments (coleção unificada polimórfica), reviews, reviews_aggregate, forum_topics, votos (`<pai>_votes`), news, view history |

Critérios de escolha e modelagem: [`docs/database-modeling.md`](docs/database-modeling.md).

### Frontend — pnpm workspace ([`web/README.md`](web/README.md))

```
web/
├── manga-reader/      → app principal (FSD: app/pages/widgets/features/entities/shared)
├── landing-page/      → landing page (layout próprio simplificado)
├── packages/          → design-tokens, tsconfig, types (+ assets estáticos)
└── scripts/           → i18n-cleaner (auditoria de chaves órfãs)
```

### Mobile — React Native + Expo ([`mobile/README.md`](mobile/README.md))

Mesma arquitetura FSD do web, com fundação (tema, i18n, stores) implementada antes das telas. Em fase de Auth.

---

## 3. Stack Tecnológica

### Backend

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Java | 23 (Temurin) | Linguagem (target `java.version=23`) |
| Spring Boot | 3.4.3 | Framework core |
| Spring Security + jjwt | 6.x / 0.12.6 | Autenticação JWT |
| Spring Data JPA / MongoDB / Redis | — | Persistência + cache |
| Spring AMQP | — | Mensageria (RabbitMQ) |
| SpringDoc OpenAPI | 2.8.4 | Swagger UI |
| MapStruct | 1.6.3 | Mapeamento entity ↔ DTO |
| Bucket4j | 8.10.1 | Rate limiting |
| Flyway / Mongock | — / 5.5.0 | Migrations PostgreSQL / MongoDB |
| JaCoCo | 0.8.12 | Cobertura |
| TestContainers | 1.20.5 | Integração Mongo + Postgres (singleton por JVM) |
| Maven | 3.9.x (wrapper `./mvnw` incluído) | Build |

### Frontend web

| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| pnpm | ≥ 9 (workspace) | Gerenciador monorepo |
| React | 19.x | UI |
| TypeScript | 5.8.x | Tipagem |
| Vite | 6.x | Build/dev server (SWC) |
| TailwindCSS | 4.x | Estilos (tokens `mr-*`) |
| React Router | 6.x | Roteamento SPA |
| TanStack React Query | 5.x | Server state / cache |
| Axios | 1.x | HTTP client com interceptores |
| react-i18next | — | Internacionalização |
| Vitest 4 + Testing Library + MSW v2 + jest-axe | — | Testes |
| steiger | — | Boundary lint FSD |

### Mobile

React Native + Expo SDK, Expo Router, NativeWind, TanStack Query v5, Axios, React Hook Form + Zod, i18next, Expo SecureStore. Detalhes: [`mobile/README.md`](mobile/README.md).

### Infraestrutura (Docker Compose — `api/core/docker-compose.yml`)

| Serviço | Versão | Porta |
|---------|--------|-------|
| PostgreSQL | 17 (alpine) | 5432 |
| MongoDB | 8.0 (replica set de nó único — transações) | 27017 |
| RabbitMQ | 4 (management) | 5672 / 15672 |
| Redis | 7 (alpine) | 6379 |

Produção: `api/docker-compose.prod.yml` (core + rating-aggregator + orphan-cleaner).

---

## 4. Pré-requisitos

- **Docker** e **Docker Compose** (bancos + testes de integração)
- **Java 23** (Temurin): `sdk install java 23.0.2-tem`
- **Maven 3.9.x** — o `api/core` inclui o wrapper `./mvnw`; os jobs (`api/jobs/*`) usam `mvn` do sistema
- **Node.js ≥ 20** e **pnpm ≥ 9**: `npm i -g pnpm`

---

## 5. Como Executar

### Backend

```bash
cd api/core

# Contêineres Docker sobem automaticamente via spring-boot-docker-compose
./mvnw spring-boot:run
```

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- `DataSeeder` popula dados de demonstração (profile != prod)

Jobs auxiliares (exigem a infra do core no ar): ver READMEs de
[`rating-aggregator`](api/jobs/rating-aggregator/README.md) e
[`orphan-cleaner`](api/jobs/orphan-cleaner/README.md).

### Frontend web

```bash
cd web
pnpm install                      # instala todo o workspace

pnpm dev:app                      # app principal :5173 (proxy /api → :8080)
pnpm dev:landing                  # landing page
```

### Mobile

```bash
cd mobile
pnpm install
pnpm dev                          # Metro bundler (expo start --clear)
```

---

## 6. Estrutura do Projeto

```
Manga-Reader/
├── api/                          # Backend (ver api/README.md)
│   ├── core/                     # API principal — Spring Boot :8080
│   │   ├── docker-compose.yml    # Infra de desenvolvimento
│   │   ├── Dockerfile
│   │   └── src/main/java/com/mangareader/
│   │       ├── domain/           # 17 domínios — entities, VOs, enums
│   │       ├── application/      # use cases + port interfaces
│   │       ├── infrastructure/   # persistence (postgres/ + mongo/), security, email, messaging, seed
│   │       ├── presentation/     # controllers + DTOs + MapStruct mappers
│   │       └── shared/           # ApiResponse, PageResponse, i18n, exceptions, configs
│   ├── jobs/
│   │   ├── rating-aggregator/    # Serviço de agregação de avaliações :8081
│   │   └── orphan-cleaner/       # Reconciliação de contadores + órfãos cross-DB :8082
│   └── docker-compose.prod.yml   # Stack de produção (3 serviços)
│
├── web/                          # Frontend — pnpm workspace (ver web/README.md)
│   ├── manga-reader/             # App principal (FSD)
│   ├── landing-page/             # Landing page
│   ├── packages/                 # design-tokens, tsconfig, types, assets
│   └── scripts/                  # i18n-cleaner
│
├── mobile/                       # App React Native + Expo (ver mobile/README.md)
│
└── docs/                         # Guias normativos (arquitetura, ORM, testes, i18n, FSD, …)
```

---

## 7. Testes

### Backend

```bash
cd api/core
./mvnw test                                     # Suíte completa (requer Docker p/ TestContainers)
./mvnw test -Dtest.excludedGroups=testcontainers  # Suíte leve, SEM Docker
./mvnw test -Dtest=**/domain/**/*Test           # Por camada (domain/application/presentation/infrastructure)
```

| Camada | Anotação | Abordagem |
|--------|----------|-----------|
| Domain | Nenhuma | JUnit 5 puro, sem Spring |
| Application | `@ExtendWith(MockitoExtension)` | Mockito mocks dos ports |
| Presentation | `@WebMvcTest` + `@AutoConfigureMockMvc(addFilters=false)` | MockMvc + `@MockitoBean TokenPort` |
| Infrastructure JPA | `@DataJpaTest` + `@ActiveProfiles("test")` | H2 in-memory |
| Infrastructure MongoDB | `@DataMongoTest` + `@Import(MongoTestContainerConfig)` | TestContainers (mongo:8.0) |
| Security E2E | `@SpringBootTest` | Fluxo Auth completo (sign-up → login → JWT → refresh → /me) |

### Frontend web

```bash
cd web
pnpm test:app        # manga-reader (Vitest) — ⚠️ baseline quebrado, ver DT-53
pnpm test:landing    # landing-page (Vitest)
```

| Camada | Abordagem |
|--------|-----------|
| Services | MSW v2 + Vitest (intercepta Axios no nível de rede) |
| Hooks | `renderHookWithProviders` + React Query + MSW |
| Componentes | Testing Library + MSW + jest-axe (a11y por rota) |
| Utilities | Vitest puro |

### Pendente

- **Frontend E2E**: considerar Playwright para fluxos auth e navegação (DT-02).

Workflow, anotações e limitações conhecidas: [`docs/testing.md`](docs/testing.md).

---

## 8. API — Endpoints

São **30 controllers REST**. A referência completa e sempre atualizada está no **Swagger UI**:

> `http://localhost:8080/swagger-ui.html`

Grupos principais: `auth`, `titles`, `chapters`, `comments`, `reviews`, `library`, `groups`, `news`, `events`, `forum`, `stores`, `tags`, `labels`, `authors`, `publishers`, `subscriptions`, `users`, `stats`, `contact`, `admin/*`.

### Padrões de resposta

**Resposta simples** — `ApiResponse<T>`:
```json
{ "data": "T", "success": true, "message": "...", "statusCode": 200 }
```

**Resposta paginada** — `ApiResponse<PageResponse<T>>`:
```json
{ "data": { "content": [], "page": 0, "size": 20, "totalElements": 100, "totalPages": 5, "last": false }, "success": true }
```

Endpoints de listagem **devem** retornar `ApiResponse<PageResponse<T>>`; item único retorna `ApiResponse<T>`.

---

## 9. Sistema de Avaliações

Cada review (coleção `reviews`) possui notas por categoria — `funRating`, `artRating`, `storylineRating`, `charactersRating`, `originalityRating`, `pacingRating` — e `overallRating` (média das 6, calculada automaticamente), além de `reviewTitle`, `spoiler`, `textContent` e votos Útil/Contrário (`upvotes`/`downvotes`, coleção `reviews_votes`).

A **visão agregada por obra** (média, contagem, distribuição por estrela) vive na coleção `reviews_aggregate`, mantida pelo serviço dedicado [`rating-aggregator`](api/jobs/rating-aggregator/README.md) — recomputada em tempo real via eventos `rating.*` (RabbitMQ) e reconciliada diariamente. A API principal apenas **lê** o agregado (sem `AVG/COUNT` por request).

### Endpoints (`/api/reviews`)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/reviews/title/{id}` | Lista avaliações (paginado, filtro `?star=`, sort inclui `upvotes`) |
| `GET` | `/api/reviews/title/{id}/average` | Média de estrelas + contagem |
| `GET` | `/api/reviews/title/{id}/distribution` | Contagem por faixa de estrela (1–5) + total |
| `GET` | `/api/reviews/user` | Avaliações do usuário logado |
| `GET` | `/api/reviews/user/{userId}` | Avaliações de um usuário |
| `POST` | `/api/reviews` | Submete/atualiza avaliação (6 categorias + texto + título/spoiler) |
| `PUT` | `/api/reviews/{id}` | Atualiza avaliação |
| `DELETE` | `/api/reviews/{id}` | Remove avaliação |
| `POST` | `/api/reviews/{id}/vote` | Vota Útil/Contrário (`{value: "up"｜"down"}`, toggle; 1 voto/usuário; não vota a própria) |
| `DELETE` | `/api/reviews/{id}/vote` | Remove o voto do usuário |

---

## 10. Convenções

Os guias em `docs/` são **normativos** — ler o guia relevante antes de mexer na área:

- Arquitetura & key patterns → [`docs/architecture.md`](docs/architecture.md)
- ORM & persistência (checklist de merge) → [`docs/orm-persistence.md`](docs/orm-persistence.md)
- Modelagem de banco (obrigatório antes de entity/migration) → [`docs/database-modeling.md`](docs/database-modeling.md)
- Clean code & estilo (Tailwind `mr-*`, mobile-first, imports) → [`docs/clean-code.md`](docs/clean-code.md)
- Testes por camada → [`docs/testing.md`](docs/testing.md)
- Layout FSD do frontend → [`docs/source-layout.md`](docs/source-layout.md)
- i18n (UI × conteúdo, DB-labels) → [`docs/i18n-guide.md`](docs/i18n-guide.md)
- O que documentar por tipo de mudança → [`docs/documentation-policy.md`](docs/documentation-policy.md)

---

## 11. Documentação

| Documento | Descrição |
|-----------|-----------|
| [`CLAUDE.md`](CLAUDE.md) | Instruções de build/execução + índice dos guias normativos |
| [`PROJECT_AUDIT.md`](PROJECT_AUDIT.md) | Auditoria técnica: estado atual, riscos, plano de correção |
| [`TECHNICAL_DEBT.md`](TECHNICAL_DEBT.md) | Dívidas técnicas consolidadas por categoria |
| [`docs/tech-debt.md`](docs/tech-debt.md) | Log detalhado de dívidas (histórico por item DT-NN) |
| [`docs/deployment-plan.md`](docs/deployment-plan.md) | Plano de produção (infra, CI/CD, segurança) |
| [`api/README.md`](api/README.md) | Visão geral do backend (core + jobs) |
| [`web/README.md`](web/README.md) | Workspace frontend (apps, pacotes, scripts) |
| [`mobile/README.md`](mobile/README.md) | Arquitetura e fases do app mobile |
| [`web/manga-reader/src/i18n/locales/README.md`](web/manga-reader/src/i18n/locales/README.md) | Guia dos arquivos de tradução (react-i18next) |
| Swagger UI (`/swagger-ui.html`) | Referência viva da API REST |

---

Projeto pessoal de estudo — Ruan.
